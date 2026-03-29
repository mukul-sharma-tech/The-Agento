import mongoose, { Schema, models } from "mongoose";

export interface IPublicLink extends mongoose.Document {
  token: string;
  company_id: string;
  company_name: string;
  enabled: boolean;
  features: string[];
  guestCallCount: number;
  createdAt: Date;
  expiresAt?: Date;
}

const PublicLinkSchema = new Schema<IPublicLink>(
  {
    token: { type: String, required: true, unique: true, index: true },
    company_id: { type: String, required: true, index: true },
    company_name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    features: { type: [String], default: ["chat", "voice"] },
    guestCallCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true, collection: "public_links" }
);

export default models.PublicLink || mongoose.model<IPublicLink>("PublicLink", PublicLinkSchema);
