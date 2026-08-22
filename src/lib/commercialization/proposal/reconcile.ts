import type { ProposalPricingInput, ProposalScopeInput } from "./build";
import {
  deliverablePresentationLabel,
  isKnownWorkUnitKey,
  resolveAuthoritativeWorkUnitKey,
  WORK_UNIT_INVESTMENT_INCLUDE_LABELS,
  WORK_UNIT_PRESENTATION_LABELS,
} from "./presentation";
import type {
  ProposalSnapshotInvestmentGroup,
  ProposalSnapshotInvestmentLine,
  ProposalSnapshotSection,
} from "./types";

export const PROPOSAL_FINANCIAL_RECONCILIATION_FAILED =
  "PROPOSAL_FINANCIAL_RECONCILIATION_FAILED";

export class ProposalFinancialReconciliationError extends Error {
  readonly code = PROPOSAL_FINANCIAL_RECONCILIATION_FAILED;

  constructor(
    readonly diagnostics: string[],
  ) {
    super(PROPOSAL_FINANCIAL_RECONCILIATION_FAILED);
    this.name = "ProposalFinancialReconciliationError";
  }
}

export interface InternalInvestmentLine extends ProposalSnapshotInvestmentLine {
  pricingLineId: string;
  workUnitKey: string | null;
  isCustom: boolean;
}

function collectAuthorizedScopeWorkUnitKeys(
  scope: ProposalScopeInput,
): Set<string> {
  const keys = new Set<string>();
  for (const section of scope.sections) {
    if (!section.isIncluded) {
      continue;
    }
    for (const deliverable of section.deliverables) {
      if (!deliverable.isIncluded) {
        continue;
      }
      const key = resolveAuthoritativeWorkUnitKey({
        sourceActionKey: deliverable.sourceActionKey ?? null,
        sourceTitle: deliverable.title,
        isCustom: deliverable.isCustom,
      });
      if (key) {
        keys.add(key);
      }
    }
  }
  return keys;
}

function collectApproachWorkUnitKeys(
  sections: ProposalSnapshotSection[],
  scope: ProposalScopeInput,
): Set<string> {
  const keys = new Set<string>();
  for (const section of scope.sections) {
    if (!section.isIncluded) {
      continue;
    }
    for (const deliverable of section.deliverables) {
      if (!deliverable.isIncluded) {
        continue;
      }
      const key = resolveAuthoritativeWorkUnitKey({
        sourceActionKey: deliverable.sourceActionKey ?? null,
        sourceTitle: deliverable.title,
        isCustom: deliverable.isCustom,
      });
      if (key) {
        keys.add(key);
      }
    }
  }
  return keys;
}

function expectedInvestmentLabel(workUnitKey: string): string {
  return WORK_UNIT_INVESTMENT_INCLUDE_LABELS[workUnitKey] ?? "";
}

function expectedPresentationLabel(workUnitKey: string): string {
  return WORK_UNIT_PRESENTATION_LABELS[workUnitKey] ?? "";
}

function labelLooksLikeWrongAction(options: {
  workUnitKey: string;
  includeLabel: string;
  title: string;
}): string | null {
  const include = options.includeLabel.toLowerCase();
  const title = options.title.toLowerCase();

  if (options.workUnitKey === "trust-signals" || options.workUnitKey === "cta-clarity") {
    if (include.includes("conversion path assessment") || title.includes("conversion path assessment")) {
      return `${options.workUnitKey} must not present as conversion assessment`;
    }
  }

  if (options.workUnitKey === "conversion-assessment") {
    if (!include.includes("assessment") && !title.includes("assessment")) {
      return "conversion-assessment must present as assessment";
    }
  }

  if (options.workUnitKey === "structured-data") {
    if (include.includes("localbusiness") || title.includes("localbusiness")) {
      return "structured-data must not present as LocalBusiness schema";
    }
  }

  if (options.workUnitKey === "local-schema") {
    if (!include.includes("localbusiness") && !title.includes("localbusiness")) {
      return "local-schema must present as LocalBusiness structured data";
    }
  }

  if (options.workUnitKey === "script-weight") {
    if (!include.includes("script") && !include.includes("third-party")) {
      return "script-weight must present as script/third-party reduction";
    }
  }

  return null;
}

/**
 * Verify proposal financial presentation reconciles to approved Scope + Pricing.
 * Throws ProposalFinancialReconciliationError when invariants fail.
 */
