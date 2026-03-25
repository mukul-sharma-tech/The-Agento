import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { callLLM } from "@/lib/llm";
import { checkAndIncrementAILimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { type, collectionName, query } = await req.json();
    if (!collectionName || !type || !query) {
      return NextResponse.json({ message: "type, collectionName and query required" }, { status: 400 });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const limit = await checkAndIncrementAILimit(session.user.email!, "query");
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "AI call limit reached", limitReached: true, used: limit.used, limit: limit.limit },
        { status: 429 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;

    if (!companyId) {
      return NextResponse.json({ message: "No company_id on session" }, { status: 400 });
    }

    const fullName = `qg_${companyId}_${collectionName}`;
    const col = db.collection(fullName);

    const totalCount = await col.countDocuments();
    if (totalCount === 0) return NextResponse.json({ message: "Collection is empty" }, { status: 400 });

    const sample = await col.find({}, { projection: { _id: 0 } }).limit(5).toArray();
    const fields = sample[0] ? Object.keys(sample[0]) : [];

    const systemPrompts: Record<string, string> = {
      descriptive: `You are a data analyst. Perform DESCRIPTIVE analytics ("What happened?") - summarize counts, averages, totals, distributions.`,
      diagnostic: `You are a data analyst. Perform DIAGNOSTIC analytics ("Why did it happen?") - find root causes, correlations, and segments.`,
      predictive: `You are a data analyst. Perform PREDICTIVE analytics ("What might happen?") - identify trends and forecast future outcomes.`,
      prescriptive: `You are a data analyst. Perform PRESCRIPTIVE analytics ("What should we do?") - surface actionable recommendations.`,
    };

    const prompt = `${systemPrompts[type]}

COLLECTION: ${collectionName}
TOTAL RECORDS: ${totalCount}
FIELDS: ${fields.join(", ")}
SAMPLE DATA:
${JSON.stringify(sample, null, 2)}

USER QUESTION: "${query}"

Reply in EXACTLY this format - no markdown, no code fences:
PIPELINE:
[JSON aggregation pipeline array]
CHART_TYPE:
[one of: bar, line, pie, area, scatter, none]
INSIGHT:
[plain text analysis]`;

    let raw: string;
    try {
      raw = await callLLM(prompt, 120000); // 2 min - analytics prompts are large
    } catch (llmErr) {
      console.error("[Analytics] LLM failed:", llmErr);
      return NextResponse.json({ message: `LLM unavailable: ${(llmErr as Error).message}` }, { status: 502 });
    }

    console.log("[Analytics] raw LLM response:", raw.slice(0, 500));

    // Parse pipeline - be lenient: accept ```json fences too
    let pipeline: object[] = [];
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    const pipelineMatch = cleaned.match(/PIPELINE:\s*(\[[\s\S]*?\])\s*CHART_TYPE:/i);
    if (pipelineMatch) {
      try { pipeline = JSON.parse(pipelineMatch[1].trim()); } catch { /* ignore */ }
    }
    if (pipeline.length === 0) {
      // fallback: grab first JSON array anywhere in response
      const anyArr = cleaned.match(/\[[\s\S]*?\]/);
      if (anyArr) { try { pipeline = JSON.parse(anyArr[0]); } catch { /* ignore */ } }
    }

    // Parse chart type
    const chartMatch = cleaned.match(/CHART_TYPE:\s*(\w+)/i);
    const chartType = chartMatch ? chartMatch[1].toLowerCase().trim() : "bar";

    // Parse insight
    const insightMatch = cleaned.match(/INSIGHT:\s*([\s\S]+)$/i);
    const insight = insightMatch ? insightMatch[1].trim() : cleaned.trim();

    // Run pipeline
    let results: Record<string, unknown>[] = [];
    if (pipeline.length > 0) {
      try {
        const raw2 = await col.aggregate(pipeline).toArray();
        results = raw2.map(doc => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(doc)) {
            if (k === "_id") {
              // Flatten _id: if it's an object use its values as label keys, if primitive use as "label"
              if (v !== null && typeof v === "object" && !Array.isArray(v)) {
                const obj = v as Record<string, unknown>;
                const entries = Object.entries(obj);
                if (entries.length === 1) {
                  out[entries[0][0]] = entries[0][1]; // unwrap single-key _id
                } else if (entries.length > 1) {
                  // multi-key group: join as label
                  out["label"] = entries.map(([, val]) => String(val)).join(" / ");
                } else {
                  out["label"] = "N/A";
                }
              } else {
                out["label"] = v === null ? "null" : String(v);
              }
              continue;
            }
            // Flatten nested objects
            if (v !== null && typeof v === "object" && !Array.isArray(v)) {
              const obj = v as Record<string, unknown>;
              if ("count" in obj) { out[k] = Number(obj.count); continue; }
              if ("total" in obj) { out[k] = Number(obj.total); continue; }
              if ("avg" in obj) { out[k] = Number(obj.avg); continue; }
              out[k] = JSON.stringify(v);
            } else if (Array.isArray(v)) {
              out[k] = v.length;
            } else {
              out[k] = v;
            }
          }
          return out;
        });
      } catch (aggErr) {
        console.warn("[Analytics] Aggregation failed:", aggErr);
        // still return insight even if pipeline fails
      }
    }

    return NextResponse.json({ type, pipeline, results, insight, chartType, count: results.length });
  } catch (e) {
    console.error("[Analytics] Unexpected error:", e);
    return NextResponse.json({ message: (e as Error).message || "Analytics failed" }, { status: 500 });
  }
}
