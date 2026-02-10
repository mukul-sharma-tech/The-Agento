import NextAuth, { DefaultSession } from "next-auth";
import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}


declare module "next-auth" {
  interface User {
    id: string;
    company_id: string;
    company_name: string;
    role: "admin" | "employee";
    accountVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      company_id: string;
      company_name: string;
      role: "admin" | "employee";
      accountVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    company_id: string;
    company_name: string;
    role: "admin" | "employee";
    accountVerified: boolean;
  }
}

export {};
