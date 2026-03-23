import mongoose, { Schema, models, Model } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  mermaidCode?: string;
  citations?: { filename: string; category: string }[];
  createdAt: Date;
}

export interface IChatSession extends mongoose.Document {
  company_id: string;
  user_email: string;
  title: string;
  mode: "chat" | "voice";
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  mermaidCode: { type: String },
  citations: [{ filename: String, category: String }],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>(
  {
    company_id: { type: String, required: true, index: true },
    user_email: { type: String, required: true, index: true },
    title: { type: String, default: "New Chat" },
    mode: { type: String, enum: ["chat", "voice"], default: "chat" },
    messages: [ChatMessageSchema],
  },
  { timestamps: true, collection: "chat_sessions" }
);

export default (models.ChatSession as Model<IChatSession>) ||
  mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
