/**
 * Commercial test database safety.
 * Never run commercial E2E/integration DB writes against production.
 */

export function resolveCommercialTestDatabaseUrl(): string | null {
  const explicit =
    process.env.COMMERCIAL_TEST_DATABASE_URL?.trim() ||
    process.env.TEST_DATABASE_URL?.trim() ||
    null;

  if (explicit) {
    return explicit;
  }

  if (process.env.COMMERCIAL_E2E_USE_DEV_DB === "1") {
    return (
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      null
    );
  }

  return null;
}

export function assertCommercialTestDatabaseUrl(url: string): void {
  const lower = url.toLowerCase();

  if (
    /[/\-_]prod([/\-_]|$)/.test(lower) ||
    lower.includes("production") ||
    lower.includes("prod-db")
  ) {
    throw new Error(
      "Refusing commercial tests: database URL looks production-like. Set COMMERCIAL_TEST_DATABASE_URL to an isolated test database.",
    );
  }

  if (
    process.env.COMMERCIAL_E2E_USE_DEV_DB === "1" &&
    !process.env.COMMERCIAL_TEST_DATABASE_URL &&
    !process.env.TEST_DATABASE_URL
  ) {
    console.warn(
      "[commercial-test] Using primary DATABASE_URL with COMMERCIAL_E2E_USE_DEV_DB=1. Prefer a dedicated COMMERCIAL_TEST_DATABASE_URL.",
    );
  }
}

export function applyCommercialTestDatabaseEnv(): string {
  const url = resolveCommercialTestDatabaseUrl();
  if (!url) {
    throw new Error(
      "COMMERCIAL_TEST_DATABASE_URL (preferred), TEST_DATABASE_URL, or COMMERCIAL_E2E_USE_DEV_DB=1 with a non-production DATABASE_URL is required for DB-backed commercial tests. Never use production. Tip: npm run test:commercial auto-enables COMMERCIAL_E2E_USE_DEV_DB=1 for local DATABASE_URL.",
    );
  }
  assertCommercialTestDatabaseUrl(url);
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = process.env.DIRECT_URL?.trim() || url;
  process.env.COMMERCIAL_TEST_MOCK_RESEND = "1";
  process.env.COMMERCIAL_TEST_MOCK_EXTERNALS = "1";
  process.env.COMMERCIAL_TEST_MOCK_STRIPE = "1";
  return url;
}
