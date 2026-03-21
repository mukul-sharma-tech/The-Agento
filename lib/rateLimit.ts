/**
 * AI call rate limiter.
 * - ADMIN_MAIL (env) → unlimited
 * - Everyone else   → AI_CALL_LIMIT (default 15) total calls
 *
 * Returns { allowed: true } or { allowed: false, used, limit }
 * On allowed, atomically increments the counter.
 */

import { connectDB } from "@/lib/db";
import User from "@/models/User";

const LIMIT = parseInt(process.env.AI_CALL_LIMIT || "15", 10);

export async function checkAndIncrementAILimit(
  email: string
): Promise<{ allowed: true; used: number; limit: number } | { allowed: false; used: number; limit: number }> {
  // Super-admin is always unlimited
  const adminMail = process.env.ADMIN_MAIL || "";
  if (adminMail && email.toLowerCase() === adminMail.toLowerCase()) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  await connectDB();

  // Atomically increment and return the NEW count
  const updated = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $inc: { aiCallCount: 1 } },
    { new: true, select: "aiCallCount" }
  );

  if (!updated) {
    // Shouldn't happen — session user always exists
    return { allowed: false, used: LIMIT, limit: LIMIT };
  }

  const used = updated.aiCallCount as number;

  if (used > LIMIT) {
    // Roll back the increment — they're over limit
    await User.updateOne({ email: email.toLowerCase() }, { $inc: { aiCallCount: -1 } });
    return { allowed: false, used: LIMIT, limit: LIMIT };
  }

  return { allowed: true, used, limit: LIMIT };
}

/** Read-only check — used by the dashboard to show current usage. */
export async function getAIUsage(
  email: string
): Promise<{ used: number; limit: number; unlimited: boolean }> {
  const adminMail = process.env.ADMIN_MAIL || "";
  if (adminMail && email.toLowerCase() === adminMail.toLowerCase()) {
    return { used: 0, limit: LIMIT, unlimited: true };
  }

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() }, "aiCallCount");
  const used = (user?.aiCallCount as number) ?? 0;
  return { used, limit: LIMIT, unlimited: false };
}
