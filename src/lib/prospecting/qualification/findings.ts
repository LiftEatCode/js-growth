import { OUTREACH_FINDING_ALLOWLIST } from "./constants";
import type { OutreachFindingId } from "./constants";
import type { AuditFinding } from "@/lib/website-audit/types";

const ALLOWLIST = new Set<string>(OUTREACH_FINDING_ALLOWLIST);

const DENIED_ID_PREFIXES = ["robots-", "performance-"];

function impactRank(value: AuditFinding["businessImpact"]): number {
  if (value === "high") {
    return 3;
  }
  if (value === "medium") {
    return 2;
  }
  return 1;
}

function priorityRank(value: AuditFinding["priority"]): number {
  if (value === "critical" || value === "high") {
    return value === "critical" ? 4 : 3;
  }
  if (value === "medium") {
    return 2;
  }
  return 1;
}

export function isAllowlistedOutreachFinding(
  finding: AuditFinding,
): finding is AuditFinding & { id: OutreachFindingId } {
  if (!ALLOWLIST.has(finding.id)) {
    return false;
  }

  if (finding.status === "pass") {
    return false;
  }

  if (finding.category === "performance" || finding.category === "accessibility") {
    return false;
  }

  if (DENIED_ID_PREFIXES.some((prefix) => finding.id.startsWith(prefix))) {
    return false;
  }

  const evidence = `${finding.title} ${finding.description}`.trim();
  if (finding.title.trim().length < 8 || finding.description.trim().length < 24) {
    return false;
  }

  if (evidence.toLowerCase().includes("guarantee")) {
    return false;
  }

  return true;
}

export function selectOutreachFindings(findings: AuditFinding[]): {
  primary: AuditFinding | null;
  secondary: AuditFinding | null;
  extras: AuditFinding[];
} {
  const eligible = findings
    .filter(isAllowlistedOutreachFinding)
    .slice()
    .sort((left, right) => {
      const impact = impactRank(right.businessImpact) - impactRank(left.businessImpact);
      if (impact !== 0) {
        return impact;
      }

      const priority = priorityRank(right.priority) - priorityRank(left.priority);
      if (priority !== 0) {
        return priority;
      }

      if (right.scoreImpact !== left.scoreImpact) {
        return right.scoreImpact - left.scoreImpact;
      }

      return (
        OUTREACH_FINDING_ALLOWLIST.indexOf(left.id as OutreachFindingId) -
        OUTREACH_FINDING_ALLOWLIST.indexOf(right.id as OutreachFindingId)
      );
    });

  const primary = eligible[0] ?? null;
  const secondary = eligible[1] ?? null;
  const extras = eligible.slice(2);

  return { primary, secondary, extras };
}
