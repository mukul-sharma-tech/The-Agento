import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

interface SignupBody {
    name: string;
    email: string;
    password: string;
    companyName: string;
}

export async function POST(req: Request) {
    try {
        const body: SignupBody = await req.json();
        const { name, email, password, companyName } = body;

        if (!name || !email || !password || !companyName) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
            companyName,
        });

        return NextResponse.json(
            { message: "User registered successfully" },
            { status: 201 }
        );

    } catch (error) {
        let message = "Signup failed";

        if (error instanceof Error) {
            message = error.message;
        }

        return NextResponse.json(
            { message },
            { status: 500 }
        );

    }
}