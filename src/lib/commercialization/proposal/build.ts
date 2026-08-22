import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { evaluatePricingCompleteness } from "@/lib/commercialization/pricing/completeness";
import { effectiveUnitPriceCents } from "@/lib/commercialization/pricing/totals";

import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { buildProposalSourceFingerprint } from "./fingerprint";
import type {
  BuiltCommercialProposal,
  ProposalSnapshot,
  ProposalSnapshotInvestmentGroup,
  ProposalSnapshotInvestmentLine,
  ProposalSnapshotSection,
} from "./types";

export interface ProposalScopeInput {
  id: string;
  revision: number;
  status: string;
  title: string;
  summary: string | null;
  assumptions: Array<{ text: string }>;
  exclusions: Array<{ text: string }>;
  considerations: Array<{ text: string; key?: string }>;
  sections: Array<{
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    isIncluded: boolean;
    isOptional: boolean;
    capabilities: ServiceCapabilityId[];
    deliverables: Array<{
      id: string;
      title: string;
      isIncluded: boolean;
      isOptional: boolean;
      sortOrder: number;
    }>;
  }>;
}

export interface ProposalPricingInput {
  id: string;
  revision: number;
  status: string;
  currency: string;
  commercialScopeId: string;
  finalIncludedCents: number;
  finalOptionalCents: number;
  finalTotalCents: number;
  minimumApplied: boolean;
  minimumEngagementCents: number;
  lineItems: Array<{
    id: string;
    title: string;
    quantity: number;
    recommendedUnitPriceCents: number | null;
    finalUnitPriceCents: number | null;
    finalLineTotalCents: number | null;
    isIncluded: boolean;
    isOptional: boolean;
    isCustom: boolean;
    isOverridden: boolean;
    effortBand: string;
    sortOrder: number;
    sourceSectionTitles: string[];
  }>;
}

function capabilityLabels(ids: ServiceCapabilityId[]): string[] {
  return ids.map((id) => getServiceCapabilityDisplayName(id));
}

function mapSections(
  sections: ProposalScopeInput["sections"],
  optionalOnly: boolean,
): ProposalSnapshotSection[] {
  return sections
    .filter(
      (s) =>
        s.isIncluded && (optionalOnly ? s.isOptional : !s.isOptional),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      title: section.title,
      description: section.description,
      capabilities: capabilityLabels(section.capabilities),
      isOptional: section.isOptional,
      deliverables: section.deliverables
        .filter((d) => d.isIncluded)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((d) => ({
          title: d.title,
          isOptional: d.isOptional || section.isOptional,
        })),
    }))
    .filter((s) => s.deliverables.length > 0 || s.description);
}

function dedupeConsiderations(
  items: ProposalScopeInput["considerations"],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = (item.key ?? item.text).trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    const text = item.text.trim();
    if (text) {
      out.push(text);
    }
  }
  return out;
}

/**
 * Pick a deterministic primary Scope section for a priced work unit.
 * Prefer earliest section in Scope order among sourceSectionTitles.
 */
function primaryGroupTitle(
  sourceSectionTitles: string[],
  sectionOrder: Map<string, number>,
  fallback: string,
): { groupTitle: string; alsoSupports: string[] } {
  if (sourceSectionTitles.length === 0) {
    return { groupTitle: fallback, alsoSupports: [] };
  }

  const sorted = [...sourceSectionTitles].sort((a, b) => {
    const ao = sectionOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bo = sectionOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) {
      return ao - bo;
    }
    return a.localeCompare(b);
  });

  const groupTitle = sorted[0]!;
  const alsoSupports = sorted.slice(1);
  return { groupTitle, alsoSupports };
}

