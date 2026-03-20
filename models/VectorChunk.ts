import mongoose, { Schema, models, Model } from "mongoose";

export interface IVectorChunk extends mongoose.Document {
  metadata: {
    company_id: string;
    category: string;
    filename: string;
    uploaded_by: string;
  };
  textContent: string;
  vectorContent: number[];
  // Tracks which model generated this embedding.
  // Ollama (nomic-embed-text) → 768-dim
  // HuggingFace (all-MiniLM-L6-v2) → 384-dim
  // At query time we filter by this field so dimensions always match.
  embeddingModel: string;
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
    // ⚠️ In Cosmos DB Mongo vCore this needs a vector index.
    vectorContent: { type: [Number], required: true },
    embeddingModel: { type: String, required: true, default: "unknown" },
  },
  {
    timestamps: false,
    // ⚠️ MUST match the Python variable: VECTOR_COLLECTION_NAME = "vector_store"
    collection: "vector_store",
  }
);

const VectorChunk =
  (models.VectorChunk as Model<IVectorChunk>) ||
  mongoose.model<IVectorChunk>("VectorChunk", VectorChunkSchema);

export default VectorChunk;
