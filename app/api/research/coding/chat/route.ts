import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { message, history, activeFile, contextFiles, folderSummary } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ message: "Missing message" }, { status: 400 });
    }

    // Build context sections - at least one of these should be present
    const sections: string[] = [];

    if (activeFile?.content) {
      sections.push(
        `## ACTIVE FILE: ${activeFile.path}\n\`\`\`\n${activeFile.content.slice(0, 8000)}\n\`\`\``
      );
    }

    if (contextFiles) {
      sections.push(`## OTHER OPEN FILES\n${contextFiles.slice(0, 6000)}`);
    }

    if (folderSummary) {
      sections.push(`## PROJECT STRUCTURE\n${folderSummary.slice(0, 2000)}`);
    }

    // Conversation history
    const conversationHistory = (history || [])
      .slice(-8)
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    // If truly nothing was sent at all
    if (sections.length === 0) {
      return NextResponse.json({
        message: "Open a local folder in the Explorer and click a file to open it - I'll use your code as context to answer questions.",
      });
    }

    const codeContext = sections.join("\n\n");

    const prompt = `You are an expert AI coding assistant (like Cursor). You have access to the user's local codebase shown below.

RULES:
- Be concise. 3-6 sentences for explanations. Do NOT repeat the entire file back.
- Only show code blocks when you are actually suggesting a change or fix.
- When showing a code block, include only the changed function/section, not the whole file.
- Use plain prose for explanations - do not use markdown headers or bullet points unless listing 3+ items.
- Never include meta-commentary like "I hope this helps" or "Let me know if you need more".

${codeContext}

${conversationHistory ? `CONVERSATION:\n${conversationHistory}\n` : ""}
User: ${message}

Reply concisely:`;

    const response = await callLLM(prompt, 120000);

    return NextResponse.json({ message: response }, { status: 200 });
  } catch (e) {
    console.error("Coding chat error:", e);
    return NextResponse.json({ message: "Failed to generate response" }, { status: 500 });
  }
}
