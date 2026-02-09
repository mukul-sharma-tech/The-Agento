import mongoose, { Schema, models, Model } from "mongoose";

export interface IVectorChunk extends mongoose.Document {
  // Nested metadata object (matches Python structure)
  metadata: {
    company_id: string;
    category: string;
    filename: string;
    uploaded_by: string;
  };
  
  // The actual text chunk used for AI context
  textContent: string;
  
  // The vector embedding (Array of numbers, typically 384 floats for all-MiniLM-L6-v2)
  vectorContent: number[];
}

const VectorChunkSchema = new Schema<IVectorChunk>(
  {
    metadata: {
      company_id: { type: String, required: true, index: true },
      category: { type: String, required: true },
      filename: { type: String, required: true },
      uploaded_by: { type: String, required: true },
    },
    textContent: { type: String, required: true },
    
    // ⚠️ Critical: This stores the embedding. 
    // In Cosmos DB Mongo vCore, this needs to be indexed for vector search.
    vectorContent: { type: [Number], required: true },
  },
  {
    timestamps: false,
    // ⚠️ MUST match the Python variable: VECTOR_COLLECTION_NAME = "vector_store"
    collection: "vector_store", 
  }
);

// Prevent model overwrite
const VectorChunk = (models.VectorChunk as Model<IVectorChunk>) || mongoose.model<IVectorChunk>("VectorChunk", VectorChunkSchema);

export default VectorChunk;