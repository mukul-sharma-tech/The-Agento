import mongoose, { Schema, models, Model } from "mongoose";

export interface ISlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  badge?: string;
  layout?: "title" | "bullets" | "two-column" | "stat-highlight" | "quote" | "conclusion";
  points?: string[];
  secondaryPoints?: string[];
  stat?: {
    value: string;
    label: string;
  };
  quote?: string;
  presenterNotes?: string;
}

export interface IPresentationSession extends mongoose.Document {
  company_id: string;
  user_email: string;
  title: string;
  topic: string;
  slideCount: number;
  theme: string;
  tone: string;
  targetAudience: string;
  rawContent: string;
  slides: ISlide[];
  createdAt: Date;
  updatedAt: Date;
}

const SlideSchema = new Schema<ISlide>(
  {
    slideNumber: { type: Number, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    badge: { type: String, default: "" },
    layout: {
      type: String,
      enum: ["title", "bullets", "two-column", "stat-highlight", "quote", "conclusion"],
      default: "bullets",
    },
    points: [{ type: String }],
    secondaryPoints: [{ type: String }],
    stat: {
      value: { type: String, default: "" },
      label: { type: String, default: "" },
    },
    quote: { type: String, default: "" },
    presenterNotes: { type: String, default: "" },
  },
  { _id: false }
);

const PresentationSessionSchema = new Schema<IPresentationSession>(
  {
    company_id: { type: String, required: true, index: true },
    user_email: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled Presentation" },
    topic: { type: String, default: "" },
    slideCount: { type: Number, default: 6 },
    theme: { type: String, default: "indigo" },
    tone: { type: String, default: "professional" },
    targetAudience: { type: String, default: "general" },
    rawContent: { type: String, default: "" },
    slides: [SlideSchema],
  },
  { timestamps: true, collection: "presentation_sessions" }
);

export default (models.PresentationSession as Model<IPresentationSession>) ||
  mongoose.model<IPresentationSession>("PresentationSession", PresentationSessionSchema);
