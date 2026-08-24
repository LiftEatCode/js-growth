/**
 * Growth / acceptance test database safety.
 * Never run growth E2E/integration DB writes against production.
 */

import {
  assertCommercialTestDatabaseUrl,
  resolveCommercialTestDatabaseUrl,
} from "../commercial/db-safety";

export function resolveGrowthTestDatabaseUrl(): string | null {
  const explicit =
    process.env.ACCEPTANCE_TEST_DATABASE_URL?.trim() ||
    process.env.GROWTH_TEST_DATABASE_URL?.trim() ||
    null;

  if (explicit) {
    return explicit;
  }

  if (
    process.env.GROWTH_E2E_USE_DEV_DB === "1" ||
    process.env.ACCEPTANCE_E2E_USE_DEV_DB === "1"
  ) {
    return (
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      null
    );
  }

  // Fall back to commercial resolution so one local DB can serve both suites.
  return resolveCommercialTestDatabaseUrl();
}

export function assertGrowthTestDatabaseUrl(url: string): void {
  assertCommercialTestDatabaseUrl(url);

  if (
    (process.env.GROWTH_E2E_USE_DEV_DB === "1" ||
      process.env.ACCEPTANCE_E2E_USE_DEV_DB === "1") &&
    !process.env.GROWTH_TEST_DATABASE_URL &&
    !process.env.ACCEPTANCE_TEST_DATABASE_URL &&
    !process.env.COMMERCIAL_TEST_DATABASE_URL &&
    !process.env.TEST_DATABASE_URL
  ) {
    console.warn(
      "[growth-test] Using primary DATABASE_URL with GROWTH_E2E_USE_DEV_DB / ACCEPTANCE_E2E_USE_DEV_DB. Prefer a dedicated GROWTH_TEST_DATABASE_URL or ACCEPTANCE_TEST_DATABASE_URL.",
    );
  }
}

export function applyGrowthTestDatabaseEnv(): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing growth tests: NODE_ENV=production. Never run acceptance against production.",
    );
  }

  const url = resolveGrowthTestDatabaseUrl();
  if (!url) {
    throw new Error(
      "ACCEPTANCE_TEST_DATABASE_URL / GROWTH_TEST_DATABASE_URL / COMMERCIAL_TEST_DATABASE_URL (or GROWTH_E2E_USE_DEV_DB=1 with non-production DATABASE_URL) is required for DB-backed growth tests.",
    );
  }
  assertGrowthTestDatabaseUrl(url);
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = process.env.DIRECT_URL?.trim() || url;
  process.env.COMMERCIAL_TEST_MOCK_RESEND = "1";
  process.env.COMMERCIAL_TEST_MOCK_EXTERNALS = "1";
  process.env.COMMERCIAL_TEST_MOCK_STRIPE = "1";
  process.env.GROWTH_TEST_MOCK_AUDIT = "1";
  return url;
}

export function assertNoLiveStripeSecret(): void {
  const key =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    "";
  if (key.includes("sk_live_")) {
    throw new Error(
      "Refusing acceptance: LIVE Stripe secret (sk_live_) detected. Use TEST keys or mocks.",
    );
  }
}
