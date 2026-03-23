/**
 * Per-feature AI call rate limiter.
 * Free tier: 10 calls per feature (chat, voice, query).
 * Subscribed users get their plan limit (or unlimited).
 */

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export type AIFeature = "chat" | "voice" | "query";

const FREE_LIMIT = 10;

const FIELD_MAP: Record<AIFeature, string> = {
  chat:  "chatCallCount",
  voice: "voiceCallCount",
  query: "queryCallCount",
};

/** Returns the call limit for a given plan and feature. */
function getPlanLimit(plan: string | undefined, feature: AIFeature): number {
  if (!plan || plan === "starter") return FREE_LIMIT;
  if (plan === "business") return Infinity;
  if (plan === "pro-chat" && (feature === "chat" || feature === "voice")) return 500;
  if (plan === "pro-query" && feature === "query") return 500;
  // pro-chat user trying query genius, or pro-query user trying chat/voice → free limit
  return FREE_LIMIT;
}

export async function checkAndIncrementAILimit(
  email: string,
  feature: AIFeature
): Promise<{ allowed: true; used: number; limit: number } | { allowed: false; used: number; limit: number }> {
  const adminMail = process.env.ADMIN_MAIL || "";
  if (adminMail && email.toLowerCase() === adminMail.toLowerCase()) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  await connectDB();

  const field = FIELD_MAP[feature];

  const updated = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $inc: { [field]: 1 } },
    { new: true, select: `${field} subscriptionPlan subscription subscriptionExpiry` }
  );

  if (!updated) return { allowed: false, used: FREE_LIMIT, limit: FREE_LIMIT };

  // Check subscription expiry
  const activePlan =
    updated.subscription && updated.subscriptionExpiry && updated.subscriptionExpiry > new Date()
      ? updated.subscriptionPlan
      : "starter";

  const limit = getPlanLimit(activePlan, feature);
  const used = updated[field as keyof typeof updated] as number;

  if (used > limit) {
    await User.updateOne({ email: email.toLowerCase() }, { $inc: { [field]: -1 } });
    return { allowed: false, used: Math.min(used - 1, limit), limit: limit === Infinity ? 999999 : limit };
  }

  return { allowed: true, used, limit: limit === Infinity ? 999999 : limit };
}

/** Read-only usage summary for dashboard. */
export async function getAIUsage(email: string): Promise<{
  chat: { used: number; limit: number };
  voice: { used: number; limit: number };
  query: { used: number; limit: number };
  unlimited: boolean;
}> {
  const adminMail = process.env.ADMIN_MAIL || "";
  if (adminMail && email.toLowerCase() === adminMail.toLowerCase()) {
    return {
      chat:  { used: 0, limit: FREE_LIMIT },
      voice: { used: 0, limit: FREE_LIMIT },
      query: { used: 0, limit: FREE_LIMIT },
      unlimited: true,
    };
  }

  await connectDB();
  const user = await User.findOne(
    { email: email.toLowerCase() },
    "chatCallCount voiceCallCount queryCallCount subscription subscriptionPlan subscriptionExpiry"
  );

  const activePlan =
    user?.subscription && user?.subscriptionExpiry && user.subscriptionExpiry > new Date()
      ? user.subscriptionPlan
      : "starter";

  const chatLimit  = getPlanLimit(activePlan, "chat");
  const voiceLimit = getPlanLimit(activePlan, "voice");
  const queryLimit = getPlanLimit(activePlan, "query");

  return {
    chat:  { used: user?.chatCallCount  ?? 0, limit: chatLimit  === Infinity ? 999999 : chatLimit },
    voice: { used: user?.voiceCallCount ?? 0, limit: voiceLimit === Infinity ? 999999 : voiceLimit },
    query: { used: user?.queryCallCount ?? 0, limit: queryLimit === Infinity ? 999999 : queryLimit },
    unlimited: activePlan === "business",
  };
}
