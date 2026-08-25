import "server-only";

import { NextResponse } from "next/server";

import { createGbpOAuthState, buildGbpAuthorizationUrl } from "@/lib/gbp/oauth";
import { getGbpOAuthConfig, isGbpMockMode } from "@/lib/gbp/config";
import { requireInternalSession } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

/**
 * Start GBP OAuth — internal operators only.
 * Dashboard load never hits this; explicit Connect click only.
 */
function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function GET() {
  try {
    const session = await requireInternalSession();
    const config = getGbpOAuthConfig();
    if (!config.configured && !isGbpMockMode()) {
      return NextResponse.redirect(
        new URL("/reports/growth/local?gbp=not_configured", siteOrigin()),
      );
    }
    const state = await createGbpOAuthState({ operatorEmail: session.email });
    const authUrl = buildGbpAuthorizationUrl(state);
    // Mock mode returns a relative callback path — always redirect absolutely.
    const target = authUrl.startsWith("http")
      ? authUrl
      : new URL(authUrl, siteOrigin()).toString();
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(new URL("/internal-login", siteOrigin()));
  }
}
