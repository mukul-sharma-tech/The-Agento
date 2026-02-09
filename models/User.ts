// import mongoose, { Schema, models } from "mongoose";

// export interface IUser extends mongoose.Document {
//   name: string;
//   email: string;
//   password: string;
//   companyName: string;
//   resetPasswordToken?: string;
//   resetPasswordExpiry?: Date;
//   emailVerified?: boolean;
//   emailVerificationToken?: string;
//   emailVerificationExpiry?: Date;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     companyName: { type: String, required: true },

//     resetPasswordToken: String,
//     resetPasswordExpiry: Date,

//     emailVerified: { type: Boolean, default: false },
//     emailVerificationToken: String,
//     emailVerificationExpiry: Date,
//   },
//   { timestamps: true }
// );

// export default models.User || mongoose.model<IUser>("User", UserSchema);


// import mongoose, { Schema, models } from "mongoose";

// export interface IUser extends mongoose.Document {
//   /** Core auth fields */
//   name: string;
//   email: string;
//   password: string; // hashed
//   role: "admin" | "employee";
//   /** Company linkage */
//   companyId: string;      // same value you generate in Streamlit (e.g. ABC_X7Y9)
//   companyName: string;    // readable name
//   /** Security helpers (optional) */
//   resetPasswordToken?: string;
//   resetPasswordExpiry?: Date;
//   emailVerified: boolean;
//   emailVerificationToken?: string;
//   emailVerificationExpiry?: Date;
//   /** Timestamps (createdAt/updatedAt) – added automatically */
//   createdAt?: Date;
//   updatedAt?: Date;

//   /** ---- Instance methods ---- */
//   comparePassword(candidate: string): Promise<boolean>;
//   /** Generate a one‑time token (e.g. for password reset or e‑mail verification) */
//   generateToken(length?: number): string;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true, trim: true },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: { type: String, required: true },

//     /** Role & Company linkage – required for every user */
//     role: {
//       type: String,
//       enum: ["admin", "employee"],
//       default: "employee",
//     },
//     companyId: { type: String, required: true, index: true },
//     companyName: { type: String, required: true },

//     /** Optional “reset / verification” flow */
//     resetPasswordToken: { type: String },
//     resetPasswordExpiry: { type: Date },

//     emailVerified: { type: Boolean, default: false },
//     emailVerificationToken: { type: String },
//     emailVerificationExpiry: { type: Date },
//   },
//   {
//     timestamps: true, // adds createdAt / updatedAt automatically
//     toJSON: { virtuals: true, getters: true },
//     toObject: { virtuals: true, getters: true },
//   }
// );

// export default models.User || mongoose.model<IUser>("User", UserSchema);


import mongoose, { Schema, models, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  
  // --- MATCHING PYTHON FIELD NAMES ---
  role: "admin" | "employee";
  company_id: string;   // Changed from companyId to match Python
  company_name: string; // Changed from companyName to match Python
  // ----------------------------------

  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidate: string): Promise<boolean>;
  generateToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },
    
    // ⚠️ MATCH PYTHON DB FIELDS EXACTLY
    company_id: { type: String, required: true, index: true }, 
    company_name: { type: String, required: true },

    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

// --- IMPLEMENTING THE MISSING METHODS ---

// 1. Compare Password (for Login)
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// 2. Generate Token (for Reset/Verify)
UserSchema.methods.generateToken = function (): string {
  // Generates a random 32-byte hex string
  return crypto.randomBytes(32).toString("hex");
};

// Prevent recompilation in Next.js hot-reloading
export default (models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);