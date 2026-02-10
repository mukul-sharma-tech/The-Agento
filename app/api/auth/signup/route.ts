import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

interface SignupBody {
    name: string;
    email: string;
    password: string;
    company_id: string;
    company_name: string;
    role?: "admin" | "employee";
}

export async function POST(req: Request) {
    try {
        const body: SignupBody = await req.json();
        const { name, email, password, company_id, company_name, role } = body;

        if (!name || !email || !password || !company_id || !company_name) {
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

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedVerificationToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        await User.create({
            name,
            email,
            password: hashedPassword,
            company_id,
            company_name,
            role: role || "employee",
            // Admins are auto-verified, employees need admin approval
            accountVerified: role === "admin",
            emailVerificationToken: hashedVerificationToken,
            emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken);
        if (!emailResult.success) {
            console.error("Failed to send verification email:", emailResult.error);
            // Still create user but log error
        }

        return NextResponse.json(
            { message: "User registered successfully. Please check your email to verify your account." },
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
