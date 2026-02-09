import mongoose, { Schema, models, Model } from "mongoose";

export interface IDocument extends mongoose.Document {
  company_id: string;      // Links to the company (e.g. "STA_9X21")
  filename: string;        // Original file name
  category: string;        // e.g. "HR", "Engineering"
  uploaded_by: string;     // Email of the uploader
  upload_date: Date;       // When it was uploaded
  full_text?: string;      // The raw text extracted from the PDF
  
  // Optional: If your Next.js app uploads to S3/Blob storage, add this:
  file_url?: string;       
}

const DocumentSchema = new Schema<IDocument>(
  {
    // ⚠️ These field names match your Python script exactly (snake_case)
    company_id: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    category: { type: String, required: true },
    uploaded_by: { type: String, required: true },
    
    // Python uses 'upload_date', not 'createdAt'
    upload_date: { type: Date, default: Date.now },
    
    // This stores the extracted text for RAG (Retrieval-Augmented Generation)
    full_text: { type: String },
    
    // Optional field for the web app (not used in your Python script yet)
    file_url: { type: String },
  },
  {
    // We disable standard Mongoose timestamps because Python uses 'upload_date'
    timestamps: false,
    // Force the collection name to match the one used in Python
    collection: "documents",
  }
);

// Prevent model overwrite during Next.js hot-reloading
const Document = (models.Document as Model<IDocument>) || mongoose.model<IDocument>("Document", DocumentSchema);

export default Document;