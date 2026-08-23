import "server-only";

import {
  computeSearchPriorityBand,
  isSearchEvidenceKind,
  isSearchIntent,
  isSearchOpportunitySource,
  isSearchOpportunityStatus,
  isSearchPageType,
  isSearchPriorityBand,
  isSearchTopic,
  type SearchEvidenceKind,
  type SearchIntent,
  type SearchOpportunitySource,
  type SearchOpportunityStatus,
  type SearchPageType,
  type SearchPriorityBand,
  type SearchTopic,
  type SeedSearchOpportunity,
} from "@/lib/growth/search-intelligence";
import { prisma } from "@/lib/prisma";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSearchOpportunitySlug(value: string): boolean {
  return value.length >= 3 && value.length <= 80 && SLUG_RE.test(value);
}

export type CreateSearchOpportunityInput = {
  slug: string;
  topic: SearchTopic;
  queryConcept: string;
  intent: SearchIntent;
  pageType: SearchPageType;
  source: SearchOpportunitySource;
  evidenceKind: SearchEvidenceKind;
  status?: SearchOpportunityStatus;
  currentPagePath?: string | null;
  recommendedPath?: string | null;
  locationContext?: string | null;
  notes?: string | null;
  commercialRelevance: 1 | 2 | 3;
  intentStrength: 1 | 2 | 3;
  contentGap: 1 | 2 | 3;
  auditFunnelRelevance: 1 | 2 | 3;
  gscEvidence: 0 | 1 | 2;
  effort: 1 | 2 | 3;
  createdByEmail: string;
};

export type UpdateSearchOpportunityInput = {
  id: string;
  status?: SearchOpportunityStatus;
  priorityBand?: SearchPriorityBand;
  notes?: string | null;
  currentPagePath?: string | null;
  recommendedPath?: string | null;
  locationContext?: string | null;
  updatedByEmail: string;
};

function optionalPath(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > 300) {
    throw new Error("Path too long (max 300)");
  }
  return trimmed;
}

export async function createSearchOpportunity(
  input: CreateSearchOpportunityInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isValidSearchOpportunitySlug(input.slug)) {
    return {
      ok: false,
      error: "Slug must be 3–80 lowercase kebab-case characters",
    };
  }
  if (!isSearchTopic(input.topic)) {
    return { ok: false, error: "Invalid topic" };
  }
  if (!isSearchIntent(input.intent)) {
    return { ok: false, error: "Invalid intent" };
  }
  if (!isSearchPageType(input.pageType)) {
    return { ok: false, error: "Invalid pageType" };
  }
  if (!isSearchOpportunitySource(input.source)) {
    return { ok: false, error: "Invalid source" };
  }
  if (!isSearchEvidenceKind(input.evidenceKind)) {
    return { ok: false, error: "Invalid evidenceKind" };
  }
  const status = input.status ?? "IDEA";
  if (!isSearchOpportunityStatus(status)) {
    return { ok: false, error: "Invalid status" };
  }
  const concept = input.queryConcept.trim();
  if (!concept || concept.length > 200) {
    return { ok: false, error: "queryConcept required (max 200)" };
  }

  const priority = computeSearchPriorityBand({
    commercialRelevance: input.commercialRelevance,
    intentStrength: input.intentStrength,
    contentGap: input.contentGap,
    auditFunnelRelevance: input.auditFunnelRelevance,
    gscEvidence: input.gscEvidence,
    effort: input.effort,
  });

  try {
    const row = await prisma.growthSearchOpportunity.create({
      data: {
        slug: input.slug,
        topic: input.topic,
        queryConcept: concept,
        intent: input.intent,
        pageType: input.pageType,
        source: input.source,
        evidenceKind: input.evidenceKind,
        status,
        priorityBand: priority.band,
        priorityScore: priority.score,
        currentPagePath: optionalPath(input.currentPagePath),
        recommendedPath: optionalPath(input.recommendedPath),
        locationContext: input.locationContext?.trim() || null,
        notes: input.notes?.trim() || null,
        createdByEmail: input.createdByEmail,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    if (message.includes("Unique constraint") || message.includes("slug")) {
      return { ok: false, error: "Slug already exists" };
    }
    return { ok: false, error: message };
  }
}

export async function updateSearchOpportunity(
  input: UpdateSearchOpportunityInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.status != null && !isSearchOpportunityStatus(input.status)) {
    return { ok: false, error: "Invalid status" };
  }
  if (
    input.priorityBand != null &&
    !isSearchPriorityBand(input.priorityBand)
  ) {
    return { ok: false, error: "Invalid priorityBand" };
  }

  try {
    await prisma.growthSearchOpportunity.update({
      where: { id: input.id },
      data: {
        ...(input.status != null ? { status: input.status } : {}),
        ...(input.priorityBand != null
          ? { priorityBand: input.priorityBand }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes?.trim() || null }
          : {}),
        ...(input.currentPagePath !== undefined
          ? { currentPagePath: optionalPath(input.currentPagePath) }
          : {}),
        ...(input.recommendedPath !== undefined
          ? { recommendedPath: optionalPath(input.recommendedPath) }
          : {}),
        ...(input.locationContext !== undefined
          ? { locationContext: input.locationContext?.trim() || null }
          : {}),
        updatedByEmail: input.updatedByEmail,
      },
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return { ok: false, error: message };
  }
}

export async function listSearchOpportunities(limit = 50) {
  return prisma.growthSearchOpportunity.findMany({
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    take: Math.min(limit, 100),
  });
}

export async function ensureSeedSearchOpportunities(
  seeds: SeedSearchOpportunity[],
  createdByEmail: string,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const seed of seeds) {
    const existing = await prisma.growthSearchOpportunity.findUnique({
      where: { slug: seed.slug },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    const result = await createSearchOpportunity({
      ...seed,
      status: "VALIDATED",
      createdByEmail,
    });
    if (result.ok) {
      created += 1;
    } else {
      skipped += 1;
    }
  }
  return { created, skipped };
}
