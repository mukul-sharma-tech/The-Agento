import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Document from "@/models/Document";
import VectorChunk from "@/models/VectorChunk";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const companyId = session.user.company_id;
    
    // Get documents for this company
    const documents = await Document.find({ company_id: companyId });
    
    // Get vector chunks for this company
    const vectorChunks = await VectorChunk.find({ "metadata.company_id": companyId });
    
    // Get all documents in database (for debugging)
    const allDocuments = await Document.find({});
    const allVectorChunks = await VectorChunk.find({});

    return NextResponse.json({
      session: {
        email: session.user.email,
        company_id: companyId,
        role: session.user.role,
      },
      thisCompany: {
        documentsCount: documents.length,
        vectorChunksCount: vectorChunks.length,
      },
      allDatabase: {
        totalDocuments: allDocuments.length,
        totalVectorChunks: allVectorChunks.length,
        sampleDocument: allDocuments[0] ? {
          company_id: (allDocuments[0] as any).company_id,
          filename: allDocuments[0].filename,
          category: allDocuments[0].category,
        } : null,
        sampleVectorChunk: allVectorChunks[0] ? {
          company_id: allVectorChunks[0].metadata.company_id,
          filename: allVectorChunks[0].metadata.filename,
          textPreview: allVectorChunks[0].textContent.substring(0, 200),
          vectorDimensions: allVectorChunks[0].vectorContent.length,
        } : null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ message: "Debug failed", error: String(error) }, { status: 500 });
  }
}
