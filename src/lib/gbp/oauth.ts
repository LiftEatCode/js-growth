import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

import { GBP_OAUTH_SCOPE } from "@/lib/gbp/constants";
import { getGbpOAuthConfig, isGbpMockMode } from "@/lib/gbp/config";

const STATE_TTL_SECONDS = 600;

function stateSecret(): Uint8Array {
  const raw =
    process.env.GOOGLE_GBP_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.REPORTS_SESSION_SECRET?.trim();
  if (!raw) {
    throw new Error("Missing secret for GBP OAuth state signing");
  }
  return createHash("sha256").update(`gbp-oauth-state-v1:${raw}`).digest();
}

export async function createGbpOAuthState(input: {
  operatorEmail: string;
}): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  return new SignJWT({
    purpose: "gbp_oauth",
    email: input.operatorEmail.toLowerCase(),
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .sign(stateSecret());
}

export async function verifyGbpOAuthState(
  state: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  try {
    const { payload } = await jwtVerify(state, stateSecret());
    if (payload.purpose !== "gbp_oauth") {
      return { ok: false, error: "Invalid OAuth state purpose" };
    }
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      return { ok: false, error: "Invalid OAuth state email" };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, error: "Invalid or expired OAuth state" };
  }
}

export function buildGbpAuthorizationUrl(state: string): string {
  if (isGbpMockMode()) {
    return `/api/gbp/oauth/callback?code=mock_auth_code&state=${encodeURIComponent(state)}`;
  }
  const config = getGbpOAuthConfig();
  if (!config.configured || !config.clientId || !config.redirectUri) {
    throw new Error("GBP OAuth not configured");
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GBP_OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GbpTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export async function exchangeGbpAuthorizationCode(
  code: string,
): Promise<GbpTokenResponse> {
  if (isGbpMockMode() || code === "mock_auth_code") {
    return {
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      expires_in: 3600,
      scope: GBP_OAUTH_SCOPE,
      token_type: "Bearer",
    };
  }
  const config = getGbpOAuthConfig();
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error("GBP OAuth not configured");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`GBP token exchange failed (${res.status})`);
  }
  return (await res.json()) as GbpTokenResponse;
}

export async function refreshGbpAccessToken(
  refreshToken: string,
): Promise<GbpTokenResponse> {
  if (isGbpMockMode() || refreshToken === "mock_refresh_token") {
    return {
      access_token: "mock_access_token_refreshed",
      expires_in: 3600,
      scope: GBP_OAUTH_SCOPE,
      token_type: "Bearer",
    };
  }
  const config = getGbpOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("GBP OAuth not configured");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = new Error(`GBP token refresh failed (${res.status})`) as Error & {
      code?: string;
    };
    err.code = res.status === 400 || res.status === 401 ? "AUTH_EXPIRED" : "ERROR";
    throw err;
  }
  return (await res.json()) as GbpTokenResponse;
}

export function safeEqualString(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}
