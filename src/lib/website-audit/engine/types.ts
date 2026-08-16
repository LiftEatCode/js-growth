import type {
  AuditCategory,
  AuditFinding,
  AuditPageData,
  AuditSiteDiscoveryData,
  AuditStatus,
} from "../types";

export interface AuditRuleContext {
  pageData: AuditPageData;
  siteDiscovery?: AuditSiteDiscoveryData;
  finalUrl: string;
}

export interface AuditRule {
  id: string;
  category: AuditCategory;
  title: string;
  evaluate: (
    context: AuditRuleContext,
  ) => AuditFinding | AuditFinding[];
}

export interface AuditRuleGroup {
  id: string;
  label: string;
  rules: AuditRule[];
}

export interface CreateFindingInput {
  id: string;
  title: string;
  description: string;
  recommendation?: string;

  status: AuditStatus;
  category: AuditCategory;
  scoreImpact: number;

  priority?: AuditFinding["priority"];
  businessImpact?: AuditFinding["businessImpact"];
  difficulty?: AuditFinding["difficulty"];
  estimatedFixMinutes?: number;
  quickWin?: boolean;
}

export function createFinding(
  input: CreateFindingInput,
): AuditFinding {
  const defaults = getFindingDefaults(
    input.status,
    input.scoreImpact,
  );

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    recommendation: input.recommendation,

    status: input.status,
    category: input.category,
    scoreImpact: input.scoreImpact,

    priority:
      input.priority ?? defaults.priority,

    businessImpact:
      input.businessImpact ??
      defaults.businessImpact,

    difficulty:
      input.difficulty ?? defaults.difficulty,

    estimatedFixMinutes:
      input.estimatedFixMinutes ??
      defaults.estimatedFixMinutes,

    quickWin:
      input.quickWin ?? defaults.quickWin,
  };
}

function getFindingDefaults(
  status: AuditStatus,
  scoreImpact: number,
): Pick<
  AuditFinding,
  | "priority"
  | "businessImpact"
  | "difficulty"
  | "estimatedFixMinutes"
  | "quickWin"
> {
  if (status === "pass") {
    return {
      priority: "low",
      businessImpact: "low",
      difficulty: "easy",
      estimatedFixMinutes: 0,
      quickWin: false,
    };
  }

  if (status === "warning") {
    return {
      priority:
        scoreImpact >= 10 ? "high" : "medium",

      businessImpact:
        scoreImpact >= 10 ? "high" : "medium",

      difficulty: "medium",

      estimatedFixMinutes:
        scoreImpact >= 10 ? 45 : 20,

      quickWin: scoreImpact <= 5,
    };
  }

  return {
    priority:
      scoreImpact >= 10 ? "critical" : "high",

    businessImpact:
      scoreImpact >= 5 ? "high" : "medium",

    difficulty: "medium",

    estimatedFixMinutes:
      scoreImpact >= 10 ? 60 : 30,

    quickWin: scoreImpact <= 5,
  };
}