import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM } from "@/lib/llm";

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  standard: `Format as a standard academic paper with these sections in order:
Title, Abstract, 1. Introduction, 2. Related Work, 3. Methodology, 4. Results & Discussion, 5. Conclusion, References (placeholder).
Use proper academic headings (## for main sections, ### for subsections). Write in third person, formal tone.`,

  ieee: `Format as IEEE LaTeX-compatible paper outline. Include:
\\documentclass{IEEEtran} hint at top as comment, then:
# [PAPER TITLE]
**Abstract** — IEEE two-column abstract format
## I. Introduction
## II. Related Work  
## III. System Design / Methodology
## IV. Experimental Results
## V. Conclusion
References section.
Use IEEE style: numbered references [1], [2], formal technical language, passive voice preferred.`,

  springer: `Format as Springer LNCS One-Pager (extended abstract). Structure:
# [Concise Title]
**Abstract** (150 words max, structured: Background, Objective, Methods, Results, Conclusion)
**Keywords:** 5-6 relevant terms
## 1. Introduction (200 words)
## 2. Proposed Method (250 words)
## 3. Results (150 words)  
## 4. Conclusion (100 words)
Keep total under 800 words. Dense academic style.`,

  acm: `Format as ACM SIG Proceedings paper. Include:
# [Title: Subtitle]
*[Author Name] — [Institution]*
**ABSTRACT** (CCS Concepts included)
## 1. INTRODUCTION
## 2. BACKGROUND
## 3. APPROACH
## 4. EVALUATION  
## 5. DISCUSSION
## 6. CONCLUSION
REFERENCES
Use ACM style: numbered sections uppercase, formal language.`,

  abstract: `Format as a 500-word Extended Abstract with these clearly labeled sections:
**Title:** [title]
**Motivation & Problem:** (75 words)
**Related Work:** (75 words)
**Proposed Approach:** (150 words)
**Key Results:** (100 words)
**Conclusion & Future Work:** (75 words)
**Keywords:** comma-separated list
Keep it dense and structured.`,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { idea, prior, approach, result, format = "standard" } = await req.json();

    if (!idea?.trim() || !prior?.trim() || !approach?.trim() || !result?.trim()) {
      return NextResponse.json({ message: "All 4 input nodes are required" }, { status: 400 });
    }

    const formatInstructions = FORMAT_INSTRUCTIONS[format] || FORMAT_INSTRUCTIONS.standard;

    const prompt = `You are an expert academic research paper writer. 
Generate a complete, well-structured research paper based on the researcher's notes below.

RESEARCHER'S NOTES:

[NODE 1 - Research Idea & Origin]
${idea}

[NODE 2 - Previous Work & Background]  
${prior}

[NODE 3 - Methodology & Approach]
${approach}

[NODE 4 - Results, Findings & Future Scope]
${result}

---

${formatInstructions}

REQUIREMENTS:
- Generate a complete, publish-ready draft
- Synthesize all 4 nodes into a coherent narrative
- Add appropriate academic transitions and language
- Suggest a strong, descriptive paper title
- Ensure logical flow between sections
- Add technical depth based on the content provided

Generate the complete paper now:`;

    const content = await callLLM(prompt, 120000);

    return NextResponse.json({ content: content.trim() }, { status: 200 });
  } catch (e) {
    console.error("AI Research generate error:", e);
    return NextResponse.json({ message: "Generation failed. Please try again." }, { status: 500 });
  }
}
