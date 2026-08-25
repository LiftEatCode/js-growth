import "server-only";

import { GBP_READ_INTEGRATION_VERSION } from "@/lib/gbp/constants";
import {
  acquireGbpSyncLock,
  getActiveGbpConnection,
  getDecryptedRefreshToken,
  releaseGbpSyncLock,
} from "@/lib/gbp/connection-store";
import { getGbpProvider } from "@/lib/gbp/google-provider";
import {
  defaultWeeklyPerformanceWindow,
  normalizePerformanceWindow,
} from "@/lib/gbp/normalize";
import { refreshGbpAccessToken } from "@/lib/gbp/oauth";
import { createGbpSnapshot } from "@/lib/growth/local-growth-store";
import type { GbpSnapshotMetrics } from "@/lib/growth/snapshot";
import { prisma } from "@/lib/prisma";

function toDateStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
function toDateEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

/**
 * Sync GBP performance into GrowthSnapshot with provenance API.
 * Idempotent for same location + completed window.
 */
export async function syncGbpPerformance(input: {
  operatorEmail: string;
  periodStart?: string;
  periodEnd?: string;
  zeroMetrics?: boolean;
  missingWebsiteClicks?: boolean;
}): Promise<
  | { ok: true; snapshotId: string; deduplicated: boolean }
  | { ok: false; error: string; code?: string }
> {
  const connection = await getActiveGbpConnection();
  if (!connection || connection.status === "DISCONNECTED") {
    return { ok: false, error: "GBP not connected", code: "NOT_CONNECTED" };
  }
  if (!connection.googleLocationId) {
    return { ok: false, error: "Select a GBP location first", code: "NO_LOCATION" };
  }

  const window =
    input.periodStart && input.periodEnd
      ? { periodStart: input.periodStart, periodEnd: input.periodEnd }
      : defaultWeeklyPerformanceWindow();

  const windowKey = `api:${connection.googleLocationId}:${window.periodStart}_${window.periodEnd}`;

  // Idempotency: reuse existing API snapshot for same window key
  const existing = await prisma.growthSnapshot.findMany({
    where: {
      source: "GOOGLE_BUSINESS_PROFILE",
      periodStart: toDateStart(window.periodStart),
      periodEnd: toDateEnd(window.periodEnd),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const prior = existing.find((row) => {
    const m = row.metricsJson as Record<string, unknown>;
    return m.provenance === "API" && m.apiWindowKey === windowKey;
  });
  if (prior) {
    return { ok: true, snapshotId: prior.id, deduplicated: true };
  }

  const lock = await acquireGbpSyncLock(connection.id, "PERFORMANCE");
  if (!lock.ok) return lock;

  try {
    const refreshToken = getDecryptedRefreshToken(connection);
    if (!refreshToken) {
      await releaseGbpSyncLock(connection.id, {
        status: "AUTH_EXPIRED",
        error: "Missing refresh token",
      });
      return {
        ok: false,
        error: "Reconnect Google Business Profile",
        code: "AUTH_EXPIRED",
      };
    }

    const tokens = await refreshGbpAccessToken(refreshToken);
    const provider = getGbpProvider({
      zeroMetrics: input.zeroMetrics,
      missingWebsiteClicks: input.missingWebsiteClicks,
    });
    const raw = await provider.fetchPerformance(
      tokens.access_token,
      connection.googleLocationId,
      window.periodStart,
      window.periodEnd,
    );
    const normalized = normalizePerformanceWindow({
      ...window,
      points: raw.points,
      keywords: raw.keywords,
    });

    const metrics: GbpSnapshotMetrics = {
      provenance: "API",
      localGrowthVersion: 1,
      profileViews: normalized.profileViews ?? undefined,
      searchViews: normalized.searchViews ?? undefined,
      mapsViews: normalized.mapsViews ?? undefined,
      websiteClicks: normalized.websiteClicks ?? undefined,
      callClicks: normalized.callClicks ?? undefined,
      directionRequests: normalized.directionRequests ?? undefined,
      messages: normalized.messages ?? undefined,
      bookings: normalized.bookings ?? undefined,
      notes: `API sync window ${window.periodStart}→${window.periodEnd}; keywords=${normalized.topSearchKeywords.length}`,
    };

    // Re-check after lock (race)
    const again = await prisma.growthSnapshot.findMany({
      where: {
        source: "GOOGLE_BUSINESS_PROFILE",
        periodStart: toDateStart(window.periodStart),
        periodEnd: toDateEnd(window.periodEnd),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const raced = again.find((row) => {
      const m = row.metricsJson as Record<string, unknown>;
      return m.provenance === "API" && m.apiWindowKey === windowKey;
    });
    if (raced) {
      await releaseGbpSyncLock(connection.id, {
        status: "SYNCED",
        performanceSynced: true,
        summary: {
          gbpReadIntegrationVersion: GBP_READ_INTEGRATION_VERSION,
          operation: "PERFORMANCE",
          deduplicated: true,
          snapshotId: raced.id,
        },
      });
      return { ok: true, snapshotId: raced.id, deduplicated: true };
    }

    const cleaned = Object.fromEntries(
      Object.entries({
        ...metrics,
        apiWindowKey: windowKey,
        locationResourceName: connection.locationResourceName,
      }).filter(([, v]) => v !== undefined),
    ) as GbpSnapshotMetrics & {
      apiWindowKey: string;
      locationResourceName?: string | null;
    };

    // Bypass rapid-submit period guard for intentional API sync by using unique idempotency
    const result = await createGbpSnapshot({
      periodStart: toDateStart(window.periodStart),
      periodEnd: toDateEnd(window.periodEnd),
      metrics: cleaned,
      createdByEmail: input.operatorEmail,
      idempotencyKey: windowKey,
    });

    if (!result.ok) {
      await releaseGbpSyncLock(connection.id, {
        status: "ERROR",
        error: result.error,
      });
      return result;
    }

    await releaseGbpSyncLock(connection.id, {
      status: "SYNCED",
      performanceSynced: true,
      summary: {
        gbpReadIntegrationVersion: GBP_READ_INTEGRATION_VERSION,
        operation: "PERFORMANCE",
        snapshotId: result.id,
        deduplicated: result.deduplicated,
        window,
      },
    });

    return {
      ok: true,
      snapshotId: result.id,
      deduplicated: result.deduplicated,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Performance sync failed";
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
