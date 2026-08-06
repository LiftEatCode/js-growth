import type {
    AuditFinding,
    WebsiteAuditResult,
  } from "./types";
  
  export interface ExecutiveSummary {
    heading: string;
  
    summary: string;
  
    strengths: string[];
  
    priorities: string[];
  
    estimatedFixMinutes: number;
  }
  
  export function buildExecutiveSummary(
    findings: AuditFinding[],
    summary: WebsiteAuditResult["summary"],
  ): ExecutiveSummary {
    const strengths: string[] = [];
    const priorities: string[] = [];
  
    const passing = findings.filter(
      (f) => f.status === "pass",
    );
  
    const failures = findings
      .filter((f) => f.status !== "pass")
      .sort(
        (a, b) =>
          b.scoreImpact - a.scoreImpact,
      );
  
    passing
      .slice(0, 3)
      .forEach((finding) =>
        strengths.push(finding.title),
      );
  
    failures
      .slice(0, 5)
      .forEach((finding) =>
        priorities.push(finding.title),
      );
  
    let heading = "Website Health Looks Good";
  
    if (summary.criticalIssues >= 5) {
      heading =
        "Immediate Attention Recommended";
    } else if (
      summary.criticalIssues >= 2
    ) {
      heading =
        "Several High Priority Improvements";
    }
  
    const text = `Your website has ${summary.failed} critical findings and ${summary.warnings} recommendations. The highest priority improvements are ${priorities
      .slice(0, 3)
      .join(", ")}. These changes are estimated to take approximately ${
      summary.estimatedFixMinutes
    } minutes and should provide the greatest improvement in search visibility and overall website quality.`;
  
    return {
      heading,
  
      summary: text,
  
      strengths,
  
      priorities,
  
      estimatedFixMinutes:
        summary.estimatedFixMinutes,
    };
  }