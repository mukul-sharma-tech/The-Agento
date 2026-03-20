import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { inferSchema } from "@/app/api/query-genius/schema/route";

async function callOllama(prompt: string): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.1 } }),
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.response || "";
}

function sanitizeDocs(results: Record<string, unknown>[]) {
  return results.map((doc) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc)) {
      clean[k] = v?.toString?.() === "[object Object]" ? String(v) : v;
    }
    return clean;
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { operation, collectionName, query, formData } = body;

    if (!collectionName || !operation) {
      return NextResponse.json({ message: "collectionName and operation required" }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;
    const fullCollectionName = `qg_${companyId}_${collectionName}`;
    const col = db.collection(fullCollectionName);

    const totalCount = await col.countDocuments();
    const sample = await col.findOne({}, { projection: { _id: 0 } });
    const fields = sample ? Object.keys(sample) : [];

    const constraints = totalCount > 0 ? await inferSchema(col, totalCount) : {};

    const schemaSummary = Object.entries(constraints).map(([field, c]) => {
      const parts: string[] = [`${field} (${c.type})`];
      if (c.isPrimaryKey) parts.push("PRIMARY KEY");
      if (c.unique) parts.push("UNIQUE");
      if (c.isAutoIncrement) parts.push(`AUTO-INCREMENT (current max: ${c.currentMax})`);
      if (!c.nullable) parts.push("NOT NULL");
      if (c.enumValues) parts.push(`ENUM[${(c.enumValues as unknown[]).join(", ")}]`);
      if (c.type === "number" && c.min !== undefined) parts.push(`range: ${c.min}–${c.max}`);
      parts.push(`e.g. ${JSON.stringify(c.sampleValues[0])}`);
      return parts.join(" | ");
    }).join("\n");

    // ── READ ──────────────────────────────────────────────────────────────────
    if (operation === "read") {
      if (!sample) return NextResponse.json({ message: "Collection is empty", operation, results: [] });
      if (!query) return NextResponse.json({ message: "Query text required for read", operation, results: [] });

      const fieldTypes = Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, typeof v]));
      const prompt = `You are a MongoDB expert. Convert this natural language query to a MongoDB aggregation pipeline JSON array.

COLLECTION: ${collectionName}
FIELDS: ${JSON.stringify(fieldTypes)}
SAMPLE DOCUMENT: ${JSON.stringify(sample)}
QUERY: "${query}"

RULES:
1. Return ONLY a valid JSON array, nothing else
2. No markdown, no code blocks, no explanations
3. Use $regex with 'i' flag for text searches
4. For numeric comparisons use $gt, $lt, $gte, $lte
5. Always add {"$limit": 100} at the end unless query asks for specific count
6. If grouping, use $group with _id field
7. If sorting, use $sort

RESPONSE (JSON array only):`;

      const raw = (await callOllama(prompt)).trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return NextResponse.json({ message: "Could not generate a valid query", operation, results: [] });

      let pipeline;
      try { pipeline = JSON.parse(match[0]); }
      catch { return NextResponse.json({ message: "Failed to parse generated query", operation, results: [] }); }

      const results = await col.aggregate(pipeline).toArray();
      return NextResponse.json({ operation, pipeline, results: sanitizeDocs(results), fields, count: results.length });
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    if (operation === "insert") {
      if (!formData || typeof formData !== "object") {
        return NextResponse.json({ message: "formData required for insert", operation, results: [] }, { status: 400 });
      }

      // Coerce form string values to correct types based on schema
      const doc: Record<string, unknown> = {};
      for (const [field, c] of Object.entries(constraints)) {
        if (c.isAutoIncrement) continue; // handled below
        const raw = formData[field];
        if (raw === undefined || raw === "") {
          if (!c.nullable) {
            return NextResponse.json({
              message: `Field "${field}" is required.`,
              operation, results: [],
              validationErrors: [`"${field}" is required`],
            }, { status: 422 });
          }
          doc[field] = null;
          continue;
        }
        if (c.type === "number") {
          const n = Number(raw);
          if (isNaN(n)) {
            return NextResponse.json({
              message: `Field "${field}" must be a number.`,
              operation, results: [],
              validationErrors: [`"${field}" must be a number, got "${raw}"`],
            }, { status: 422 });
          }
          doc[field] = n;
        } else {
          doc[field] = String(raw).trim();
        }
      }

      // Enum validation
      for (const [field, c] of Object.entries(constraints)) {
        if (c.enumValues && doc[field] !== undefined && doc[field] !== null) {
          if (!(c.enumValues as unknown[]).includes(doc[field])) {
            return NextResponse.json({
              message: `"${field}" must be one of: ${(c.enumValues as unknown[]).join(", ")}`,
              operation, results: [],
              validationErrors: [`Invalid value for "${field}": ${doc[field]}`],
            }, { status: 422 });
          }
        }
      }

      // Auto-increment: assign next value
      for (const [field, c] of Object.entries(constraints)) {
        if (c.isAutoIncrement && c.currentMax !== undefined) {
          doc[field] = c.currentMax + 1;
        }
      }

      // Live uniqueness check
      for (const [field, c] of Object.entries(constraints)) {
        if (c.unique && doc[field] !== undefined) {
          const exists = await col.findOne({ [field]: doc[field] });
          if (exists) {
            return NextResponse.json({
              message: `"${field}" must be unique — value "${doc[field]}" already exists.`,
              operation, results: [],
              validationErrors: [`Duplicate value for "${field}": ${doc[field]}`],
            }, { status: 422 });
          }
        }
      }

      const docToInsert = { ...doc };
      await col.insertOne(docToInsert);
      const { _id: _ignored, ...cleanDoc } = docToInsert as Record<string, unknown> & { _id?: unknown };
      return NextResponse.json({ operation, message: "Inserted 1 document", document: cleanDoc, results: [], count: 1 });
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (operation === "update") {
      if (!sample) return NextResponse.json({ message: "Collection is empty", operation, results: [] }, { status: 400 });
      if (!query) return NextResponse.json({ message: "Query text required for update", operation, results: [] });

      const prompt = `You are a MongoDB expert. Convert this natural language update request into a MongoDB updateMany operation.

COLLECTION: ${collectionName}
FULL SCHEMA:
${schemaSummary}

USER REQUEST: "${query}"

CRITICAL RULES:
1. Return ONLY a valid JSON object with exactly two keys: "filter" and "update". No markdown, no explanations.
2. "filter" is the MongoDB filter query object.
3. "update" uses MongoDB update operators ($set, $inc, $unset, etc.).
4. Do NOT update PRIMARY KEY or AUTO-INCREMENT fields.
5. For ENUM fields: only set values from the allowed enum list.
6. Use {} as filter only if the request explicitly says "all records".

EXAMPLE: {"filter": {"status": "active"}, "update": {"$set": {"status": "inactive"}}}

RESPONSE (JSON object only):`;

      const raw = (await callOllama(prompt)).trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ message: "Could not generate update operation", operation, results: [] });

      let op: { filter: Record<string, unknown>; update: Record<string, unknown> };
      try { op = JSON.parse(match[0]); }
      catch { return NextResponse.json({ message: "Failed to parse update operation", operation, results: [] }); }

      if (!op.filter || !op.update) {
        return NextResponse.json({ message: "Invalid update: missing filter or update", operation, results: [] });
      }

      // Block PK/auto-increment updates
      const setFields = Object.keys((op.update as Record<string, Record<string, unknown>>)["$set"] ?? {});
      const blocked = setFields.filter((f) => constraints[f]?.isPrimaryKey || constraints[f]?.isAutoIncrement);
      if (blocked.length > 0) {
        return NextResponse.json({
          message: `Cannot modify primary key field(s): ${blocked.join(", ")}`,
          operation, results: [],
        }, { status: 422 });
      }

      // Enum validation
      const setObj = (op.update as Record<string, Record<string, unknown>>)["$set"] ?? {};
      for (const [field, val] of Object.entries(setObj)) {
        const c = constraints[field];
        if (c?.enumValues && !(c.enumValues as unknown[]).includes(val)) {
          return NextResponse.json({
            message: `"${field}" must be one of: ${(c.enumValues as unknown[]).join(", ")}`,
            operation, results: [],
          }, { status: 422 });
        }
      }

      const result = await col.updateMany(op.filter, op.update);
      return NextResponse.json({
        operation,
        message: `Updated ${result.modifiedCount} document(s)`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        filter: op.filter,
        update: op.update,
        results: [],
        count: result.modifiedCount,
      });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (operation === "delete") {
      if (!sample) return NextResponse.json({ message: "Collection is empty", operation, results: [] }, { status: 400 });
      if (!query) return NextResponse.json({ message: "Query text required for delete", operation, results: [] });

      const prompt = `You are a MongoDB expert. Convert this natural language delete request into a MongoDB filter query object.

COLLECTION: ${collectionName}
FULL SCHEMA:
${schemaSummary}

USER REQUEST: "${query}"

CRITICAL RULES:
1. Return ONLY a valid JSON object representing the filter. No markdown, no explanations.
2. Use $regex with 'i' flag for text matches.
3. For numeric comparisons use $gt, $lt, $gte, $lte.
4. NEVER return {} — if the request is to delete all, return {"_deleteAll": true}.

RESPONSE (JSON object only):`;

      const raw = (await callOllama(prompt)).trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ message: "Could not generate delete filter", operation, results: [] });

      let filter: Record<string, unknown>;
      try { filter = JSON.parse(match[0]); }
      catch { return NextResponse.json({ message: "Failed to parse delete filter", operation, results: [] }); }

      if (Object.keys(filter).length === 0) {
        return NextResponse.json({
          message: "Delete filter is empty — be more specific.",
          operation, results: [],
        }, { status: 422 });
      }
      if (filter._deleteAll) delete filter._deleteAll;

      const previewCount = await col.countDocuments(filter);
      if (previewCount === 0) {
        return NextResponse.json({ message: "No documents matched — nothing deleted.", operation, filter, results: [], count: 0 });
      }

      const result = await col.deleteMany(filter);
      return NextResponse.json({
        operation,
        message: `Deleted ${result.deletedCount} document(s)`,
        deletedCount: result.deletedCount,
        filter,
        results: [],
        count: result.deletedCount,
      });
    }

    return NextResponse.json({ message: "Unknown operation" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Query execution failed" }, { status: 500 });
  }
}