function buildInvestmentLines(
  pricing: ProposalPricingInput,
  sectionOrder: Map<string, number>,
  optionalOnly: boolean,
): ProposalSnapshotInvestmentLine[] {
  return pricing.lineItems
    .filter(
      (l) =>
        l.isIncluded && (optionalOnly ? l.isOptional : !l.isOptional),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((line) => {
      const unit =
        effectiveUnitPriceCents(line) ??
        line.finalUnitPriceCents ??
        0;
      const lineTotal =
        line.finalLineTotalCents ?? unit * line.quantity;
      const { groupTitle, alsoSupports } = primaryGroupTitle(
        line.sourceSectionTitles,
        sectionOrder,
        "Implementation",
      );
      return {
        title: line.title,
        quantity: line.quantity,
        unitPriceCents: unit,
        lineTotalCents: lineTotal,
        isOptional: line.isOptional,
        groupTitle,
        alsoSupports,
      };
    });
}

function groupInvestmentLines(
  lines: ProposalSnapshotInvestmentLine[],
  sectionOrder: Map<string, number>,
): ProposalSnapshotInvestmentGroup[] {
  const byGroup = new Map<string, ProposalSnapshotInvestmentLine[]>();
  for (const line of lines) {
    const list = byGroup.get(line.groupTitle) ?? [];
    list.push(line);
    byGroup.set(line.groupTitle, list);
  }

  return Array.from(byGroup.entries())
    .sort(([a], [b]) => {
      const ao = sectionOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const bo = sectionOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) {
        return ao - bo;
      }
      return a.localeCompare(b);
    })
    .map(([title, groupLines]) => ({
      title,
      lines: groupLines,
      subtotalCents: groupLines.reduce((sum, l) => sum + l.lineTotalCents, 0),
    }));
}

function buildExecutiveSummary(
  businessName: string,
  sections: ProposalSnapshotSection[],
): string {
  const areas = sections.map((s) => s.title);
  const areaText =
    areas.length === 0
      ? "the highest-priority website growth opportunities identified"
      : areas.length === 1
        ? areas[0]
        : areas.length === 2
          ? `${areas[0]} and ${areas[1]}`
          : `${areas.slice(0, -1).join(", ")}, and ${areas[areas.length - 1]}`;

  return `Based on our website growth analysis and implementation planning, JS Solutions recommends a focused implementation engagement addressing the highest-priority opportunities identified for ${businessName}. This proposal is designed to strengthen ${areaText} in a practical, sequenced way that improves the website foundation for discovery, clarity, and conversion.`;
}

function buildBusinessContext(options: {
  businessName: string;
  locationLabel: string | null;
  scopeSummary: string | null;
  overallScore: number | null;
  competitivePosition: string | null;
}): string | null {
  const parts: string[] = [];
  if (options.locationLabel) {
    parts.push(
      `${options.businessName} (${options.locationLabel}) is the focus of this implementation proposal.`,
    );
  } else {
    parts.push(
      `${options.businessName} is the focus of this implementation proposal.`,
    );
  }
  if (options.overallScore != null && Number.isFinite(options.overallScore)) {
    parts.push(
      `Current Website Growth Score: ${Math.round(options.overallScore)}.`,
    );
  }
  if (options.competitivePosition?.trim()) {
    parts.push(
      `Competitive position (from available analysis): ${options.competitivePosition.trim()}.`,
    );
  }
  if (options.scopeSummary?.trim()) {
    parts.push(options.scopeSummary.trim());
  }
  return parts.join(" ");
}

/**
 * Pure deterministic builder: APPROVED Scope + APPROVED Pricing → Proposal snapshot.
 * Does not recalculate prices. Does not call external APIs.
 */
