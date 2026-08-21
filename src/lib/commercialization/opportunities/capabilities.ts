import {
  getServiceCapability,
  SERVICE_CAPABILITY_VERSION,
} from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";

import type { OpportunityCapabilitiesSnapshot } from "./types";

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

/**
 * Derive recommended capabilities from a deterministic Implementation Plan.
 * Inactive capabilities are never auto-mapped even if present on a workstream.
 */
export function snapshotCapabilitiesFromPlan(
  plan: LoadedImplementationPlan | null,
  options?: { now?: Date },
): OpportunityCapabilitiesSnapshot {
  const now = options?.now ?? new Date();

  if (!plan) {
    return {
      capabilityVersion: SERVICE_CAPABILITY_VERSION,
      sourcePlanId: null,
      sourcePlanStatus: null,
      snapshottedAt: now.toISOString(),
      capabilities: [],
      noPlanAtSnapshot: true,
    };
  }

  const ids = new Set<ServiceCapabilityId>();

  for (const workstream of plan.workstreams) {
    if (workstream.removed) {
      continue;
    }
    for (const capability of workstream.capabilities) {
      const meta = getServiceCapability(capability);
      if (meta?.active) {
        ids.add(capability);
      }
    }
  }

  const capabilities = CAPABILITY_ORDER.filter((id) => ids.has(id));

  return {
    capabilityVersion: SERVICE_CAPABILITY_VERSION,
    sourcePlanId: plan.id,
    sourcePlanStatus: plan.status,
    snapshottedAt: now.toISOString(),
    capabilities,
    noPlanAtSnapshot: false,
  };
}

export function parseCapabilitiesSnapshot(
  raw: unknown,
): OpportunityCapabilitiesSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Partial<OpportunityCapabilitiesSnapshot>;
  if (!Array.isArray(value.capabilities) || typeof value.snapshottedAt !== "string") {
    return null;
  }

  return {
    capabilityVersion:
      typeof value.capabilityVersion === "number"
        ? value.capabilityVersion
        : SERVICE_CAPABILITY_VERSION,
    sourcePlanId:
      typeof value.sourcePlanId === "string" ? value.sourcePlanId : null,
    sourcePlanStatus:
      typeof value.sourcePlanStatus === "string"
        ? value.sourcePlanStatus
        : null,
    snapshottedAt: value.snapshottedAt,
    capabilities: value.capabilities.filter(
      (id): id is ServiceCapabilityId => typeof id === "string",
    ),
    noPlanAtSnapshot: value.noPlanAtSnapshot === true,
  };
}
