import { randomUUID } from "node:crypto";

import { getServiceCapability } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";

import {
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
  ScopeAssumption,
  ScopeConsideration,
  ScopeExclusion,
} from "./types";

function activeCapabilitiesOnly(
  capabilities: ServiceCapabilityId[],
): ServiceCapabilityId[] {
  return capabilities.filter((id) => getServiceCapability(id)?.active === true);
}

function defaultAssumptions(): ScopeAssumption[] {
  return [
    {
      id: randomUUID(),
      text: "Client will provide necessary account and access credentials in a timely manner.",
      sortOrder: 0,
      templateKey: "access_credentials",
    },
    {
      id: randomUUID(),
      text: "Existing hosting and platform capabilities must support the proposed website changes.",
      sortOrder: 1,
      templateKey: "hosting_support",
    },
    {
      id: randomUUID(),
      text: "Final content and business details require client review and approval.",
      sortOrder: 2,
      templateKey: "client_approval",
    },
  ];
}

function defaultExclusions(): ScopeExclusion[] {
  return [
    {
      id: randomUUID(),
      text: "Paid advertising management is not included unless added separately.",
      sortOrder: 0,
      templateKey: "no_paid_ads",
    },
    {
      id: randomUUID(),
      text: "Custom application development is not included unless added separately.",
      sortOrder: 1,
      templateKey: "no_custom_software",
    },
    {
      id: randomUUID(),
      text: "Third-party subscription fees are not included.",
      sortOrder: 2,
      templateKey: "no_third_party_fees",
    },
  ];
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
  const considerations: ScopeConsideration[] = [];

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
        title: ws.title,
        description: ws.summary,
        sortOrder: index,
        isOptional: false,
        isIncluded: true,
        capabilities: activeCapabilitiesOnly(ws.capabilities),
        source: "PLAN",
        deliverables,
      });

      for (const [cIndex, constraint] of ws.preservationConstraints.entries()) {
        considerations.push({
          id: randomUUID(),
          text: constraint.statement,
          category: constraint.category,
          sortOrder: considerations.length + cIndex,
        });
      }
    }
  }

  const fingerprint = buildScopeSourceFingerprint({
    opportunityId: options.opportunityId,
    implementationPlanId: plan?.id ?? null,
    planVersion: plan?.planVersion ?? null,
    mappingVersion: plan?.mappingVersion ?? null,
  });

  const summary = plan
    ? `Implementation scope based on the current recommendations for ${options.businessName}.`
    : `Manual commercial scope draft for ${options.businessName}. Add sections and deliverables as agreed with the client.`;

  return {
    title: `${options.businessName} — Scope`,
    summary,
    sections,
    assumptions: defaultAssumptions(),
    exclusions: defaultExclusions(),
    considerations,
    implementationPlanId: plan?.id ?? null,
    implementationInterpretationId: options.interpretationId ?? null,
    sourceFingerprint: fingerprint,
    scopeVersion: COMMERCIAL_SCOPE_VERSION,
  };
}
