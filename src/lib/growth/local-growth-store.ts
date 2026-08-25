import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import {
  LOCAL_CHECKLIST_ITEMS,
  LOCAL_GROWTH_VERSION,
  isLocalChecklistItemKey,
  isLocalChecklistStatus,
  isLocalFactMatch,
  type LocalChecklistItemKey,
  type LocalChecklistStatus,
  type LocalFactMatch,
} from "@/lib/growth/local-growth";
import {
  validateGrowthSnapshotMetrics,
  type GbpSnapshotMetrics,
} from "@/lib/growth/snapshot";
import { prisma } from "@/lib/prisma";

const DUPLICATE_WINDOW_MS = 120_000;

export type CreateGbpSnapshotInput = {
  periodStart: Date;
  periodEnd: Date;
  metrics: GbpSnapshotMetrics;
  createdByEmail: string;
  /** Client pending lock / rapid-submit protection. */
  idempotencyKey?: string | null;
};

export async function listGbpSnapshots(limit = 40) {
  try {
    return await prisma.growthSnapshot.findMany({
      where: { source: "GOOGLE_BUSINESS_PROFILE" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    // Enum / table may be missing until Sprint 12 migration is applied.
    return [];
  }
}

export async function getLatestGbpSnapshot() {
  try {
    return await prisma.growthSnapshot.findFirst({
      where: { source: "GOOGLE_BUSINESS_PROFILE" },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return null;
  }
}

/**
 * Create a GBP snapshot. Blank optional metrics stay omitted (NOT_CAPTURED).
 * Rapid duplicate submits within DUPLICATE_WINDOW_MS with the same period +
 * idempotency key return the existing row. Intentional corrections use
 * correctsSnapshotId on a new append-only row — never silent overwrite.
 */
export async function createGbpSnapshot(
  input: CreateGbpSnapshotInput,
): Promise<
  | { ok: true; id: string; deduplicated: boolean }
  | { ok: false; error: string }
> {
  if (input.periodEnd.getTime() <= input.periodStart.getTime()) {
    return { ok: false, error: "periodEnd must be after periodStart" };
  }

  const metricsPayload: Record<string, unknown> = {
    ...input.metrics,
    localGrowthVersion: LOCAL_GROWTH_VERSION,
    provenance: input.metrics.provenance ?? "MANUAL",
  };

  const validated = validateGrowthSnapshotMetrics(
    "GOOGLE_BUSINESS_PROFILE",
    metricsPayload,
  );
  if (!validated.ok) {
    return validated;
  }

  const idempotencyKey = input.idempotencyKey?.trim()
    ? input.idempotencyKey.trim().slice(0, 120)
    : null;

  if (idempotencyKey) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const recent = await prisma.growthSnapshot.findMany({
      where: {
        source: "GOOGLE_BUSINESS_PROFILE",
        createdAt: { gte: since },
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        createdByEmail: input.createdByEmail,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const match = recent.find((row) => {
      const m = row.metricsJson as Record<string, unknown> | null;
      return m && m.idempotencyKey === idempotencyKey;
    });
    if (match) {
      return { ok: true, id: match.id, deduplicated: true };
    }
  }

  // Always guard rapid same-window submits (even when client rotated idempotencyKey).
  // Intentional corrections set correctsSnapshotId and are allowed through.
  if (!input.metrics.correctsSnapshotId) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const rapid = await prisma.growthSnapshot.findFirst({
      where: {
        source: "GOOGLE_BUSINESS_PROFILE",
        createdAt: { gte: since },
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        createdByEmail: input.createdByEmail,
      },
      orderBy: { createdAt: "desc" },
    });
    if (rapid) {
      return { ok: true, id: rapid.id, deduplicated: true };
    }
  }

  try {
    const created = await prisma.growthSnapshot.create({
      data: {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        source: "GOOGLE_BUSINESS_PROFILE",
        metricsJson: {
          ...validated.metrics,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        } as Prisma.InputJsonValue,
        createdByEmail: input.createdByEmail,
      },
    });

    return { ok: true, id: created.id, deduplicated: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/GOOGLE_BUSINESS_PROFILE|LocalGbpProfileChecklist/i.test(message)) {
      return {
        ok: false,
        error:
          "Sprint 12 migration not applied. Run: npx prisma migrate deploy",
      };
    }
    return { ok: false, error: message };
  }
}

export async function listChecklistItems() {
  try {
    return await prisma.localGbpProfileChecklistItem.findMany({
      orderBy: { itemKey: "asc" },
    });
  } catch {
    return [];
  }
}

export async function upsertChecklistItem(input: {
  itemKey: string;
  status: string;
  observation?: string | null;
  factMatch?: string | null;
  observedValue?: string | null;
  observationSource?: "API" | "MANUAL" | null;
  reviewedByEmail: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isLocalChecklistItemKey(input.itemKey)) {
    return { ok: false, error: "Unknown checklist itemKey" };
  }
  if (!isLocalChecklistStatus(input.status)) {
    return { ok: false, error: "Invalid checklist status" };
  }
  const factMatch: LocalFactMatch =
    input.factMatch && isLocalFactMatch(input.factMatch)
      ? input.factMatch
      : "NOT_CAPTURED";

  const observation = input.observation?.trim()
    ? input.observation.trim().slice(0, 1000)
    : null;
  const observedValue = input.observedValue?.trim()
    ? input.observedValue.trim().slice(0, 300)
    : null;
  const observationSource =
    input.observationSource === "API" || input.observationSource === "MANUAL"
      ? input.observationSource
      : undefined;

  const row = await prisma.localGbpProfileChecklistItem.upsert({
    where: { itemKey: input.itemKey },
    create: {
      itemKey: input.itemKey,
      status: input.status as LocalChecklistStatus,
      observation,
      factMatch,
      observedValue,
      ...(observationSource ? { observationSource } : {}),
      reviewedByEmail: input.reviewedByEmail,
      reviewedAt: new Date(),
    },
    update: {
      status: input.status as LocalChecklistStatus,
      observation,
      factMatch,
      observedValue,
      ...(observationSource ? { observationSource } : {}),
      reviewedByEmail: input.reviewedByEmail,
      reviewedAt: new Date(),
    },
  });

  return { ok: true, id: row.id };
}

export function checklistDefaults(): Array<{
  key: LocalChecklistItemKey;
  section: string;
  status: LocalChecklistStatus;
  factMatch: LocalFactMatch;
}> {
  return LOCAL_CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    section: item.section,
    status: "NOT_REVIEWED" as const,
    factMatch: "NOT_CAPTURED" as const,
  }));
}

/**
 * Parse optional int from form: blank → undefined (NOT_CAPTURED); "0" → 0.
 * Never coerce blank to zero.
 */
export function parseOptionalMetricInt(
  raw: FormDataEntryValue | null,
): number | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return undefined;
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("Metric must be a blank or non-negative integer");
  }
  return n;
}

export function parseOptionalMetricFloat(
  raw: FormDataEntryValue | null,
): number | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return undefined;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 5) {
    throw new Error("averageRating must be blank or 0–5");
  }
  return n;
}
