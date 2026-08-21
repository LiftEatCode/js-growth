import { randomUUID } from "node:crypto";

import { getServiceCapability } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import {
  WORKSTREAM_TITLES,
  type WorkstreamType,
} from "@/lib/commercialization/implementation-plan/constants";
import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import type { PreservationConstraint } from "@/lib/commercialization/implementation-plan/types";

import {
  COMMERCIAL_SCOPE_MAPPING_VERSION,
  COMMERCIAL_SCOPE_VERSION,
  MAX_DELIVERABLES_PER_SECTION,
  MAX_SECTIONS,
} from "./constants";
import { buildScopeSourceFingerprint } from "./fingerprint";
import {
  classifyDeliverableType,
  isEvidenceOnlyPlanAction,
} from "./map-actions";
import type {
  BuiltCommercialScope,
  BuiltScopeSection,
  ScopeConsideration,
  ScopeConsiderationMaintenanceAction,
} from "./types";

const CAPABILITY_ORDER: ServiceCapabilityId[] = [
  "WEBSITE_DEVELOPMENT",
  "SEO",
  "LOCAL_SEO",
  "CONTENT",
  "CONVERSION_OPTIMIZATION",
  "AI_AUTOMATION",
  "MARKETING_AUTOMATION",
  "CUSTOM_SOFTWARE",
];

function inheritActiveCapabilitiesExact(
  capabilities: ServiceCapabilityId[],
): ServiceCapabilityId[] {
  const inherited = new Set<ServiceCapabilityId>();
  for (const id of capabilities) {
    if (getServiceCapability(id)?.active === true) {
      inherited.add(id);
    }
  }
  return CAPABILITY_ORDER.filter((id) => inherited.has(id));
}

function polishedWorkstreamTitle(
  workstreamType: string,
  fallbackTitle: string,
): string {
  if (workstreamType in WORKSTREAM_TITLES) {
    return WORKSTREAM_TITLES[workstreamType as WorkstreamType];
  }
  return fallbackTitle;
}

function considerationKey(constraint: PreservationConstraint): string {
  return `preserve:${constraint.category}`;
}

function dedupeConsiderations(
  items: Array<{
    key: string;
    text: string;
    category: string | null;
    workstreamId: string;
    maintenanceActions: ScopeConsiderationMaintenanceAction[];
  }>,
): ScopeConsideration[] {
  const byKey = new Map<
    string,
    {
      key: string;
      text: string;
      category: string | null;
      sourceWorkstreamIds: Set<string>;
      maintenanceById: Map<string, ScopeConsiderationMaintenanceAction>;
    }
  >();

  for (const item of items) {
    const existing = byKey.get(item.key);
    if (!existing) {
      byKey.set(item.key, {
        key: item.key,
        text: item.text,
        category: item.category,
        sourceWorkstreamIds: new Set([item.workstreamId]),
        maintenanceById: new Map(
          item.maintenanceActions.map((action) => [action.id, action]),
        ),
      });
      continue;
    }

    existing.sourceWorkstreamIds.add(item.workstreamId);
    for (const action of item.maintenanceActions) {
      if (!existing.maintenanceById.has(action.id)) {
        existing.maintenanceById.set(action.id, action);
      }
    }
  }

  return Array.from(byKey.values()).map((row, index) => ({
    id: randomUUID(),
    key: row.key,
    text: row.text,
    category: row.category,
    sortOrder: index,
    sourceWorkstreamIds: Array.from(row.sourceWorkstreamIds).sort(),
    maintenanceActions: Array.from(row.maintenanceById.values()).sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
  }));
}

/**
 * Pure deterministic builder: Implementation Plan recommendation → draft Scope shape.
 * Does not persist. Does not call external LLM APIs.
 */
export function buildScopeFromPlan(options: {
  opportunityId: string;
  businessName: string;
  plan: LoadedImplementationPlan | null;
  interpretationId?: string | null;
}): BuiltCommercialScope {
  const plan = options.plan;
  const sections: BuiltScopeSection[] = [];
  const considerationInputs: Array<{
    key: string;
    text: string;
    category: string | null;
    workstreamId: string;
    maintenanceActions: ScopeConsiderationMaintenanceAction[];
  }> = [];

  if (plan) {
    const activeWorkstreams = plan.workstreams
      .filter((row) => !row.removed)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, MAX_SECTIONS);

    for (const [index, ws] of activeWorkstreams.entries()) {
      const deliverables = ws.actions
        .filter((action) => !isEvidenceOnlyPlanAction(action))
        .slice(0, MAX_DELIVERABLES_PER_SECTION)
        .map((action, actionIndex) => ({
          sourceActionKey: action.id,
          title: action.label,
          description: null,
          deliverableType: classifyDeliverableType({
            workstreamType: ws.workstreamType,
            actionId: action.id,
          }),
          sortOrder: actionIndex,
          isOptional: false,
          isIncluded: true,
          source: "PLAN" as const,
        }));

      sections.push({
        sourceImplementationWorkstreamId: ws.id,
        workstreamType: ws.workstreamType,
        title: polishedWorkstreamTitle(ws.workstreamType, ws.title),
        description: ws.summary,
        sortOrder: index,
        isOptional: false,
        isIncluded: true,
        capabilities: inheritActiveCapabilitiesExact(ws.capabilities),
        source: "PLAN",
        deliverables,
      });

      for (const constraint of ws.preservationConstraints) {
        considerationInputs.push({
          key: considerationKey(constraint),
          text: constraint.statement,
          category: constraint.category,
          workstreamId: ws.id,
          maintenanceActions: (constraint.maintenanceActions ?? []).map(
            (action) => ({
              id: action.id,
              text: action.label,
            }),
          ),
        });
      }
    }
  }

  const considerations = dedupeConsiderations(considerationInputs);

  const fingerprint = buildScopeSourceFingerprint({
    opportunityId: options.opportunityId,
    implementationPlanId: plan?.id ?? null,
    planVersion: plan?.planVersion ?? null,
    mappingVersion: plan?.mappingVersion ?? null,
    scopeMappingVersion: COMMERCIAL_SCOPE_MAPPING_VERSION,
  });

  const summary = plan
    ? `Recommended implementation scope based on the current approved website growth recommendations for ${options.businessName}.`
    : `Manual commercial scope draft for ${options.businessName}. Add sections and deliverables as agreed with the client.`;

  return {
    title: `${options.businessName} — Implementation Scope`,
    summary,
    sections,
    // Sprint 4.1: start empty — operator adds assumptions/exclusions explicitly.
    assumptions: [],
    exclusions: [],
    considerations,
    implementationPlanId: plan?.id ?? null,
    implementationInterpretationId: options.interpretationId ?? null,
    sourceFingerprint: fingerprint,
    scopeVersion: COMMERCIAL_SCOPE_VERSION,
  };
}
