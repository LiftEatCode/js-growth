import type {
  ClientProjectStatusValue,
  DerivedOnboardingState,
  OnboardingItemStatusValue,
} from "./constants";
import { isOnboardingItemSatisfied } from "./checklist";

export function deriveOnboardingState(options: {
  projectStatus: ClientProjectStatusValue;
  items: Array<{ required: boolean; status: OnboardingItemStatusValue | string }>;
  balanceOutstandingCents: number;
  allRequiredDeliveryTasksComplete: boolean;
}): DerivedOnboardingState {
  const { projectStatus, items, balanceOutstandingCents } = options;

  if (projectStatus === "COMPLETED") {
    return "COMPLETE";
  }

  if (projectStatus === "ACTIVE" || projectStatus === "BLOCKED") {
    if (
      options.allRequiredDeliveryTasksComplete &&
      balanceOutstandingCents > 0
    ) {
      return "FINAL_HANDOFF_BLOCKED_BY_BALANCE";
    }
    return "IN_PROGRESS";
  }

  if (projectStatus === "READY") {
    return "READY_FOR_KICKOFF";
  }

  // ONBOARDING (and other pre-start)
  const required = items.filter((i) => i.required);
  if (required.length === 0) {
    return "READY_FOR_KICKOFF";
  }

  const allRequiredDone = required.every((i) =>
    isOnboardingItemSatisfied(i.status),
  );
  if (allRequiredDone) {
    return "READY_FOR_KICKOFF";
  }

  const anyStarted = items.some(
    (i) =>
      i.status !== "NOT_STARTED" &&
      i.status !== "NOT_REQUIRED",
  );
  if (!anyStarted) {
    return "NOT_STARTED";
  }

  return "WAITING_ON_CLIENT";
}

export function canStartProject(options: {
  projectStatus: ClientProjectStatusValue;
  onboardingState: DerivedOnboardingState;
}): boolean {
  return (
    (options.projectStatus === "ONBOARDING" ||
      options.projectStatus === "READY") &&
    (options.onboardingState === "READY_FOR_KICKOFF" ||
      options.projectStatus === "READY")
  );
}

export function canCompleteProject(options: {
  projectStatus: ClientProjectStatusValue;
  allRequiredDeliveryTasksComplete: boolean;
  paidInFull: boolean;
  overrideReason?: string | null;
}): { ok: true } | { ok: false; reason: string; code: string } {
  if (
    options.projectStatus !== "ACTIVE" &&
    options.projectStatus !== "BLOCKED"
  ) {
    return {
      ok: false,
      reason: "Project must be ACTIVE before completion.",
      code: "INVALID_STATUS",
    };
  }
  if (!options.allRequiredDeliveryTasksComplete) {
    return {
      ok: false,
      reason: "All required delivery tasks must be completed.",
      code: "TASKS_INCOMPLETE",
    };
  }
  if (!options.paidInFull) {
    const reason = options.overrideReason?.trim();
    if (!reason || reason.length < 8) {
      return {
        ok: false,
        reason:
          "Balance remains outstanding. Pay balance or provide an override reason (min 8 chars) before marking COMPLETED.",
        code: "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
      };
    }
  }
  return { ok: true };
}
