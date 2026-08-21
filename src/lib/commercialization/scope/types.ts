import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";

import type {
  CommercialScopeStatus,
  ScopeDeliverableType,
  ScopeItemSource,
} from "./constants";

export interface ScopeAssumption {
  id: string;
  text: string;
  sortOrder: number;
  templateKey?: string | null;
}

export interface ScopeExclusion {
  id: string;
  text: string;
  sortOrder: number;
  templateKey?: string | null;
}

export interface ScopeConsiderationMaintenanceAction {
  id: string;
  text: string;
}

export interface ScopeConsideration {
  id: string;
  /** Stable identity e.g. preserve:performance */
  key: string;
  text: string;
  category: string | null;
  sortOrder: number;
  sourceWorkstreamIds: string[];
  maintenanceActions: ScopeConsiderationMaintenanceAction[];
}

export interface BuiltScopeDeliverable {
  sourceActionKey: string | null;
  title: string;
  description: string | null;
  deliverableType: ScopeDeliverableType;
  sortOrder: number;
  isOptional: boolean;
  isIncluded: boolean;
  source: ScopeItemSource;
}

export interface BuiltScopeSection {
  sourceImplementationWorkstreamId: string | null;
  workstreamType: string | null;
  title: string;
  description: string | null;
  sortOrder: number;
  isOptional: boolean;
  isIncluded: boolean;
  capabilities: ServiceCapabilityId[];
  source: ScopeItemSource;
  deliverables: BuiltScopeDeliverable[];
}

export interface BuiltCommercialScope {
  title: string;
  summary: string;
  sections: BuiltScopeSection[];
  assumptions: ScopeAssumption[];
  exclusions: ScopeExclusion[];
  considerations: ScopeConsideration[];
  implementationPlanId: string | null;
  implementationInterpretationId: string | null;
  sourceFingerprint: string;
  scopeVersion: number;
}

export interface ScopeSourceFingerprint {
  opportunityId: string;
  implementationPlanId: string | null;
  planVersion: number | null;
  mappingVersion: number | null;
  scopeVersion: number;
  scopeMappingVersion: number;
}

export type { CommercialScopeStatus, ScopeDeliverableType, ScopeItemSource };
