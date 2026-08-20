export type ImplementationInterpretationFailureCode =
  | "MODEL_ERROR"
  | "TIMEOUT"
  | "INVALID_OUTPUT"
  | "VALIDATION_FAILED"
  | "MISSING_PLAN"
  | "STALE_PLAN"
  | "SUPERSEDED_PLAN"
  | "UNSUPPORTED_PLAN_VERSION"
  | "UNSUPPORTED_MAPPING_VERSION"
  | "NOT_CONFIGURED";

export interface ImplementationAiEvidenceItem {
  sourceKey: string;
  type: string;
  title: string;
}

export interface ImplementationAiActionItem {
  sourceKey: string;
  actionId: string;
  text: string;
  evidenceSourceKeys: string[];
}

export interface ImplementationAiPreservationItem {
  sourceKey: string;
  category: string;
  message: string;
  maintenanceActions: Array<{
    sourceKey: string;
    text: string;
  }>;
}

export interface ImplementationAiWorkstreamInput {
  sourceKey: string;
  workstreamType: string;
  title: string;
  priority: string;
  capabilities: string[];
  deterministicSummary: string;
  evidence: ImplementationAiEvidenceItem[];
  actions: ImplementationAiActionItem[];
  preservationConstraints: ImplementationAiPreservationItem[];
}

export interface ImplementationAiInput {
  business: {
    name: string;
    location: string | null;
  };
  plan: {
    planId: string;
    status: string;
    generatedAt: string;
    planVersion: number;
    mappingVersion: number;
  };
  workstreams: ImplementationAiWorkstreamInput[];
  allowedSourceKeys: string[];
}

export interface ImplementationInterpretationContent {
  executiveStrategy: {
    headline: string;
    summary: string;
  };
  implementationApproach: {
    explanation: string;
  };
  workstreams: Array<{
    sourceKey: string;
    clientTitle: string;
    explanation: string;
    businessRationale: string;
    actionExplanations: Array<{
      sourceKey: string;
      explanation: string;
    }>;
    preservationNotes: Array<{
      sourceKey: string;
      explanation: string;
    }>;
  }>;
  sequencing: Array<{
    phase: string;
    objective: string;
    sourceKeys: string[];
    explanation: string;
  }>;
  implementationConsiderations: Array<{
    sourceKeys: string[];
    title: string;
    explanation: string;
  }>;
  internalTalkingPoints: string[];
}
