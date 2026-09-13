import mongoose, { Schema, models, Model } from "mongoose";

export interface IWritingSample {
  sampleId: string;
  filename: string;
  content:  string;
  words:    number;
  uploadedAt: Date;
}

export interface IWritingProfile extends mongoose.Document {
  company_id:   string;
  user_email:   string;
  samples:      IWritingSample[];
  styleAnalysis: string; // cached analysis
  analysedAt:   Date | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const SampleSchema = new Schema<IWritingSample>(
  {
    sampleId:   { type: String, required: true },
    filename:   { type: String, required: true },
    content:    { type: String, required: true },
    words:      { type: Number, default: 0 },
    uploadedAt: { type: Date,   default: Date.now },
  },
  { _id: false }
);

const WritingProfileSchema = new Schema<IWritingProfile>(
  {
    company_id:    { type: String, required: true, index: true },
    user_email:    { type: String, required: true, unique: true },
    samples:       [SampleSchema],
    styleAnalysis: { type: String, default: "" },
    analysedAt:    { type: Date,   default: null },
  },
  { timestamps: true, collection: "writing_profiles" }
);

export default (models.WritingProfile as Model<IWritingProfile>) ||
  mongoose.model<IWritingProfile>("WritingProfile", WritingProfileSchema);
