import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { callLLM } from "@/lib/llm";

interface GeneratePayload {
  topic: string;
  content?: string;
  slideCount?: number;
  theme?: string;
  tone?: string;
  targetAudience?: string;
  includeNotes?: boolean;
}

interface GeneratedSlide {
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

function generateSmartFallbackDeck(
  topic: string,
  content: string,
  slideCount: number,
  tone: string,
  targetAudience: string
): { title: string; subtitle: string; slides: GeneratedSlide[] } {
  const cleanTopic = topic.trim() || "AI Innovations & Strategy";
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  const slides: GeneratedSlide[] = [];
  const targetCount = Math.max(3, Math.min(slideCount || 6, 25));

  // Slide 1: Title
  slides.push({
    slideNumber: 1,
    title: cleanTopic,
    subtitle: `A comprehensive strategic overview for ${targetAudience || "stakeholders"}`,
    badge: "Executive Presentation",
    layout: "title",
    points: [
      `Prepared for: ${targetAudience.toUpperCase()}`,
      `Tone & Focus: ${tone.toUpperCase()} & Actionable`,
      `Date: ${new Date().toLocaleDateString()}`,
    ],
    presenterNotes: `Welcome everyone. Today we are presenting a focused walkthrough on ${cleanTopic}. Our goal is to outline the core priorities, strategic takeaways, and next steps.`,
  });

  // Slide 2: Executive Summary / Context
  slides.push({
    slideNumber: 2,
    title: "Executive Summary & Key Objectives",
    subtitle: "Strategic roadmap and primary goals",
    badge: "Overview",
    layout: "two-column",
    points: [
      "Accelerate implementation of strategic initiatives",
      "Optimize core operational workflows and reduce friction",
      "Empower teams with data-backed insights and automation",
    ],
    secondaryPoints: [
      "Achieve measurable outcomes within target timelines",
      "Establish sustainable, scalable practices across departments",
      "Drive high-impact cross-functional collaboration",
    ],
    stat: {
      value: "85%",
      label: "Target Efficiency Improvement",
    },
    presenterNotes:
      "This slide frames our primary objectives. We are targeting high leverage improvements while maintaining reliability.",
  });

  // Middle Content Slides
  const middleCount = targetCount - 2;
  const sampleTopics = [
    { title: "Market Landscape & Core Challenges", badge: "Analysis" },
    { title: "Proposed Architecture & Strategic Framework", badge: "Solution" },
    { title: "Key Milestones & Performance Metrics", badge: "Execution" },
    { title: "Implementation Roadmap & Resource Allocation", badge: "Planning" },
    { title: "Risk Mitigation & Operational Resilience", badge: "Operations" },
    { title: "Technological Impact & Innovation", badge: "Technology" },
    { title: "Value Proposition & Competitive Advantage", badge: "Strategy" },
  ];

  for (let i = 0; i < middleCount; i++) {
    const sIndex = i + 3;
    const template = sampleTopics[i % sampleTopics.length];
    const isStat = i % 2 === 1;

    let points: string[] = [];
    if (lines.length > i * 3) {
      points = lines.slice(i * 3, i * 3 + 3);
    } else {
      points = [
        `Deliver high-performance capabilities tailored to ${cleanTopic}`,
        `Streamline operational overhead and eliminate redundant bottlenecks`,
        `Maintain continuous feedback loops to ensure alignment with ${targetAudience}`,
      ];
    }

    slides.push({
      slideNumber: sIndex,
      title: template.title,
      subtitle: `Key considerations and structural priorities`,
      badge: template.badge,
      layout: isStat ? "stat-highlight" : "bullets",
      points,
      stat: isStat
        ? {
            value: `${(i + 2) * 10}x`,
            label: "Enhanced Velocity & Scalability",
          }
        : undefined,
      presenterNotes: `Discuss the implications of ${template.title.toLowerCase()}. Focus on practical benefits and measurable impact.`,
    });
  }

  // Final Slide: Conclusion & Next Steps
  slides.push({
    slideNumber: slides.length + 1,
    title: "Conclusion & Strategic Next Steps",
    subtitle: "Immediate action items and deliverables",
    badge: "Action Plan",
    layout: "conclusion",
    points: [
      "Review and approve proposed implementation phases",
      "Mobilize core project resources and finalize sprint scope",
      "Establish monitoring metrics and schedule bi-weekly check-ins",
    ],
    quote: `“Success in ${cleanTopic} relies on swift execution, continuous adaptation, and uncompromising focus on value.”`,
    presenterNotes:
      "To conclude, thank the team for their time, address any clarifying questions, and confirm owners for each next step.",
  });

  return {
    title: cleanTopic,
    subtitle: `Strategic Presentation Deck`,
    slides,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: GeneratePayload = await req.json();
    const {
      topic = "",
      content = "",
      slideCount = 6,
      theme = "indigo",
      tone = "professional",
      targetAudience = "stakeholders",
      includeNotes = true,
    } = body;

    if (!topic.trim() && !content.trim()) {
      return NextResponse.json(
        { message: "Please provide a presentation topic or source content." },
        { status: 400 }
      );
    }

    const count = Math.max(2, Math.min(Number(slideCount) || 6, 25));

    const systemPrompt = `You are a world-class presentation strategist and executive slide designer.
Your task is to generate a comprehensive, visually compelling ${count}-slide presentation deck in JSON format.

USER TOPIC:
${topic || "Presentation Deck"}

USER SOURCE CONTENT / NOTES:
${content || "No additional raw notes provided."}

PARAMETERS:
- Exact Slide Count: ${count}
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Theme style: ${theme}

OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown surrounding explanation, or enclosed in \`\`\`json \`\`\`).
JSON Schema:
{
  "title": "Presentation Main Title",
  "subtitle": "Clear, compelling subtitle",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "subtitle": "Slide Subtitle or context",
      "badge": "Category or Step (e.g. Overview, Strategy, Execution)",
      "layout": "title" | "bullets" | "two-column" | "stat-highlight" | "quote" | "conclusion",
      "points": [
        "Concise, high-impact bullet point 1",
        "Concise, high-impact bullet point 2",
        "Concise, high-impact bullet point 3"
      ],
      "secondaryPoints": [
        "Optional secondary point or right column item"
      ],
      "stat": {
        "value": "+85%",
        "label": "Metric or Achievement Description"
      },
      "quote": "Optional inspiring quote or key takeaway",
      "presenterNotes": "Brief 1-2 sentence speaking cue for the presenter."
    }
  ]
}

CRITICAL RULES:
1. Generate EXACTLY ${count} slides.
2. Slide 1 MUST be layout "title".
3. The final slide MUST be layout "conclusion" with next steps.
4. Intermediate slides should vary between "bullets", "two-column", and "stat-highlight".
5. Every bullet point MUST be crisp, informative, and professional (avoid fluff).
6. Ensure valid JSON without trailing commas.`;

    let generatedDeck: { title: string; subtitle: string; slides: GeneratedSlide[] } | null = null;

    try {
      const llmResponse = await callLLM(systemPrompt, 50000);
      let jsonString = llmResponse.trim();

      // Extract JSON if wrapped in codeblocks
      if (jsonString.includes("```json")) {
        jsonString = jsonString.split("```json")[1].split("```")[0].trim();
      } else if (jsonString.includes("```")) {
        jsonString = jsonString.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        generatedDeck = {
          title: parsed.title || topic || "Presentation",
          subtitle: parsed.subtitle || "AI Generated Slide Deck",
          slides: parsed.slides.map((s: any, idx: number) => ({
            slideNumber: s.slideNumber || idx + 1,
            title: s.title || `Slide ${idx + 1}`,
            subtitle: s.subtitle || "",
            badge: s.badge || "Key Point",
            layout: s.layout || "bullets",
            points: Array.isArray(s.points) ? s.points : [],
            secondaryPoints: Array.isArray(s.secondaryPoints) ? s.secondaryPoints : [],
            stat: s.stat?.value ? s.stat : undefined,
            quote: s.quote || undefined,
            presenterNotes: includeNotes ? s.presenterNotes || "" : "",
          })),
        };
      }
    } catch (llmErr) {
      console.warn("[Presentation Gen] LLM call failed or produced invalid JSON, using intelligent fallback generator:", (llmErr as Error).message);
    }

    // If LLM failed or parsed null, generate smart fallback deck
    if (!generatedDeck) {
      generatedDeck = generateSmartFallbackDeck(topic, content, count, tone, targetAudience);
    }

    return NextResponse.json({
      success: true,
      data: generatedDeck,
    });
  } catch (error) {
    console.error("[Presentation Gen Error]:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to generate presentation" },
      { status: 500 }
    );
  }
}
