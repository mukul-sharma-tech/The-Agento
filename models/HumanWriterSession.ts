import mongoose, { Schema, models, Model } from "mongoose";

export interface IHWMessage {
  role:      "user" | "assistant";
  content:   string;
  createdAt: Date;
}

export interface IHumanWriterSession extends mongoose.Document {
  company_id: string;
  user_email: string;
  title:      string;
  messages:   IHWMessage[];
  createdAt:  Date;
  updatedAt:  Date;
}

const HWMessageSchema = new Schema<IHWMessage>(
  {
    role:      { type: String, enum: ["user", "assistant"], required: true },
    content:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HWSessionSchema = new Schema<IHumanWriterSession>(
  {
    company_id: { type: String, required: true, index: true },
    user_email: { type: String, required: true, index: true },
    title:      { type: String, default: "New Chat" },
    messages:   [HWMessageSchema],
  },
  { timestamps: true, collection: "hw_sessions" }
);

export default (models.HumanWriterSession as Model<IHumanWriterSession>) ||
  mongoose.model<IHumanWriterSession>("HumanWriterSession", HWSessionSchema);
