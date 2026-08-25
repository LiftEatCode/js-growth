import "server-only";

import {
  GBP_OBJECTIVE_CHECKLIST_KEYS,
  GBP_READ_INTEGRATION_VERSION,
  GBP_UNSUPPORTED_FOR_V1,
} from "@/lib/gbp/constants";
import { compareGbpProfileToFacts } from "@/lib/gbp/compare";
import {
  acquireGbpSyncLock,
  getActiveGbpConnection,
  getDecryptedRefreshToken,
  releaseGbpSyncLock,
} from "@/lib/gbp/connection-store";
import { getGbpProvider } from "@/lib/gbp/google-provider";
import { normalizeGbpLocation } from "@/lib/gbp/normalize";
import { refreshGbpAccessToken } from "@/lib/gbp/oauth";
import { upsertChecklistItem } from "@/lib/growth/local-growth-store";
import type { LocalChecklistStatus } from "@/lib/growth/local-growth";

function truncate(value: string | null | undefined, max = 300): string | null {
  if (!value) return null;
  return value.length <= max ? value : value.slice(0, max - 1) + "…";
}

export async function syncGbpProfile(input: {
  operatorEmail: string;
  websiteWithoutUtm?: boolean;
}): Promise<
  | {
      ok: true;
      profileTitle: string | null;
      mismatches: string[];
      itemsUpdated: number;
    }
  | { ok: false; error: string; code?: string }
