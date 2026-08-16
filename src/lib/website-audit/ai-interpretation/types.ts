import type { AiInterpretationContent } from "./schema";

export type AiInterpretationStatus =
  | "generating"
  | "completed"
  | "failed"
  | "unavailable";

export interface AiTokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiInterpretationRecord {
  version: "v1";
  model: string;
  generatedAt: string;
  inputFingerprint: string;
  usage: AiTokenUsage | null;
  content: AiInterpretationContent;
}

export interface AiInterpretationView {
  status: "hidden" | "completed" | "generating" | "unavailable";
  record: AiInterpretationRecord | null;
  attemptCount: number;
}

export interface AiAuditFindingContext {
  id: string;
  category: string;
  status: string;
  priority: string;
  businessImpact: string;
  difficulty: string;
  estimatedFixMinutes: number;
  quickWin: boolean;
  title: string;
  description: string;
  recommendation?: string;
}

export interface AiAuditContext {
  interpretationVersion: "v1";
  audit: {
    overallScore: number;
    grade: string;
    categoryScores: Array<{
      category: string;
      label: string;
      score: number;
      maxScore: number;
    }>;
    summary: {
      warnings: number;
      failed: number;
      criticalIssues: number;
      quickWins: number;
      highImpactFindings: number;
      estimatedFixMinutes: number;
    };
  };
  findings: AiAuditFindingContext[];
  site: {
    available: boolean;
    pagesDiscovered?: number;
    pagesScanned?: number;
    truncated?: boolean;
    pageTypeCounts?: Record<string, number>;
    patterns: string[];
  };
  competitive: {
    available: boolean;
    suppliedCount?: number;
    analyzedCount?: number;
    status?: string;
    gaps?: Array<{
      metric: string;
      direction: string;
      magnitude: string;
      customerValue: number;
      benchmarkValue: number;
    }>;
    strengths?: Array<{
      metric: string;
      title: string;
    }>;
    opportunities?: Array<{
      title: string;
      description: string;
      magnitude: string;
    }>;
  };
  deterministicPlan: {
    quickWins: string[];
    priorities: string[];
    actionPlan: string[];
  };
}

export interface InterpretationProviderResult {
  parsed: unknown;
  model: string;
  usage: AiTokenUsage | null;
}

export interface InterpretationProvider {
  generate(input: {
    model: string;
    system: string;
    user: string;
    timeoutMs: number;
  }): Promise<InterpretationProviderResult>;
}

export type AiClaimResult =
  | "claimed"
  | "completed"
  | "in-progress"
  | "exhausted"
  | "unavailable";

export interface AiInterpretationStoreRecord {
  status: AiInterpretationStatus | null;
  attemptCount: number;
  startedAt: string | null;
  generatedAt: string | null;
  interpretation: AiInterpretationRecord | null;
}

export interface AiInterpretationStore {
  get(reportId: string): Promise<AiInterpretationStoreRecord | null>;
  claimGeneration(reportId: string, now: Date): Promise<AiClaimResult>;
  saveCompleted(
    reportId: string,
    record: AiInterpretationRecord,
    now: Date,
  ): Promise<void>;
  saveFailed(reportId: string, now: Date): Promise<void>;
}
