import { NextResponse } from "next/server";
import { resolveGuestToken } from "@/lib/guestAuth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const identity = await resolveGuestToken(token);
  if (!identity) {
    return NextResponse.json({ message: "Invalid or disabled link" }, { status: 404 });
  }

  return NextResponse.json({
    company_id: identity.company_id,
    company_name: identity.company_name,
    features: identity.features,
  });
}