> {
  const connection = await getActiveGbpConnection();
  if (!connection || connection.status === "DISCONNECTED") {
    return { ok: false, error: "GBP not connected", code: "NOT_CONNECTED" };
  }
  if (!connection.locationResourceName || !connection.googleLocationId) {
    return { ok: false, error: "Select a GBP location first", code: "NO_LOCATION" };
  }

  const lock = await acquireGbpSyncLock(connection.id, "PROFILE");
  if (!lock.ok) return lock;

  try {
    const refreshToken = getDecryptedRefreshToken(connection);
    if (!refreshToken) {
      await releaseGbpSyncLock(connection.id, {
        status: "AUTH_EXPIRED",
        error: "Missing refresh token",
      });
      return { ok: false, error: "Reconnect Google Business Profile", code: "AUTH_EXPIRED" };
    }

    let accessToken: string;
    try {
      const tokens = await refreshGbpAccessToken(refreshToken);
      accessToken = tokens.access_token;
    } catch (error) {
      const code =
        error instanceof Error &&
        (error as Error & { code?: string }).code === "AUTH_EXPIRED"
          ? "AUTH_EXPIRED"
          : "ERROR";
      await releaseGbpSyncLock(connection.id, {
        status: code === "AUTH_EXPIRED" ? "AUTH_EXPIRED" : "ERROR",
        error: "Token refresh failed",
      });
      return {
        ok: false,
        error: "Reconnect Google Business Profile",
        code,
      };
    }

    const provider = getGbpProvider({
      websiteWithoutUtm: input.websiteWithoutUtm,
    });
    const raw = await provider.getLocation(
      accessToken,
      connection.locationResourceName,
    );
    const reviews = await provider.getReviewAggregate(
      accessToken,
      connection.googleAccountId ?? "",
      connection.googleLocationId,
    );
    const profile = normalizeGbpLocation(raw, reviews);
    const comparisons = compareGbpProfileToFacts(profile);
    const comparisonByKey = new Map(comparisons.map((c) => [c.key, c]));

    let itemsUpdated = 0;

    const objectiveSet = new Set<string>(GBP_OBJECTIVE_CHECKLIST_KEYS);
    const unsupported = new Set<string>(GBP_UNSUPPORTED_FOR_V1);

    const observations: Array<{
      key: string;
      observedValue: string | null;
      observation: string;
      status: LocalChecklistStatus;
      factMatch: "MATCH" | "MISMATCH" | "NOT_CAPTURED" | "NOT_APPLICABLE";
    }> = [
      {
        key: "BUSINESS_NAME",
        observedValue: truncate(profile.title),
        observation: "Synced from Business Information API",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "PRIMARY_CATEGORY",
        observedValue: truncate(
          profile.primaryCategory?.displayName ??
            profile.primaryCategory?.name,
        ),
        observation: "API category — relevance still needs human review",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "ADDITIONAL_CATEGORIES",
        observedValue: truncate(
          profile.additionalCategories
            .map((c) => c.displayName ?? c.name)
            .filter(Boolean)
            .join(", ") || null,
        ),
        observation: "API additional categories — relevance review required",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "BUSINESS_DESCRIPTION",
        observedValue: truncate(profile.description),
        observation: "API description observed — quality remains NOT_REVIEWED",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "WEBSITE",
        observedValue: truncate(profile.websiteUri),
        observation: "Synced from Business Information API",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "WEBSITE_UTM",
        observedValue: truncate(profile.websiteUri),
        observation: "Canonical GBP UTM detection (read-only; no auto-write)",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "PHONE",
        observedValue: truncate(profile.primaryPhone),
        observation: "Synced from Business Information API",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "HOURS",
        observedValue: truncate(profile.regularHoursSummary),
        observation: "API hours summary — verify accuracy manually",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "SPECIAL_HOURS",
        observedValue: truncate(profile.specialHoursSummary),
        observation: "API special hours summary",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "ADDRESS_OR_SERVICE_AREA",
        observedValue: truncate(
          profile.serviceAreaSummary ??
            (profile.isServiceAreaBusiness
              ? "SERVICE_AREA_BUSINESS"
              : null),
        ),
        observation: profile.hasStorefrontAddress
          ? "API returned storefront address — service-area config: do not expose privately"
          : "API service-area / location configuration",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "SERVICES",
        observedValue: truncate(
          profile.serviceItems.length
            ? profile.serviceItems.join(", ")
            : null,
        ),
        observation: profile.serviceItems.length
          ? "API serviceItems observed — completeness review required"
          : "No serviceItems from API",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
      {
        key: "REVIEWS",
        observedValue:
          profile.reviewCount != null
            ? `count=${profile.reviewCount}; rating=${profile.averageRating ?? "NOT_CAPTURED"}`
            : null,
        observation: "Review aggregates only — no reviewer PII/text stored",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      },
    ];

    for (const key of unsupported) {
      observations.push({
        key,
        observedValue: null,
        observation: "API status: UNSUPPORTED_FOR_V1 — manual review if needed",
        status: "NOT_REVIEWED",
        factMatch: "NOT_CAPTURED",
      });
    }

    for (const item of observations) {
      const cmp = comparisonByKey.get(item.key);
      let status = item.status;
      let factMatch = item.factMatch;
      if (cmp) {
        factMatch = cmp.factMatch;
        if (objectiveSet.has(item.key)) {
          if (cmp.factMatch === "MATCH") status = "OK";
          else if (cmp.factMatch === "MISMATCH") status = "NEEDS_ATTENTION";
          else if (cmp.factMatch === "NOT_APPLICABLE") status = "NOT_APPLICABLE";
        }
      }
      const result = await upsertChecklistItem({
        itemKey: item.key,
        status,
        observation: item.observation,
        factMatch,
        observedValue: item.observedValue,
        observationSource: "API",
        reviewedByEmail: input.operatorEmail,
      });
      if (result.ok) itemsUpdated += 1;
    }

    const mismatches = comparisons
      .filter((c) => c.mismatchCode)
      .map((c) => c.mismatchCode!) ;

    await releaseGbpSyncLock(connection.id, {
      status: "SYNCED",
      profileSynced: true,
      summary: {
        gbpReadIntegrationVersion: GBP_READ_INTEGRATION_VERSION,
        operation: "PROFILE",
        itemsUpdated,
        mismatches,
        title: profile.title,
      },
    });

    return {
      ok: true,
      profileTitle: profile.title,
      mismatches,
      itemsUpdated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile sync failed";
    const code =
      error instanceof Error
        ? (error as Error & { code?: string }).code
        : undefined;
    await releaseGbpSyncLock(connection.id, {
      status: code === "AUTH_EXPIRED" ? "AUTH_EXPIRED" : "ERROR",
      error: message,
    });
    return { ok: false, error: message, code };
  }
}
