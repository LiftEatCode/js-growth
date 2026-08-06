import type {
    AuditCategory,
    AuditFinding,
    AuditPageData,
    AuditStatus,
  } from "../types";
  
  export interface AuditRuleContext {
    pageData: AuditPageData;
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
      priority: input.priority ?? defaults.priority,
      businessImpact:
        input.businessImpact ?? defaults.businessImpact,
      difficulty: input.difficulty ?? defaults.difficulty,
      estimatedFixTime:
        input.estimatedFixTime ?? defaults.estimatedFixTime,
      quickWin: input.quickWin ?? defaults.quickWin,
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
    | "estimatedFixTime"
    | "quickWin"
  > {
    if (status === "pass") {
      return {
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixTime: "N/A",
        quickWin: false,
      };
    }

    if (status === "warning") {
      return {
        priority: scoreImpact >= 10 ? "high" : "medium",
        businessImpact: scoreImpact >= 10 ? "high" : "medium",
        difficulty: "medium",
        estimatedFixTime: "15-30 minutes",
        quickWin: scoreImpact <= 5,
      };
    }

    return {
      priority: scoreImpact >= 10 ? "critical" : "high",
      businessImpact: scoreImpact >= 10 ? "high" : "medium",
      difficulty: "medium",
      estimatedFixTime: "30-60 minutes",
      quickWin: scoreImpact <= 5,
    };
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
    estimatedFixTime?: string;
    quickWin?: boolean;
  }