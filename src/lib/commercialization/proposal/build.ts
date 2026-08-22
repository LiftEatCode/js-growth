import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { evaluatePricingCompleteness } from "@/lib/commercialization/pricing/completeness";
import { effectiveUnitPriceCents } from "@/lib/commercialization/pricing/totals";

import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { buildProposalSourceFingerprint } from "./fingerprint";
import {
  DEFAULT_APPROACH_INTRO,
  DEFAULT_NEXT_STEP_TEXT,
  DEFAULT_TIMELINE_NOTE,
  deliverablePresentationLabel,
  financialGroupSortOrder,
  getSectionClientValueExplanation,
  getSectionContextLabel,
  investmentIncludeLabelForLine,
  isInternalAuditFindingLanguage,
  joinReadableList,
  polishConsiderationText,
  PROPOSAL_INVESTMENT_INTRO,
  PROPOSAL_METHODOLOGY_FOOTER,
  resolveAuthoritativeWorkUnitKey,
  resolveFinancialGroup,
  sectionLooksLikeAssessment,
} from "./presentation";
import {
  reconcileProposalFinancials,
  type InternalInvestmentLine,
} from "./reconcile";
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
      sourceActionKey?: string | null;
      isCustom?: boolean;
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
    workUnitKey?: string | null;
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
    .map((section) => {
      const deliverableMeta = section.deliverables
        .filter((d) => d.isIncluded)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((d) => ({
          sourceTitle: d.title,
          isOptional: d.isOptional || section.isOptional,
          workUnitKey: resolveAuthoritativeWorkUnitKey({
            sourceActionKey: d.sourceActionKey ?? null,
            sourceTitle: d.title,
            isCustom: d.isCustom,
          }),
          title: deliverablePresentationLabel({
            sourceActionKey: d.sourceActionKey ?? null,
            sourceTitle: d.title,
            isCustom: d.isCustom,
          }),
        }));

      const assessmentSection = sectionLooksLikeAssessment(
        deliverableMeta.map((d) => d.sourceTitle),
        deliverableMeta.map((d) => d.workUnitKey),
      );

      return {
        title: section.title,
        clientValueExplanation: getSectionClientValueExplanation(
          section.title,
          { assessmentSection },
        ),
        capabilities: capabilityLabels(section.capabilities),
        isOptional: section.isOptional,
        deliverables: deliverableMeta.map(({ title, sourceTitle, isOptional }) => ({
          title,
          sourceTitle,
          isOptional,
        })),
      };
    })
    .filter((s) => s.deliverables.length > 0 || s.clientValueExplanation);
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
    const polished = polishConsiderationText(item.text);
    if (polished && !isInternalAuditFindingLanguage(polished)) {
      out.push(polished);
    }
  }
  return out;
}

function resolveLineWorkUnitKey(
  line: ProposalPricingInput["lineItems"][number],
): string | null {
  if (line.isCustom) {
    return null;
  }
  if (line.workUnitKey) {
    return line.workUnitKey;
  }
  return null;
}

function buildInvestmentLines(
  pricing: ProposalPricingInput,
  optionalOnly: boolean,
): InternalInvestmentLine[] {
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
      const workUnitKey = resolveLineWorkUnitKey(line);
      const financial = resolveFinancialGroup({
        sourceSectionTitles: line.sourceSectionTitles,
        workUnitKey,
        isCustom: line.isCustom,
      });
      const provenance = {
        workUnitKey,
        sourceTitle: line.title,
        isCustom: line.isCustom,
      };
      const polished = deliverablePresentationLabel(provenance);
      const primaryScope = line.sourceSectionTitles[0] ?? null;
      const alsoSupports = line.sourceSectionTitles.filter(
        (t) => t !== primaryScope && t !== financial.title,
      );
      return {
        pricingLineId: line.id,
        workUnitKey,
        isCustom: line.isCustom,
        title: polished,
        includeLabel: investmentIncludeLabelForLine(provenance),
        quantity: line.quantity,
        unitPriceCents: unit,
        lineTotalCents: lineTotal,
        isOptional: line.isOptional,
        groupTitle: financial.title,
        alsoSupports,
      };
    });
}

function toPublicInvestmentLine(
  line: InternalInvestmentLine,
): ProposalSnapshotInvestmentLine {
  return {
    title: line.title,
    includeLabel: line.includeLabel,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
    isOptional: line.isOptional,
    groupTitle: line.groupTitle,
    alsoSupports: line.alsoSupports,
  };
}

function groupInvestmentLines(
  lines: InternalInvestmentLine[],
): ProposalSnapshotInvestmentGroup[] {
  const byGroup = new Map<string, InternalInvestmentLine[]>();
  for (const line of lines) {
    const list = byGroup.get(line.groupTitle) ?? [];
    list.push(line);
    byGroup.set(line.groupTitle, list);
  }

  return Array.from(byGroup.entries())
    .sort(([a], [b]) => {
      const ao = financialGroupSortOrder(a);
      const bo = financialGroupSortOrder(b);
      if (ao !== bo) {
        return ao - bo;
      }
      return a.localeCompare(b);
    })
    .map(([title, groupLines]) => {
      const includeLabels: string[] = [];
      const seen = new Set<string>();
      for (const line of groupLines) {
        const label = line.includeLabel;
        const key = label.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        includeLabels.push(label);
      }
      return {
        title,
        includeLabels,
        lines: groupLines.map(toPublicInvestmentLine),
        subtotalCents: groupLines.reduce(
          (sum, l) => sum + l.lineTotalCents,
          0,
        ),
      };
    });
}