export function buildProposalFromApprovedSources(options: {
  opportunityId: string;
  businessName: string;
  locationLabel: string | null;
  overallScore?: number | null;
  competitivePosition?: string | null;
  scope: ProposalScopeInput;
  pricing: ProposalPricingInput;
}): BuiltCommercialProposal {
  if (options.scope.status !== "APPROVED") {
    throw new Error("Proposal requires APPROVED Scope.");
  }
  if (options.pricing.status !== "APPROVED") {
    throw new Error("Proposal requires APPROVED Pricing.");
  }
  if (options.pricing.commercialScopeId !== options.scope.id) {
    throw new Error("Pricing must correspond to the approved Scope.");
  }

  const completeness = evaluatePricingCompleteness(options.pricing.lineItems);
  if (!completeness.isComplete) {
    throw new Error("Proposal requires COMPLETE Pricing.");
  }

  const sectionOrder = new Map<string, number>();
  for (const section of options.scope.sections) {
    sectionOrder.set(section.title, section.sortOrder);
  }

  const sections = mapSections(options.scope.sections, false);
  const optionalSections = mapSections(options.scope.sections, true);

  const includedLines = buildInvestmentLines(
    options.pricing,
    sectionOrder,
    false,
  );
  const optionalLines = buildInvestmentLines(
    options.pricing,
    sectionOrder,
    true,
  );

  const includedSum = includedLines.reduce(
    (sum, l) => sum + l.lineTotalCents,
    0,
  );
  const optionalSum = optionalLines.reduce(
    (sum, l) => sum + l.lineTotalCents,
    0,
  );

  // Approved Pricing authority: totals come from persisted pricing, not catalog.
  // Pricing.finalTotalCents is the base engagement (includes minimum when applied).
  // Optional dollars stay separate and are never folded into base investment.
  const includedInvestmentCents = options.pricing.finalTotalCents;
  const optionalInvestmentCents = options.pricing.finalOptionalCents;
  const totalInvestmentCents =
    includedInvestmentCents + optionalInvestmentCents;
  const engagementAdjustmentCents = Math.max(
    0,
    includedInvestmentCents - includedSum,
  );

  if (includedSum + engagementAdjustmentCents !== includedInvestmentCents) {
    throw new Error(
      "Client-visible investment lines do not reconcile to approved Pricing total.",
    );
  }

  if (optionalSum !== optionalInvestmentCents) {
    throw new Error(
      "Client-visible optional lines do not reconcile to approved optional Pricing.",
    );
  }

  const snapshot: ProposalSnapshot = {
    businessName: options.businessName,
    locationLabel: options.locationLabel,
    currency: options.pricing.currency,
    includedInvestmentCents,
    optionalInvestmentCents,
    totalInvestmentCents,
    engagementAdjustmentCents,
    sections,
    optionalSections,
    assumptions: options.scope.assumptions
      .map((a) => a.text.trim())
      .filter(Boolean),
    exclusions: options.scope.exclusions
      .map((e) => e.text.trim())
      .filter(Boolean),
    considerations: dedupeConsiderations(options.scope.considerations),
    includedInvestmentGroups: groupInvestmentLines(includedLines, sectionOrder),
    optionalInvestmentGroups: groupInvestmentLines(optionalLines, sectionOrder),
    includedLines,
    optionalLines,
  };

  const fingerprint = buildProposalSourceFingerprint({
    opportunityId: options.opportunityId,
    commercialScopeId: options.scope.id,
    scopeRevision: options.scope.revision,
    commercialPricingId: options.pricing.id,
    pricingRevision: options.pricing.revision,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  });

  return {
    commercialScopeId: options.scope.id,
    commercialPricingId: options.pricing.id,
    title: `${options.businessName} — Website Growth Implementation Proposal`,
    executiveSummary: buildExecutiveSummary(options.businessName, sections),
    businessContext: buildBusinessContext({
      businessName: options.businessName,
      locationLabel: options.locationLabel,
      scopeSummary: options.scope.summary,
      overallScore: options.overallScore ?? null,
      competitivePosition: options.competitivePosition ?? null,
    }),
    approachIntro:
      "The recommended approach below reflects the approved implementation scope for this engagement.",
    timelineNote:
      "Implementation sequencing will be finalized after project kickoff.",
    nextStepText:
      "Review this proposed implementation scope with JS Solutions. Once scope and investment are confirmed, project scheduling and formal agreement can be prepared.",
    currency: options.pricing.currency,
    includedInvestmentCents,
    optionalInvestmentCents,
    totalInvestmentCents,
    snapshot,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    sourceFingerprint: fingerprint,
  };
}

/** Verify client-visible priced lines sum to approved included (pre-minimum) line totals. */
export function sumClientVisibleInvestmentCents(
  lines: ProposalSnapshotInvestmentLine[],
): number {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}
