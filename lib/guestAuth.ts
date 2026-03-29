import { connectDB } from "@/lib/db";
import PublicLink from "@/models/PublicLink";

export interface GuestIdentity {
  company_id: string;
  company_name: string;
  email: string;
  role: "guest";
  features: string[];
  token: string;
}

/**
 * Resolves a guest token from the x-guest-token header.
 * Returns a lightweight identity object or null if invalid/disabled.
 */
export async function resolveGuestToken(token: string | null | undefined): Promise<GuestIdentity | null> {
  if (!token) return null;

  await connectDB();

  const link = await PublicLink.findOne({ token, enabled: true });
  if (!link) return null;

  // Check expiry if set
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  return {
    company_id: link.company_id,
    company_name: link.company_name,
    email: `guest@${token}`,
    role: "guest",
    features: link.features,
    token,
  };
}

/**
 * Increments the guest call counter for a token.
 */
export async function incrementGuestCallCount(token: string): Promise<void> {
  await connectDB();
  await PublicLink.updateOne({ token }, { $inc: { guestCallCount: 1 } });
}
