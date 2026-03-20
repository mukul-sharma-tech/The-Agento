import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// GET - list all collections for this company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;

    // Collections are namespaced by company: qg_{companyId}_{name}
    const allCollections = await db.listCollections().toArray();
    const prefix = `qg_${companyId}_`;
    const collections = allCollections
      .map((c) => c.name)
      .filter((n) => n.startsWith(prefix))
      .map((n) => ({
        name: n.replace(prefix, ""),
        fullName: n,
      }));

    // Get counts
    const result = await Promise.all(
      collections.map(async (c) => {
        const count = await db.collection(c.fullName).countDocuments();
        const sample = await db.collection(c.fullName).findOne({}, { projection: { _id: 0 } });
        return {
          name: c.name,
          count,
          fields: sample ? Object.keys(sample) : [],
        };
      })
    );

    return NextResponse.json({ collections: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
