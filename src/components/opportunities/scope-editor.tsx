"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addManualDeliverableAction,
  approveScopeAction,
  markScopeReviewedAction,
  removeManualDeliverableAction,
  reorderDeliverablesAction,
  reorderSectionsAction,
  saveAssumptionsAction,
  saveExclusionsAction,
  saveScopeHeaderAction,
  updateDeliverableAction,
  updateSectionAction,
} from "@/app/reports/opportunities/scope-actions";
import { Button } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities";
import { listActiveServiceCapabilities } from "@/lib/commercialization/capabilities";

export interface ScopeEditorProps {
  scopeId: string;
  editable: boolean;
  status: string;
  initialTitle: string;
  initialSummary: string;
  sections: Array<{
    id: string;
    title: string;
    description: string | null;
    isIncluded: boolean;
    isOptional: boolean;
    capabilities: ServiceCapabilityId[];
    source: string;
    workstreamType: string | null;
    deliverables: Array<{
      id: string;
      title: string;
      description: string | null;
      isIncluded: boolean;
      isOptional: boolean;
      source: string;
      sourceActionKey: string | null;
    }>;
  }>;
  assumptions: string[];
  exclusions: string[];
}

export function ScopeEditor({
  scopeId,
  editable,
  status,
  initialTitle,
  initialSummary,
  sections: initialSections,
  assumptions: initialAssumptions,
  exclusions: initialExclusions,
}: ScopeEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [assumptionsText, setAssumptionsText] = useState(
    initialAssumptions.join("\n"),
  );
  const [exclusionsText, setExclusionsText] = useState(
    initialExclusions.join("\n"),
  );
  const [manualTitles, setManualTitles] = useState<Record<string, string>>({});

  const activeCapabilities = listActiveServiceCapabilities();

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      router.refresh();
    });
  }

  if (!editable) {
    return (
      <p className="text-sm text-muted">
        This Scope is {status.toLowerCase()} and immutable for material edits.
        Use Revise on the Opportunity to create a new draft from the current
        Implementation Plan.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Scope header
        </h3>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Title</span>
          <input
            className="w-full rounded-lg border border-border bg-white px-3 py-2"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Summary</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2"
            value={summary}
            maxLength={2000}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() => saveScopeHeaderAction(scopeId, title, summary))
          }
        >
          Save header
        </Button>
      </section>

      <section className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Sections & deliverables
        </h3>
        {initialSections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="space-y-3 rounded-xl border border-border/80 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="min-w-[12rem] flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
                defaultValue={section.title}
                onBlur={(e) => {
                  if (e.target.value !== section.title) {
                    run(() =>
                      updateSectionAction(scopeId, section.id, {
                        title: e.target.value,
                      }),
                    );
                  }
                }}
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={section.isIncluded}
                  onChange={(e) =>
                    run(() =>
                      updateSectionAction(scopeId, section.id, {
                        isIncluded: e.target.checked,
                      }),
                    )
                  }
                />
                Included
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={section.isOptional}
                  onChange={(e) =>
                    run(() =>
                      updateSectionAction(scopeId, section.id, {
                        isOptional: e.target.checked,
                      }),
                    )
                  }
                />
                Optional
              </label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending || sectionIndex === 0}
                  onClick={() => {
                    const ids = initialSections.map((s) => s.id);
                    const next = [...ids];
                    [next[sectionIndex - 1], next[sectionIndex]] = [
                      next[sectionIndex]!,
                      next[sectionIndex - 1]!,
                    ];
                    run(() => reorderSectionsAction(scopeId, next));
                  }}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    isPending || sectionIndex === initialSections.length - 1
                  }
                  onClick={() => {
                    const ids = initialSections.map((s) => s.id);
                    const next = [...ids];
                    [next[sectionIndex], next[sectionIndex + 1]] = [
                      next[sectionIndex + 1]!,
                      next[sectionIndex]!,
                    ];
                    run(() => reorderSectionsAction(scopeId, next));
                  }}
                >
                  Down
                </Button>
              </div>
            </div>

            <textarea
              className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              defaultValue={section.description ?? ""}
              placeholder="Section description"
              onBlur={(e) => {
                const value = e.target.value;
                if (value !== (section.description ?? "")) {
                  run(() =>
                    updateSectionAction(scopeId, section.id, {
                      description: value,
                    }),
                  );
                }
              }}
            />

            <div className="flex flex-wrap gap-2 text-xs">
              {activeCapabilities.map((cap) => {
                const checked = section.capabilities.includes(cap.id);
                return (
                  <label
                    key={cap.id}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...section.capabilities, cap.id]
                          : section.capabilities.filter((id) => id !== cap.id);
                        run(() =>
                          updateSectionAction(scopeId, section.id, {
                            capabilities: next,
                          }),
                        );
                      }}
                    />
                    {cap.displayName}
                  </label>
                );
              })}
            </div>

            <p className="text-xs text-muted">
              Source: {section.source}
              {section.workstreamType ? ` · ${section.workstreamType}` : ""}
            </p>

            <ul className="space-y-2">
              {section.deliverables.map((deliverable, dIndex) => (
                <li
                  key={deliverable.id}
                  className="rounded-lg border border-border/60 bg-surface/30 px-3 py-2"
                >
                  <input
                    className="w-full rounded border border-border bg-white px-2 py-1 text-sm"
                    defaultValue={deliverable.title}
                    onBlur={(e) => {
                      if (e.target.value !== deliverable.title) {
                        run(() =>
                          updateDeliverableAction(scopeId, deliverable.id, {
                            title: e.target.value,
                          }),
                        );
                      }
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={deliverable.isIncluded}
                        onChange={(e) =>
                          run(() =>
                            updateDeliverableAction(scopeId, deliverable.id, {
                              isIncluded: e.target.checked,
                            }),
                          )
                        }
                      />
                      Included
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={deliverable.isOptional}
                        onChange={(e) =>
                          run(() =>
                            updateDeliverableAction(scopeId, deliverable.id, {
                              isOptional: e.target.checked,
                            }),
                          )
                        }
                      />
                      Optional
                    </label>
                    <span>
                      {deliverable.source}
                      {deliverable.sourceActionKey
                        ? ` · ${deliverable.sourceActionKey}`
                        : ""}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending || dIndex === 0}
                      onClick={() => {
                        const ids = section.deliverables.map((d) => d.id);
                        const next = [...ids];
                        [next[dIndex - 1], next[dIndex]] = [
                          next[dIndex]!,
                          next[dIndex - 1]!,
                        ];
                        run(() =>
                          reorderDeliverablesAction(scopeId, section.id, next),
                        );
                      }}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        isPending || dIndex === section.deliverables.length - 1
                      }
                      onClick={() => {
                        const ids = section.deliverables.map((d) => d.id);
                        const next = [...ids];
                        [next[dIndex], next[dIndex + 1]] = [
                          next[dIndex + 1]!,
                          next[dIndex]!,
                        ];
                        run(() =>
                          reorderDeliverablesAction(scopeId, section.id, next),
                        );
                      }}
                    >
                      Down
                    </Button>
                    {deliverable.source === "MANUAL" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() =>
                            removeManualDeliverableAction(
                              scopeId,
                              deliverable.id,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[12rem] flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
                placeholder="Add manual deliverable"
                value={manualTitles[section.id] ?? ""}
                onChange={(e) =>
                  setManualTitles((prev) => ({
                    ...prev,
                    [section.id]: e.target.value,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending || !(manualTitles[section.id] ?? "").trim()}
                onClick={() => {
                  const text = (manualTitles[section.id] ?? "").trim();
                  run(async () => {
                    const result = await addManualDeliverableAction(
                      scopeId,
                      section.id,
                      text,
                    );
                    if (result.success) {
                      setManualTitles((prev) => ({
                        ...prev,
                        [section.id]: "",
                      }));
                    }
                    return result;
                  });
                }}
              >
                Add manual
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Assumptions
        </h3>
        <textarea
          className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={assumptionsText}
          onChange={(e) => setAssumptionsText(e.target.value)}
          placeholder="One assumption per line"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              saveAssumptionsAction(
                scopeId,
                assumptionsText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              ),
            )
          }
        >
          Save assumptions
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Exclusions
        </h3>
        <textarea
          className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={exclusionsText}
          onChange={(e) => setExclusionsText(e.target.value)}
          placeholder="One exclusion per line"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              saveExclusionsAction(
                scopeId,
                exclusionsText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              ),
            )
          }
        >
          Save exclusions
        </Button>
      </section>

      <section className="flex flex-wrap gap-3">
        {status === "DRAFT" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => markScopeReviewedAction(scopeId))}
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Mark reviewed
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={isPending}
          onClick={() => run(() => approveScopeAction(scopeId))}
        >
          Approve Scope
        </Button>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Capabilities shown:{" "}
        {activeCapabilities
          .map((c) => getServiceCapabilityDisplayName(c.id))
          .join(", ")}
        . Inactive capabilities cannot be added.
      </p>
    </div>
  );
}
