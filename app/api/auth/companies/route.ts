import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
    try {
        await connectDB();

        // Get distinct companies with their company_id and company_name
        const companies = await User.aggregate([
            {
                $group: {
                    _id: "$company_id",
                    company_id: { $first: "$company_id" },
                    company_name: { $first: "$company_name" },
                },
            },
            {
                $project: {
                    _id: 0,
                    company_id: 1,
                    company_name: 1,
                },
            },
        ]);

        return NextResponse.json({ companies }, { status: 200 });
    } catch (error) {
        let message = "Failed to fetch companies";
        if (error instanceof Error) {
            message = error.message;
        }
        return NextResponse.json({ message }, { status: 500 });
    }
}
