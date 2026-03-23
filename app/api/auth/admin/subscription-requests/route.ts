import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB, connectAdminDB } from "@/lib/db";
import { sendSubscriptionApprovedEmail, sendSubscriptionRejectedEmail } from "@/lib/email";
import User from "@/models/User";
import mongoose from "mongoose";
import type { ISubscriptionRequest } from "@/models/SubscriptionRequest";

const PLAN_LIMITS = {
  "pro-chat":  { days: 30 },
  "pro-query": { days: 30 },
  "business":  { days: 30 },
};

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

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

// GET: list all subscription requests
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const adminConn = await connectAdminDB();
    const SubscriptionRequest = getRequestModel(adminConn);
    const requests = await SubscriptionRequest.find({}).sort({ requestedAt: -1 });
    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscription requests:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}

// PATCH: approve or reject
export async function PATCH(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const { requestId, action } = await req.json();
    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "requestId and action (approve|reject) required" }, { status: 400 });
    }

    const adminConn = await connectAdminDB();
    const SubscriptionRequest = getRequestModel(adminConn);

    const request = await SubscriptionRequest.findById(requestId);
    if (!request) return NextResponse.json({ message: "Request not found" }, { status: 404 });
    if (request.status !== "pending") {
      return NextResponse.json({ message: "Request already resolved" }, { status: 409 });
    }

    request.status = action === "approve" ? "approved" : "rejected";
    request.resolvedAt = new Date();
    request.resolvedBy = session.user.id;
    await request.save();

    if (action === "approve") {
      await connectDB();
      const days = PLAN_LIMITS[request.plan as keyof typeof PLAN_LIMITS]?.days ?? 30;
      const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(request.userId, {
        subscription: true,
        subscriptionPlan: request.plan,
        subscriptionExpiry: expiry,
        chatCallCount: 0,
        voiceCallCount: 0,
        queryCallCount: 0,
      });

      await sendSubscriptionApprovedEmail(request.userEmail, request.userName, request.plan, expiry);
    } else {
      await sendSubscriptionRejectedEmail(request.userEmail, request.userName, request.plan);
    }

    return NextResponse.json({ message: `Request ${action}d successfully` }, { status: 200 });
  } catch (error) {
    console.error("Error resolving subscription request:", error);
    return NextResponse.json({ message: "Failed to resolve request" }, { status: 500 });
  }
}

// DELETE: remove a request record
export async function DELETE(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ message: "requestId required" }, { status: 400 });

    const adminConn = await connectAdminDB();
    const SubscriptionRequest = getRequestModel(adminConn);

    const deleted = await SubscriptionRequest.findByIdAndDelete(requestId);
    if (!deleted) return NextResponse.json({ message: "Request not found" }, { status: 404 });

    return NextResponse.json({ message: "Request deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting subscription request:", error);
    return NextResponse.json({ message: "Failed to delete request" }, { status: 500 });
  }
}