function buildExecutiveSummary(
  businessName: string,
  sections: ProposalSnapshotSection[],
): string {
  const focusAreas = sections.map((s) => getSectionContextLabel(s.title));
  const focusText = joinReadableList(focusAreas);

  return [
    `JS Solutions recommends a focused website improvement engagement for ${businessName} based on the issues identified during our Website Growth Analysis.`,
    `The work concentrates on strengthening the site's ${focusText}.`,
    `Together, these improvements are designed to create a clearer, more search-friendly website foundation and make it easier for potential customers to understand the business and take the next step.`,
  ].join("\n\n");
}

function buildBusinessContext(options: {
  businessName: string;
  locationLabel: string | null;
  overallScore: number | null;
  competitivePosition: string | null;
  sections: ProposalSnapshotSection[];
}): string | null {
  const who = options.locationLabel
    ? `${options.businessName}'s website`
    : `${options.businessName}'s website`;

  const areaLabels = options.sections.map((s) =>
    getSectionContextLabel(s.title),
  );
  const areaText = joinReadableList(areaLabels);

  const paragraphs: string[] = [];

  paragraphs.push(
    `Our analysis identified several opportunities to strengthen how ${who} communicates its services, supports local search visibility, and guides potential customers toward taking the next step.`,
  );

  if (options.overallScore != null && Number.isFinite(options.overallScore)) {
    paragraphs.push(
      `The website currently has a Website Growth Score of ${Math.round(options.overallScore)}/100, with the largest opportunities concentrated in ${areaText}.`,
    );
  } else if (areaLabels.length > 0) {
    paragraphs.push(
      `The largest opportunities are concentrated in ${areaText}.`,
    );
  }

  if (options.competitivePosition?.trim()) {
    paragraphs.push(
      `Available competitive analysis places the business in a ${options.competitivePosition.trim()} position relative to compared local competitors.`,
    );
  }

  return paragraphs.join("\n\n");
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

  const sections = mapSections(options.scope.sections, false);
  const optionalSections = mapSections(options.scope.sections, true);

  const includedLines = buildInvestmentLines(options.pricing, false);
  const optionalLines = buildInvestmentLines(options.pricing, true);

  const includedSum = includedLines.reduce(
    (sum, l) => sum + l.lineTotalCents,
    0,
  );

  const includedInvestmentCents = options.pricing.finalTotalCents;
  const optionalInvestmentCents = options.pricing.finalOptionalCents;
  const totalInvestmentCents =
    includedInvestmentCents + optionalInvestmentCents;
  const engagementAdjustmentCents = Math.max(
    0,
    includedInvestmentCents - includedSum,
  );

  const includedInvestmentGroups = groupInvestmentLines(includedLines);
  const optionalInvestmentGroups = groupInvestmentLines(optionalLines);

  reconcileProposalFinancials({
    scope: options.scope,
    pricing: options.pricing,
    sections,
    includedLines,
    optionalLines,
    includedInvestmentGroups,
    optionalInvestmentGroups,
    includedInvestmentCents,
    optionalInvestmentCents,
    engagementAdjustmentCents,
  });

  const snapshot: ProposalSnapshot = {
    businessName: options.businessName,
    locationLabel: options.locationLabel,
    currency: options.pricing.currency,
    includedInvestmentCents,
    optionalInvestmentCents,
    totalInvestmentCents,
    engagementAdjustmentCents,
    investmentIntro: PROPOSAL_INVESTMENT_INTRO,
    methodologyFooter: PROPOSAL_METHODOLOGY_FOOTER,
    sections,
    optionalSections,
    assumptions: options.scope.assumptions
      .map((a) => a.text.trim())
      .filter((t) => t && !isInternalAuditFindingLanguage(t)),
    exclusions: options.scope.exclusions
      .map((e) => e.text.trim())
      .filter((t) => t && !isInternalAuditFindingLanguage(t)),
    considerations: dedupeConsiderations(options.scope.considerations),
    includedInvestmentGroups,
    optionalInvestmentGroups,
    includedLines: includedLines.map(toPublicInvestmentLine),
    optionalLines: optionalLines.map(toPublicInvestmentLine),
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
      overallScore: options.overallScore ?? null,
      competitivePosition: options.competitivePosition ?? null,
      sections,
    }),
    approachIntro: DEFAULT_APPROACH_INTRO,
    timelineNote: DEFAULT_TIMELINE_NOTE,
    nextStepText: DEFAULT_NEXT_STEP_TEXT,
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

/** Verify client-visible priced lines sum to approved included line totals. */
export function sumClientVisibleInvestmentCents(
  lines: ProposalSnapshotInvestmentLine[],
): number {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}

export function sumClientVisibleGroupCents(
  groups: ProposalSnapshotInvestmentGroup[],
): number {
  return groups.reduce((sum, group) => sum + group.subtotalCents, 0);
}
