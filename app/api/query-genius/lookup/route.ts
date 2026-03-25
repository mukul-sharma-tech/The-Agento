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

    const body = await req.json();
    const { mode, collectionName } = body;
    
    if (!collectionName || !mode) {
      return NextResponse.json({ message: "mode and collectionName required" }, { status: 400 });
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

    let pipeline: object[] = [];
    let chartType = "bar";
    
    if (mode === "manual") {
      const { xAxis, yAxis, aggType, chartType: cType } = body;
      chartType = cType || "bar";
      
      if (!xAxis) return NextResponse.json({ message: "xAxis is required for manual mode" }, { status: 400 });

      if (aggType === "none" || !aggType) {
        // Just fetch raw data and map keys
        pipeline = [
          { $limit: 100 }
        ];
      } else if (aggType === "count") {
        pipeline = [
          { $group: { _id: `$${xAxis}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 100 }
        ];
      } else {
        if (!yAxis) return NextResponse.json({ message: "yAxis required for this aggregation" }, { status: 400 });
        pipeline = [
          { $group: { _id: `$${xAxis}`, [yAxis]: { [`$${aggType}`]: { $convert: { input: `$${yAxis}`, to: "double", onError: 0, onNull: 0 } } } } },
          { $sort: { [yAxis]: -1 } },
          { $limit: 100 }
        ];
      }
    } else if (mode === "ai") {
      const { query } = body;
      if (!query) return NextResponse.json({ message: "query is required for AI mode" }, { status: 400 });

      const limit = await checkAndIncrementAILimit(session.user.email!, "query");
      if (!limit.allowed) {
        return NextResponse.json(
          { message: "AI call limit reached", limitReached: true, used: limit.used, limit: limit.limit },
          { status: 429 }
        );
      }

      const sample = await col.find({}, { projection: { _id: 0 } }).limit(5).toArray();
      const fields = sample[0] ? Object.keys(sample[0]) : [];

      const prompt = `You are an expert MongoDB data analyst.
The user wants to generate a chart based on their collection.

COLLECTION: ${collectionName}
TOTAL RECORDS: ${totalCount}
FIELDS: ${fields.join(", ")}
SAMPLE DATA:
${JSON.stringify(sample, null, 2)}

USER VISUALIZATION REQUEST: "${query}"

Return EXACTLY this format - no markdown, no code fences:
PIPELINE:
[JSON aggregation pipeline array to extract the necessary data for the chart, max 100 results]
CHART_TYPE:
[one of: bar, line, pie, area, scatter]`;

      let raw: string;
      try {
        raw = await callLLM(prompt, 60000); 
      } catch (llmErr) {
        return NextResponse.json({ message: `LLM unavailable: ${(llmErr as Error).message}` }, { status: 502 });
      }

      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const pipelineMatch = cleaned.match(/PIPELINE:\s*(\[[\s\S]*?\])\s*CHART_TYPE:/i);
      if (pipelineMatch) {
        try { pipeline = JSON.parse(pipelineMatch[1].trim()); } catch { /* ignore */ }
      } else {
        const anyArr = cleaned.match(/\[[\s\S]*?\]/);
        if (anyArr) { try { pipeline = JSON.parse(anyArr[0]); } catch { /* ignore */ } }
      }

      const chartMatch = cleaned.match(/CHART_TYPE:\s*(\w+)/i);
      if (chartMatch) chartType = chartMatch[1].toLowerCase().trim();
    } else {
      return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }

    // Execute pipeline
    let results: Record<string, unknown>[] = [];
    if (pipeline.length > 0) {
      try {
        const raw2 = await col.aggregate(pipeline).toArray();
        results = raw2.map(doc => {
          const out: Record<string, unknown> = {};
          if (mode === "manual" && body.aggType === "none") {
             // For raw mode, we forcefully map xAxis to 'label' so Chart works, and leave the rest
             out["label"] = String(doc[body.xAxis] || "null");
             for (const [k, v] of Object.entries(doc)) {
               if (k !== "_id") out[k] = v;
             }
             return out;
          }
          for (const [k, v] of Object.entries(doc)) {
            if (k === "_id") {
              if (v !== null && typeof v === "object" && !Array.isArray(v)) {
                const obj = v as Record<string, unknown>;
                const entries = Object.entries(obj);
                if (entries.length === 1) out[entries[0][0]] = entries[0][1];
                else if (entries.length > 1) out["label"] = entries.map(([, val]) => String(val)).join(" / ");
                else out["label"] = "N/A";
              } else {
                out["label"] = v === null ? "null" : String(v);
              }
              continue;
            }
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
        return NextResponse.json({ message: `Aggregation failed: ${(aggErr as Error).message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ pipeline, results, chartType, count: results.length });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message || "LookUp failed" }, { status: 500 });
  }
}
