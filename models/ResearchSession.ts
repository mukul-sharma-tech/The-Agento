import mongoose, { Schema, models, Model } from "mongoose";

export interface IResearchSession extends mongoose.Document {
  company_id: string;
  user_email: string;
  title: string;
  inputs: {
    idea: string;
    prior: string;
    approach: string;
    result: string;
  };
  output: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchSessionSchema = new Schema<IResearchSession>(
  {
    company_id: { type: String, required: true, index: true },
    user_email: { type: String, required: true, index: true },
    title:      { type: String, default: "Untitled Research" },
    inputs: {
      idea:     { type: String, default: "" },
      prior:    { type: String, default: "" },
      approach: { type: String, default: "" },
      result:   { type: String, default: "" },
    },
    output: { type: String, default: "" },
  },
  { timestamps: true, collection: "research_sessions" }
);

export default (models.ResearchSession as Model<IResearchSession>) ||
  mongoose.model<IResearchSession>("ResearchSession", ResearchSessionSchema);
