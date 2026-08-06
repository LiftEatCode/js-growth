import type { AuditFinding } from "../types";
import type {
  AuditRule,
  AuditRuleContext,
} from "./types";

export function runAuditRules(
  rules: AuditRule[],
  context: AuditRuleContext,
): AuditFinding[] {
  return rules.flatMap((rule) => {
    try {
      const result = rule.evaluate(context);

      return Array.isArray(result)
        ? result
        : [result];
    } catch (error) {
      console.error(
        `Website audit rule "${rule.id}" failed:`,
        error,
      );

      return [];
    }
  });
}