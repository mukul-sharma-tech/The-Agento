import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { Collection, Document } from "mongodb";

export interface FieldConstraint {
  type: string;
  nullable: boolean;
  unique: boolean;
  isAutoIncrement: boolean;
  isPrimaryKey: boolean;
  min?: number;
  max?: number;
  enumValues?: unknown[];
  currentMax?: number;
  sampleValues: unknown[];
}

export async function inferSchema(
  col: Collection<Document>,
  totalCount: number
): Promise<Record<string, FieldConstraint>> {
  const sampleSize = Math.min(totalCount, 500);
  const docs = await col.find({}, { projection: { _id: 0 } }).limit(sampleSize).toArray();
  if (docs.length === 0) return {};

  const fieldMap: Record<string, { types: Set<string>; values: unknown[]; nullCount: number }> = {};

  for (const doc of docs) {
    for (const [k, v] of Object.entries(doc)) {
      if (!fieldMap[k]) fieldMap[k] = { types: new Set(), values: [], nullCount: 0 };
      if (v === null || v === undefined) fieldMap[k].nullCount++;
      else { fieldMap[k].types.add(typeof v); fieldMap[k].values.push(v); }
    }
  }

  const constraints: Record<string, FieldConstraint> = {};

  for (const [field, info] of Object.entries(fieldMap)) {
    const type = [...info.types][0] ?? "string";
    const nullable = info.nullCount > 0;
    const allValues = info.values;
    const distinct = new Set(allValues.map(String));

    // Only numeric/id-like fields can be unique keys
    const looksLikeKey = field === "id" || field.endsWith("_id") || field.endsWith("Id") || type === "number";
    const unique = looksLikeKey && distinct.size === allValues.length && allValues.length > 1;

    let isAutoIncrement = false;
    let currentMax: number | undefined;
    if (type === "number" && unique) {
      const nums = allValues.map(Number).filter((n) => Number.isInteger(n));
      if (nums.length === allValues.length) {
        const sorted = [...nums].sort((a, b) => a - b);
        const isSeq = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
        if (isSeq) { isAutoIncrement = true; currentMax = Math.max(...nums); }
      }
    }

    const isPrimaryKey = field === "id" || field.endsWith("_id") || (unique && isAutoIncrement);

    let min: number | undefined, max: number | undefined;
    if (type === "number") {
      const nums = allValues.map(Number);
      min = Math.min(...nums); max = Math.max(...nums);
      if (isAutoIncrement) currentMax = max;
    }

    let enumValues: unknown[] | undefined;
    if (type === "string" && distinct.size <= 15 && allValues.length >= 3) {
      enumValues = [...distinct].sort();
    }

    constraints[field] = {
      type, nullable, unique, isAutoIncrement, isPrimaryKey,
      min, max, enumValues, currentMax,
      sampleValues: [...allValues].slice(0, 3),
    };
  }

  return constraints;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");
    if (!collectionName) return NextResponse.json({ message: "Collection required" }, { status: 400 });

    await connectDB();
    const db = mongoose.connection.db!;
    const companyId = session.user.company_id;
    const fullName = `qg_${companyId}_${collectionName}`;
    const col = db.collection(fullName);
    const totalCount = await col.countDocuments();

    if (totalCount === 0) return NextResponse.json({ schema: {}, totalCount: 0 });

    const schema = await inferSchema(col, totalCount);
    return NextResponse.json({ schema, totalCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Schema fetch failed" }, { status: 500 });
  }
}
