import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// ── Schema types ──────────────────────────────────────────────────────────────
export interface SchemaField {
  type: "string" | "number" | "boolean";
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  autoIncrement?: boolean;
  enumValues?: string[]; // comma-separated allowed values
}
export type UserSchema = Record<string, SchemaField>;

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").replace(/\s+/g, "_").toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
    if (vals.length !== headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx]; });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Row validator ─────────────────────────────────────────────────────────────
interface ValidateResult {
  doc: Record<string, unknown> | null;
  errors: string[];
}

function validateRow(
  raw: Record<string, string>,
  schema: UserSchema,
  seenUnique: Record<string, Set<unknown>>, // tracks uniqueness within the batch
): ValidateResult {
  const errors: string[] = [];
  const doc: Record<string, unknown> = {};

  for (const [field, def] of Object.entries(schema)) {
    if (def.autoIncrement) continue; // assigned server-side

    const rawVal = raw[field];
    const missing = rawVal === undefined || rawVal === "";

    if (missing) {
      if (!def.nullable) {
        errors.push(`"${field}" is required`);
      } else {
        doc[field] = null;
      }
      continue;
    }

    // Type coercion + validation
    if (def.type === "number") {
      const n = Number(rawVal);
      if (isNaN(n)) { errors.push(`"${field}" must be a number, got "${rawVal}"`); continue; }
      doc[field] = n;
    } else if (def.type === "boolean") {
      const b = rawVal.toLowerCase();
      if (b !== "true" && b !== "false") { errors.push(`"${field}" must be true/false`); continue; }
      doc[field] = b === "true";
    } else {
      doc[field] = rawVal;
    }

    // Enum check
    if (def.enumValues && def.enumValues.length > 0) {
      if (!def.enumValues.includes(String(doc[field]))) {
        errors.push(`"${field}" must be one of [${def.enumValues.join(", ")}], got "${doc[field]}"`);
        continue;
      }
    }

    // Batch uniqueness (within the uploaded file)
    if (def.unique || def.primaryKey) {
      if (!seenUnique[field]) seenUnique[field] = new Set();
      if (seenUnique[field].has(doc[field])) {
        errors.push(`"${field}" must be unique — duplicate value "${doc[field]}" in file`);
        continue;
      }
      seenUnique[field].add(doc[field]);
    }
  }

  return { doc: errors.length === 0 ? doc : null, errors };
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const fd = await req.formData();
    const file = fd.get("file") as File;
    const collectionName = fd.get("collectionName") as string;
    const mode = (fd.get("mode") as string) || "replace"; // "replace" | "append"
    const schemaRaw = fd.get("schema") as string | null;

    if (!file || !collectionName) {
      return NextResponse.json({ message: "File and collection name required" }, { status: 400 });
    }

    const userSchema: UserSchema | null = schemaRaw ? JSON.parse(schemaRaw) : null;

    // Parse file
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    if (rows.length === 0) return NextResponse.json({ message: "File is empty or has no data rows" }, { status: 400 });

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;
    const fullName = `qg_${companyId}_${collectionName}`;
    const metaCol = db.collection(`qg_meta_${companyId}`);
    const col = db.collection(fullName);

    // ── Save / load schema ────────────────────────────────────────────────────
    let schema: UserSchema;
    if (mode === "replace" && userSchema) {
      // Store the user-defined schema
      await metaCol.updateOne(
        { collection: collectionName },
        { $set: { collection: collectionName, schema: userSchema, updatedAt: new Date() } },
        { upsert: true }
      );
      schema = userSchema;
    } else {
      // Load stored schema for append mode
      const meta = await metaCol.findOne({ collection: collectionName });
      schema = (meta?.schema as UserSchema) ?? {};
    }

    // ── Validate rows ─────────────────────────────────────────────────────────
    const seenUnique: Record<string, Set<unknown>> = {};
    const valid: Record<string, unknown>[] = [];
    const rejected: { row: number; values: Record<string, string>; errors: string[] }[] = [];

    // For append: load existing unique values from DB to check against
    const existingUnique: Record<string, Set<unknown>> = {};
    if (Object.keys(schema).length > 0) {
      for (const [field, def] of Object.entries(schema)) {
        if ((def.unique || def.primaryKey) && !def.autoIncrement) {
          const existing = await col.distinct(field);
          existingUnique[field] = new Set(existing);
        }
      }
    }

    // Auto-increment: find current max
    const autoMaxes: Record<string, number> = {};
    for (const [field, def] of Object.entries(schema)) {
      if (def.autoIncrement) {
        const docs = await col.find({}, { projection: { [field]: 1, _id: 0 } })
          .sort({ [field]: -1 }).limit(1).toArray();
        autoMaxes[field] = docs.length > 0 ? Number(docs[0][field]) : 0;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const { doc, errors } = validateRow(rows[i], schema, seenUnique);

      if (errors.length > 0) {
        rejected.push({ row: i + 2, values: rows[i], errors });
        continue;
      }

      // Live uniqueness check against existing DB data
      let dbConflict = false;
      for (const [field, def] of Object.entries(schema)) {
        if ((def.unique || def.primaryKey) && !def.autoIncrement && doc![field] !== undefined) {
          if (existingUnique[field]?.has(doc![field])) {
            rejected.push({ row: i + 2, values: rows[i], errors: [`"${field}" value "${doc![field]}" already exists in table`] });
            dbConflict = true;
            break;
          }
          // Add to seen so next rows in this batch also check against it
          existingUnique[field] = existingUnique[field] ?? new Set();
          existingUnique[field].add(doc![field]);
        }
      }
      if (dbConflict) continue;

      // Assign auto-increment values
      for (const [field, def] of Object.entries(schema)) {
        if (def.autoIncrement) {
          autoMaxes[field] = (autoMaxes[field] ?? 0) + 1;
          doc![field] = autoMaxes[field];
        }
      }

      valid.push(doc!);
    }

    // ── Replace: drop old data ────────────────────────────────────────────────
    if (mode === "replace") {
      try { await db.dropCollection(fullName); } catch { /* may not exist */ }
    }

    if (valid.length > 0) await col.insertMany(valid);

    return NextResponse.json({
      message: valid.length > 0
        ? `${valid.length} row(s) inserted${rejected.length > 0 ? `, ${rejected.length} rejected` : ""}`
        : `All ${rejected.length} rows rejected due to constraint violations`,
      inserted: valid.length,
      rejected: rejected.length,
      rejectedDetails: rejected.slice(0, 20), // cap at 20 for response size
      fields: headers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
