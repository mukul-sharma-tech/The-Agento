// import NextAuth from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       companyName: string;
//     };
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//     companyName: string;
//   }
// }

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
    companyName: string;
  }

  interface Session {
    user: {
      id: string;
      companyName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyName: string;
  }
}

export {};
