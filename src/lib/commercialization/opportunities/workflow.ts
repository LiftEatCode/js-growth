import type { OpportunityStage } from "./constants";
import { isTerminalOpportunityStage } from "./constants";

export function canTransitionOpportunityStage(options: {
  from: OpportunityStage;
  to: OpportunityStage;
}): { ok: true } | { ok: false; reason: string } {
  if (options.from === options.to) {
    return { ok: false, reason: "Stage is unchanged." };
  }

  // WON/LOST → active = reopen; otherwise allow any non-identical change.
  if (isTerminalOpportunityStage(options.from)) {
    if (isTerminalOpportunityStage(options.to)) {
      return {
        ok: false,
        reason: "Move to an active stage before changing between WON and LOST.",
      };
    }
    return { ok: true };
  }

  return { ok: true };
}

export function classifyNextActionState(options: {
  nextAction: string | null | undefined;
  nextActionAt: Date | null | undefined;
  now?: Date;
}): "none" | "overdue" | "upcoming" {
  const action = options.nextAction?.trim() ?? "";
  if (!action && !options.nextActionAt) {
    return "none";
  }

  if (!options.nextActionAt) {
    return action ? "upcoming" : "none";
  }

  const now = options.now ?? new Date();
  const due = options.nextActionAt.getTime();
  if (Number.isNaN(due)) {
    return "none";
  }

  // End of local day comparison: overdue if due date is before start of today.
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (due < startOfToday.getTime()) {
    return "overdue";
  }

  return "upcoming";
}
