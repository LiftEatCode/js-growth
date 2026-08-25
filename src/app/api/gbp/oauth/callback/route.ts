import "server-only";

import { NextResponse } from "next/server";

import { upsertGbpConnectionAfterOAuth } from "@/lib/gbp/connection-store";
import {
  exchangeGbpAuthorizationCode,
  verifyGbpOAuthState,
} from "@/lib/gbp/oauth";
import { redactGbpSecrets } from "@/lib/gbp/crypto";

export const dynamic = "force-dynamic";

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * OAuth callback — validates state, exchanges code, stores encrypted refresh token.
 * Never renders tokens. No open redirect.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${siteOrigin()}/reports/growth/local?gbp=oauth_denied`,
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      `${siteOrigin()}/reports/growth/local?gbp=oauth_invalid`,
    );
  }

  const verified = await verifyGbpOAuthState(state);
  if (!verified.ok) {
    return NextResponse.redirect(
      `${siteOrigin()}/reports/growth/local?gbp=oauth_state`,
    );
  }

  try {
    const tokens = await exchangeGbpAuthorizationCode(code);
    if (!tokens.refresh_token && code !== "mock_auth_code") {
      // Re-consent may omit refresh token if already granted — require reconnect with prompt=consent
      return NextResponse.redirect(
        `${siteOrigin()}/reports/growth/local?gbp=oauth_no_refresh`,
      );
    }
    const refresh =
      tokens.refresh_token ??
      (code === "mock_auth_code" ? "mock_refresh_token" : null);
    if (!refresh) {
      return NextResponse.redirect(
        `${siteOrigin()}/reports/growth/local?gbp=oauth_no_refresh`,
      );
    }

    await upsertGbpConnectionAfterOAuth({
      refreshToken: refresh,
      scopes: tokens.scope,
      operatorEmail: verified.email,
    });

    return NextResponse.redirect(
      `${siteOrigin()}/reports/growth/local?gbp=connected`,
    );
  } catch (error) {
    console.error(
      "[gbp-oauth] callback failed",
      redactGbpSecrets(
        error instanceof Error ? error.message : "unknown error",
      ),
    );
    return NextResponse.redirect(
      `${siteOrigin()}/reports/growth/local?gbp=oauth_error`,
    );
  }
}
