import type { PlanEvidenceItem } from "./types";

/**
 * Stable identity for deduplication.
 * Findings collapse to finding:{id} across AUDIT_FINDING / COMPETITIVE_FINDING.
 * Category gaps keep type so AUDIT_CATEGORY and COMPETITIVE_CATEGORY_GAP can coexist.
 */
export function evidenceIdentity(item: PlanEvidenceItem): string {
  if (item.findingId) {
    return `finding:${item.findingId}`;
  }
  return `${item.type}:${item.sourceKey}`;
}

/**
 * Prefer audit finding rows over competitive finding duplicates;
 * otherwise keep the first occurrence and enrich with competitive fields.
 */
export function dedupeEvidenceItems(
  items: PlanEvidenceItem[],
): PlanEvidenceItem[] {
  const byIdentity = new Map<string, PlanEvidenceItem>();

  for (const item of items) {
    const identity = evidenceIdentity(item);
    const existing = byIdentity.get(identity);

    if (!existing) {
      byIdentity.set(identity, item);
      continue;
    }

    // Prefer AUDIT_FINDING base; merge competitive gap metrics when useful
    if (
      existing.type === "COMPETITIVE_FINDING" &&
      item.type === "AUDIT_FINDING"
    ) {
      byIdentity.set(identity, {
        ...item,
        competitorsCompared:
          item.competitorsCompared ?? existing.competitorsCompared,
      });
      continue;
    }

    if (
      existing.type === "AUDIT_FINDING" &&
      item.type === "COMPETITIVE_FINDING"
    ) {
      byIdentity.set(identity, {
        ...existing,
        competitorsCompared:
          existing.competitorsCompared ?? item.competitorsCompared,
      });
      continue;
    }

    // Same identity + type: keep first
  }

  return Array.from(byIdentity.values());
}

/** Findings that may support a workstream but must not create it alone. */
export const WEAK_SUPPORTING_FINDING_IDS = new Set([
  "no-images",
]);

export function isWeakSupportingFinding(item: PlanEvidenceItem): boolean {
  return (
    item.findingId != null &&
    WEAK_SUPPORTING_FINDING_IDS.has(item.findingId.toLowerCase())
  );
}

/**
 * Evidence that can justify creating a workstream (not weak-only).
 */
export function isWorkstreamCreatingEvidence(item: PlanEvidenceItem): boolean {
  if (item.type === "COMPETITIVE_ADVANTAGE") {
    return false;
  }
  if (isWeakSupportingFinding(item)) {
    return false;
  }
  return true;
}
