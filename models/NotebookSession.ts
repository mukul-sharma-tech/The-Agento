import mongoose, { Schema, models, Model } from "mongoose";

export interface INotebookDoc {
  docId: string;
  filename: string;
  chunks: number;
  size: number;
}

export interface INotebookMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  createdAt: Date;
}

export interface INotebookSession extends mongoose.Document {
  company_id: string;
  user_email: string;
  title: string;
  description: string;
  docs: INotebookDoc[];
  messages: INotebookMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const NotebookDocSchema = new Schema<INotebookDoc>(
  {
    docId:    { type: String, required: true },
    filename: { type: String, required: true },
    chunks:   { type: Number, default: 0 },
    size:     { type: Number, default: 0 },
  },
  { _id: false }
);

const NotebookMessageSchema = new Schema<INotebookMessage>(
  {
    role:      { type: String, enum: ["user", "assistant"], required: true },
    content:   { type: String, required: true },
    citations: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const NotebookSessionSchema = new Schema<INotebookSession>(
  {
    company_id:  { type: String, required: true, index: true },
    user_email:  { type: String, required: true, index: true },
    title:       { type: String, default: "Untitled Notebook" },
    description: { type: String, default: "" },
    docs:        [NotebookDocSchema],
    messages:    [NotebookMessageSchema],
  },
  { timestamps: true, collection: "notebook_sessions" }
);

export default (models.NotebookSession as Model<INotebookSession>) ||
  mongoose.model<INotebookSession>("NotebookSession", NotebookSessionSchema);