export function reconcileProposalFinancials(options: {
  scope: ProposalScopeInput;
  pricing: ProposalPricingInput;
  sections: ProposalSnapshotSection[];
  includedLines: InternalInvestmentLine[];
  optionalLines: InternalInvestmentLine[];
  includedInvestmentGroups: ProposalSnapshotInvestmentGroup[];
  optionalInvestmentGroups: ProposalSnapshotInvestmentGroup[];
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  engagementAdjustmentCents: number;
}): void {
  const diagnostics: string[] = [];
  const authorizedScopeKeys = collectAuthorizedScopeWorkUnitKeys(options.scope);
  const approachKeys = collectApproachWorkUnitKeys(options.sections, options.scope);

  const includedPricingLines = options.pricing.lineItems.filter(
    (line) => line.isIncluded && !line.isOptional,
  );
  const optionalPricingLines = options.pricing.lineItems.filter(
    (line) => line.isIncluded && line.isOptional,
  );

  // A. Every included priced line represented exactly once financially
  if (options.includedLines.length !== includedPricingLines.length) {
    diagnostics.push(
      `included line count mismatch: pricing=${includedPricingLines.length} proposal=${options.includedLines.length}`,
    );
  }

  const seenPricingIds = new Set<string>();
  for (const line of options.includedLines) {
    if (seenPricingIds.has(line.pricingLineId)) {
      diagnostics.push(`duplicate included pricing line ${line.pricingLineId}`);
    }
    seenPricingIds.add(line.pricingLineId);
  }

  for (const pricingLine of includedPricingLines) {
    if (!seenPricingIds.has(pricingLine.id)) {
      diagnostics.push(`missing included pricing line ${pricingLine.id}`);
    }
  }

  // B/C/D. Provenance + semantic identity
  const seenWorkUnitKeys = new Set<string>();
  for (const line of options.includedLines) {
    const pricingLine = includedPricingLines.find((l) => l.id === line.pricingLineId);
    if (!pricingLine) {
      continue;
    }

    const workUnitKey =
      line.workUnitKey ??
      (pricingLine.isCustom
        ? null
        : pricingLine.workUnitKey ?? null);

    if (!pricingLine.isCustom) {
      if (!workUnitKey) {
        diagnostics.push(
          `deterministic pricing line ${pricingLine.id} missing workUnitKey`,
        );
      } else if (!isKnownWorkUnitKey(workUnitKey)) {
        diagnostics.push(`unknown workUnitKey ${workUnitKey} on line ${pricingLine.id}`);
      } else {
        const expectedInclude = expectedInvestmentLabel(workUnitKey);
        const expectedTitle = expectedPresentationLabel(workUnitKey);
        if (expectedInclude && line.includeLabel !== expectedInclude) {
          diagnostics.push(
            `line ${pricingLine.id} includeLabel "${line.includeLabel}" != expected "${expectedInclude}" for ${workUnitKey}`,
          );
        }
        if (expectedTitle && line.title !== expectedTitle) {
          diagnostics.push(
            `line ${pricingLine.id} title "${line.title}" != expected "${expectedTitle}" for ${workUnitKey}`,
          );
        }

        const wrongAction = labelLooksLikeWrongAction({
          workUnitKey,
          includeLabel: line.includeLabel,
          title: line.title,
        });
        if (wrongAction) {
          diagnostics.push(`line ${pricingLine.id}: ${wrongAction}`);
        }

        if (!authorizedScopeKeys.has(workUnitKey)) {
          diagnostics.push(
            `line ${pricingLine.id} workUnitKey ${workUnitKey} not authorized by approved Scope`,
          );
        }

        if (seenWorkUnitKeys.has(workUnitKey)) {
          diagnostics.push(`duplicate financial work unit ${workUnitKey}`);
        }
        seenWorkUnitKeys.add(workUnitKey);
      }
    } else {
      const polished = deliverablePresentationLabel({
        sourceTitle: pricingLine.title,
        isCustom: true,
      });
      if (line.title !== polished) {
        diagnostics.push(
          `custom line ${pricingLine.id} title must preserve manual title`,
        );
      }
      if (line.includeLabel !== polished) {
        diagnostics.push(
          `custom line ${pricingLine.id} includeLabel must preserve manual title`,
        );
      }
    }
  }

  // H. No orphan deterministic financial work
  for (const pricingLine of includedPricingLines) {
    if (pricingLine.isCustom) {
      continue;
    }
    const key = pricingLine.workUnitKey;
    if (!key) {
      diagnostics.push(`orphan deterministic pricing line ${pricingLine.id} missing workUnitKey`);
      continue;
    }
    if (!seenWorkUnitKeys.has(key)) {
      diagnostics.push(`orphan deterministic financial work ${key}`);
    }
  }

  // E/F/G. Subtotal reconciliation
  const includedLineSum = options.includedLines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0,
  );
  if (
    includedLineSum + options.engagementAdjustmentCents !==
    options.includedInvestmentCents
  ) {
    diagnostics.push(
      `included total mismatch: lines=${includedLineSum} adjustment=${options.engagementAdjustmentCents} expected=${options.includedInvestmentCents}`,
    );
  }

  const optionalLineSum = options.optionalLines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0,
  );
  if (optionalLineSum !== options.optionalInvestmentCents) {
    diagnostics.push(
      `optional total mismatch: lines=${optionalLineSum} expected=${options.optionalInvestmentCents}`,
    );
  }

  const groupSum = options.includedInvestmentGroups.reduce(
    (sum, group) => sum + group.subtotalCents,
    0,
  );
  if (groupSum + options.engagementAdjustmentCents !== options.includedInvestmentCents) {
    diagnostics.push(
      `group subtotal mismatch: groups=${groupSum} adjustment=${options.engagementAdjustmentCents} expected=${options.includedInvestmentCents}`,
    );
  }

  // Approach ↔ Investment consistency: Investment cannot introduce known actions absent from Scope
  for (const line of options.includedLines) {
    if (!line.workUnitKey || line.isCustom) {
      continue;
    }
    if (!approachKeys.has(line.workUnitKey) && isKnownWorkUnitKey(line.workUnitKey)) {
      diagnostics.push(
        `investment introduces known action ${line.workUnitKey} absent from approved Scope deliverables`,
      );
    }
  }

  // Optional lines parity
  if (options.optionalLines.length !== optionalPricingLines.length) {
    diagnostics.push(
      `optional line count mismatch: pricing=${optionalPricingLines.length} proposal=${options.optionalLines.length}`,
    );
  }

  if (diagnostics.length > 0) {
    throw new ProposalFinancialReconciliationError(diagnostics);
  }
}

/** @internal test helper */
export function __testCollectAuthorizedScopeWorkUnitKeys(
  scope: ProposalScopeInput,
): Set<string> {
  return collectAuthorizedScopeWorkUnitKeys(scope);
}

/** @internal test helper */
export function __testLabelLooksLikeWrongAction(options: {
  workUnitKey: string;
  includeLabel: string;
  title: string;
}): string | null {
  return labelLooksLikeWrongAction(options);
}
