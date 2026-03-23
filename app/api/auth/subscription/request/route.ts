import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectAdminDB } from "@/lib/db";
import { sendSubscriptionRequestEmail, sendSubscriptionQueuedEmail } from "@/lib/email";
import mongoose from "mongoose";
import type { ISubscriptionRequest } from "@/models/SubscriptionRequest";

const VALID_PLANS = ["pro-chat", "pro-query", "business"] as const;

function getRequestModel(conn: mongoose.Connection) {
  if (conn.models.SubscriptionRequest) return conn.models.SubscriptionRequest;
  const schema = new mongoose.Schema<ISubscriptionRequest>(
    {
      userId:       { type: String, required: true },
      userName:     { type: String, required: true },
      userEmail:    { type: String, required: true },
      company_id:   { type: String, required: true },
      company_name: { type: String, required: true },
      plan:         { type: String, enum: ["pro-chat", "pro-query", "business"], required: true },
      status:       { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      requestedAt:  { type: Date, default: Date.now },
      resolvedAt:   { type: Date },
      resolvedBy:   { type: String },
    },
    { timestamps: true }
  );
  return conn.model<ISubscriptionRequest>("SubscriptionRequest", schema);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!plan || !(VALID_PLANS as readonly string[]).includes(plan)) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
    }

    const adminConn = await connectAdminDB();
    const SubscriptionRequest = getRequestModel(adminConn);

    const existing = await SubscriptionRequest.findOne({
      userId: session.user.id,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { message: "You already have a pending subscription request." },
        { status: 409 }
      );
    }

    await SubscriptionRequest.create({
      userId:       session.user.id,
      userName:     session.user.name,
      userEmail:    session.user.email,
      company_id:   session.user.company_id,
      company_name: session.user.company_name,
      plan,
    });

    // Notify admin
    await sendSubscriptionRequestEmail(
      session.user.name!,
      session.user.email!,
      session.user.company_name!,
      plan
    );

    // Notify user with UPI payment instructions
    await sendSubscriptionQueuedEmail(
      session.user.email!,
      session.user.name!,
      plan
    );

    return NextResponse.json(
      { message: "Request submitted! Check your email for payment instructions." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscription request error:", error);
    return NextResponse.json({ message: "Failed to submit request" }, { status: 500 });
  }
}
