import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!collectionName) {
      return NextResponse.json({ message: "Collection name required" }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;
    const fullCollectionName = `qg_${companyId}_${collectionName}`;

    const data = await db
      .collection(fullCollectionName)
      .find({}, { projection: { _id: 0 } })
      .limit(limit)
      .toArray();

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE a collection
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");

    if (!collectionName) {
      return NextResponse.json({ message: "Collection name required" }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;
    const fullCollectionName = `qg_${companyId}_${collectionName}`;

    await db.dropCollection(fullCollectionName);
    return NextResponse.json({ message: "Collection deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
