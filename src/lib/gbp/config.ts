import "server-only";

import { GBP_OAUTH_CALLBACK_PATH } from "@/lib/gbp/constants";

export type GbpOAuthConfig = {
  configured: boolean;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
};

export function getGbpOAuthConfig(): GbpOAuthConfig {
  const clientId = process.env.GOOGLE_GBP_CLIENT_ID?.trim() || null;
  const clientSecret = process.env.GOOGLE_GBP_CLIENT_SECRET?.trim() || null;
  const explicitRedirect = process.env.GOOGLE_GBP_REDIRECT_URI?.trim() || null;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") || null;
  const redirectUri =
    explicitRedirect ||
    (siteUrl ? `${siteUrl}${GBP_OAUTH_CALLBACK_PATH}` : null);

  return {
    configured: Boolean(clientId && clientSecret && redirectUri),
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function isGbpMockMode(): boolean {
  return (
    process.env.GROWTH_TEST_MOCK_GBP === "1" ||
    process.env.COMMERCIAL_TEST_MOCK_EXTERNALS === "1"
  );
}

export function requireGbpConfigured(): GbpOAuthConfig {
  const config = getGbpOAuthConfig();
  if (!config.configured && !isGbpMockMode()) {
    throw new Error(
      "Google Business Profile OAuth is not configured (GOOGLE_GBP_CLIENT_ID/SECRET/REDIRECT_URI).",
    );
  }
  return config;
}
