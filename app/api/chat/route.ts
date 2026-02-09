import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import VectorChunk from "@/models/VectorChunk";

// Generate embedding using Ollama embeddings API
async function generateEmbedding(text: string): Promise<number[]> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text:latest";
  
  try {
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: embeddingModel,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding || [];
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length && i < b.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Call Ollama model for chat completion
async function callOllama(model: string, prompt: string): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "No response from model";
  } catch (error) {
    console.error("Ollama API error:", error);
    throw error;
  }
}

// Check if the query is about a process or flow that needs a flowchart
function needsFlowchart(query: string): boolean {
  const flowchartKeywords = [
    "how to", "steps", "process", "flow", "procedure", "workflow",
    "apply", "apply for", "onboarding", "offboarding", "hire",
    "recruitment", "leave request", "expense", "approval",
    "step by step", "guide", "instructions", "methodology",
  ];
  
  const lowerQuery = query.toLowerCase();
  return flowchartKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Generate Mermaid flowchart from response
async function generateFlowchart(query: string, response: string): Promise<string | null> {
  if (!needsFlowchart(query)) {
    return null;
  }

  const flowchartPrompt = `Generate a valid Mermaid flowchart for this process. 

RESPONSE:
${response}

QUERY:
${query}

RULES:
1. Use only: graph TD, A[Label] --> B[Label], A --> B, A --> B{Decision}
2. Labels must be SHORT (max 3 words)
3. No special chars in labels (use _ instead of spaces)
4. Start with: graph TD
5. Each step on new line

Example valid output:
graph TD
    A[Start] --> B[Apply_Online]
    B --> C[Upload_Documents]
    C --> D{Review?}
    D -->|Yes| E[Interview]
    D -->|No| F[Reject]

If not a clear process, output exactly: NO_FLOWCHART_NEEDED`;

  try {
    const mermaidResponse = await callOllama(
      process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud",
      flowchartPrompt
    );

    console.log("Mermaid response:", mermaidResponse);

    // Clean up the response
    let cleaned = mermaidResponse.trim();
    
    // Remove any text before graph TD
    const graphMatch = cleaned.match(/graph\s+TD[\s\S]*/);
    if (graphMatch) {
      cleaned = graphMatch[0];
    }
    
    // Check if valid
    if (cleaned.includes("NO_FLOWCHART_NEEDED") || !cleaned.startsWith("graph")) {
      return null;
    }
    
    // Remove code block markers if present
    cleaned = cleaned.replace(/```mermaid\s*/g, "").replace(/```\s*$/g, "");
    
    // Validate basic structure
    if (!cleaned.startsWith("graph TD")) {
      cleaned = "graph TD\n" + cleaned;
    }
    
    // Clean labels - remove special chars
    cleaned = cleaned.replace(/\[(.*?)\]/g, (match, label) => {
      const clean = label.replace(/[^a-zA-Z0-9_\s]/g, "_").trim().replace(/\s+/g, "_");
      return `[${clean}]`;
    });
    
    return cleaned;
  } catch (error) {
    console.error("Flowchart generation error:", error);
    return null;
  }
}

// Text-based search fallback
async function textSearch(query: string, companyId: string): Promise<string[]> {
  await connectDB();
  
  // Search using regex on textContent
  const chunks = await VectorChunk.find({
    "metadata.company_id": companyId,
    textContent: { $regex: query, $options: "i" },
  }).limit(10);
  
  return chunks.map(chunk => chunk.textContent);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { message, history, mode } = await req.json();

    const isVoiceMode = mode === "voice";

    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }

    await connectDB();
    const companyId = session.user.company_id;

    console.log(`Chat request from user: ${session.user.email}, company_id: ${companyId}`);

    // Get all vector chunks for this company
    const allChunks = await VectorChunk.find({
      "metadata.company_id": companyId,
    }).limit(100);

    console.log(`Found ${allChunks.length} vector chunks in database for company: ${companyId}`);

    // Generate embedding for the query
    let queryEmbedding: number[] = [];
    let relevantChunks: string[] = [];
    
    try {
      queryEmbedding = await generateEmbedding(message);
      console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);
    } catch (embedError) {
      console.warn("Embedding generation failed, using text search fallback");
    }

    if (queryEmbedding.length > 0 && allChunks.length > 0) {
      // Calculate similarity scores and sort
      const scoredChunks = allChunks.map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.vectorContent),
      }));

      // Get top K relevant chunks
      const topK = 5;
      relevantChunks = scoredChunks
        .filter((item) => item.score > 0.2) // Lower threshold for more results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((item) => item.chunk.textContent);

      console.log(`Vector search found ${relevantChunks.length} relevant chunks`);
    }

    // If no vector results, try text search
    if (relevantChunks.length === 0) {
      console.log("No vector results, trying text search...");
      relevantChunks = await textSearch(message, companyId);
      console.log(`Text search found ${relevantChunks.length} chunks`);
    }

    // Build context from relevant chunks
    const context = relevantChunks.join("\n\n---\n\n");

    console.log(`Final context length: ${context.length} characters`);

    if (context.length === 0) {
      console.log("No context found - checking for any documents in database...");
      // Try to get any documents regardless of company_id
      const anyChunks = await VectorChunk.find({}).limit(10);
      console.log(`Total chunks in database (any company): ${anyChunks.length}`);
      
      if (anyChunks.length > 0) {
        const sampleCompanyId = anyChunks[0].metadata.company_id;
        console.log(`Sample chunk company_id: ${sampleCompanyId}`);
        console.log(`Session user company_id: ${companyId}`);
      }
    }

    // Build system prompt
    const systemPrompt = isVoiceMode
      ? `You are a helpful AI assistant named Agento. Answer briefly and concisely - maximum 2-3 sentences. Use simple language.

CONTEXT:
${context || "No relevant documents found."}`
      : `You are a helpful AI assistant for ${session.user.company_name || "the company"}.
Use the following context from company documents to answer the user's question.
If the context doesn't contain relevant information, say so and provide a general answer.

CONTEXT:
${context || "No relevant documents found."}

---

Answer the user's question based on the context above. If the question is about a process, workflow, or step-by-step procedure, provide clear numbered steps that can be visualized as a flowchart.`;

    // Build conversation history
    const conversationHistory = (history || [])
      .slice(-6) // Keep last 6 messages
      .map((msg: { role: string; content: string }) => 
        msg.role === "user" ? `User: ${msg.content}` : `Assistant: ${msg.content}`
      )
      .join("\n");

    const fullPrompt = conversationHistory 
      ? `${systemPrompt}\n\nCONVERSATION:\n${conversationHistory}\n\nUser: ${message}`
      : `${systemPrompt}\n\nUser: ${message}`;

    // Call Ollama model
    const ollamaModel = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";
    let response = await callOllama(ollamaModel, fullPrompt);

    // Truncate long responses in voice mode
    if (isVoiceMode && response.length > 500) {
      // Keep first 500 chars, cut at last sentence boundary
      const truncated = response.substring(0, 500);
      const lastPeriod = truncated.lastIndexOf(". ");
      if (lastPeriod > 200) {
        response = response.substring(0, lastPeriod + 1);
      } else {
        response = truncated + "...";
      }
    }

    // Generate flowchart if applicable
    const mermaidCode = await generateFlowchart(message, response);

    return NextResponse.json({
      message: response,
      mermaidCode,
      sources: relevantChunks.map((text, idx) => ({
        id: idx + 1,
        preview: text.substring(0, 200) + "...",
      })),
    }, { status: 200 });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ 
      message: "Failed to generate response. Please try again." 
    }, { status: 500 });
  }
}
