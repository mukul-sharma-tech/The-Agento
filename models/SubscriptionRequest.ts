import mongoose, { Schema, models, Model } from "mongoose";

export interface ISubscriptionRequest extends mongoose.Document {
  userId: string;
  userName: string;
  userEmail: string;
  company_id: string;
  company_name: string;
  plan: "pro-chat" | "pro-query" | "business";
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    company_id: { type: String, required: true },
    company_name: { type: String, required: true },
    plan: { type: String, enum: ["pro-chat", "pro-query", "business"], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
  },
  { timestamps: true }
);

export default (models.SubscriptionRequest as Model<ISubscriptionRequest>) ||
  mongoose.model<ISubscriptionRequest>("SubscriptionRequest", SubscriptionRequestSchema);
