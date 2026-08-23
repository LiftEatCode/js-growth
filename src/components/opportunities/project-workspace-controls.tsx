"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  completeProjectAction,
  startProjectAction,
  updateDeliveryTaskAction,
  updateOnboardingItemAction,
} from "@/app/reports/opportunities/onboarding-actions";
import { Button } from "@/components/ui";
import type { OnboardingItemStatusValue } from "@/lib/commercialization/onboarding";

const ITEM_STATUSES: OnboardingItemStatusValue[] = [
  "NOT_STARTED",
  "REQUESTED",
  "RECEIVED",
  "NOT_REQUIRED",
  "COMPLETED",
];

export function ProjectWorkspaceControls(props: {
  opportunityId: string;
  clientId: string;
  projectId: string;
  canStart: boolean;
  canComplete: boolean;
  finalHandoffBlockedByBalance: boolean;
  onboardingItems: Array<{
    id: string;
    key: string;
    label: string;
    description: string | null;
    status: OnboardingItemStatusValue;
    required: boolean;
  }>;
  deliveryTasks: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  function refresh() {
    router.refresh();
  }

  function updateItem(itemId: string, status: OnboardingItemStatusValue) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateOnboardingItemAction({
        opportunityId: props.opportunityId,
        clientId: props.clientId,
        projectId: props.projectId,
        itemId,
        status,
      });
      if (!result.success) {
        setError(result.message ?? "Update failed.");
        return;
      }
      setMessage("Checklist updated.");
      refresh();
    });
  }

  function start() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await startProjectAction({
        opportunityId: props.opportunityId,
        clientId: props.clientId,
        projectId: props.projectId,
      });
      if (!result.success) {
        setError(result.message ?? "Could not start project.");
        return;
      }
      setMessage(result.message ?? "Project started.");
      refresh();
    });
  }

  function updateTask(
    taskId: string,
    status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED",
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateDeliveryTaskAction({
        opportunityId: props.opportunityId,
        clientId: props.clientId,
        projectId: props.projectId,
        taskId,
        status,
      });
      if (!result.success) {
        setError(result.message ?? "Task update failed.");
        return;
      }
      refresh();
    });
  }

  function complete() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await completeProjectAction({
        opportunityId: props.opportunityId,
        clientId: props.clientId,
        projectId: props.projectId,
        overrideReason: overrideReason.trim() || undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Could not complete project.");
        return;
      }
      setMessage(result.message ?? "Completed.");
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Onboarding checklist
        </h3>
        <p className="text-xs text-slate-500">
          Never store passwords here. Prefer platform invitations / delegated
          access. Track Requested / Received / Not required only.
        </p>
        <ul className="space-y-3">
          {props.onboardingItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.label}
                    {item.required ? (
                      <span className="ml-2 text-xs text-amber-700">
                        Required
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-slate-400">
                        Optional
                      </span>
                    )}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={item.status}
                  disabled={isPending}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      e.target.value as OnboardingItemStatusValue,
                    )
                  }
                >
                  {ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {props.canStart ? (
        <div>
          <Button type="button" disabled={isPending} onClick={start}>
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Start Project
          </Button>
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Delivery tasks
        </h3>
        <p className="text-xs text-slate-500">
          Canonical execution units — overlapping Scope deliverables share one
          task.
        </p>
        <ul className="space-y-2">
          {props.deliveryTasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-900">{task.title}</span>
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                value={task.status}
                disabled={isPending}
                onChange={(e) =>
                  updateTask(
                    task.id,
                    e.target.value as
                      | "NOT_STARTED"
                      | "IN_PROGRESS"
                      | "BLOCKED"
                      | "COMPLETED",
                  )
                }
              >
                <option value="NOT_STARTED">NOT STARTED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </li>
          ))}
        </ul>
      </section>

      {props.finalHandoffBlockedByBalance ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Final handoff blocked by outstanding balance. Complete payment before
          marking the project completed, or provide an override reason.
        </p>
      ) : null}

      {(props.canComplete || props.finalHandoffBlockedByBalance) && (
        <div className="space-y-2">
          {props.finalHandoffBlockedByBalance ? (
            <label className="block text-sm">
              <span className="text-slate-600">Override reason (optional)</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why complete without balance paid?"
              />
            </label>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={complete}
          >
            Mark Project Completed
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-800">{message}</p>
      ) : null}
    </div>
  );
}
