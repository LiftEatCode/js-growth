"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { LoaderCircle } from "lucide-react";

import {
  createSearchOpportunityAction,
  updateSearchOpportunityAction,
  type CreateSearchOpportunityState,
  type UpdateSearchOpportunityState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";
import {
  SEARCH_EVIDENCE_KINDS,
  SEARCH_INTENTS,
  SEARCH_OPPORTUNITY_SOURCES,
  SEARCH_OPPORTUNITY_STATUSES,
  SEARCH_PAGE_TYPES,
  SEARCH_PRIORITY_BANDS,
  SEARCH_TOPICS,
} from "@/lib/growth/search-intelligence";

const createInitial: CreateSearchOpportunityState = {
  success: false,
  message: "",
};

const updateInitial: UpdateSearchOpportunityState = {
  success: false,
  message: "",
};

export function CreateSearchOpportunityForm() {
  const [state, formAction, isPending] = useActionState(
    createSearchOpportunityAction,
    createInitial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const statusId = useId();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success, state.message]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
      aria-busy={isPending}
    >
      <p className="text-sm font-semibold text-brand">
        Create search opportunity
      </p>
      <p className="text-xs leading-5 text-muted">
        Manual / research-backed only. Do not invent search volumes or ranking
        promises. Priority band is computed from commercial fit, intent, gap,
        audit relevance, GSC evidence, and effort.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Slug</span>
          <input
            name="slug"
            required
            disabled={isPending}
            placeholder="seo-service-page"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium">Query / keyword concept</span>
          <input
            name="queryConcept"
            required
            disabled={isPending}
            maxLength={200}
            placeholder="SEO for small businesses"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Topic</span>
          <select
            name="topic"
            required
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {SEARCH_TOPICS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Intent</span>
          <select
            name="intent"
            required
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {SEARCH_INTENTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Page type</span>
          <select
            name="pageType"
            required
            disabled={isPending}
            defaultValue="SERVICE"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {SEARCH_PAGE_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Source</span>
          <select
            name="source"
            required
            disabled={isPending}
            defaultValue="MANUAL_RESEARCH"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {SEARCH_OPPORTUNITY_SOURCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Evidence kind</span>
          <select
            name="evidenceKind"
            required
            disabled={isPending}
            defaultValue="MANUAL_RESEARCH"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {SEARCH_EVIDENCE_KINDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Current page path</span>
          <input
            name="currentPagePath"
            disabled={isPending}
            placeholder="/local-seo"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Recommended path</span>
          <input
            name="recommendedPath"
            disabled={isPending}
            placeholder="/seo"
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Commercial relevance (1–3)</span>
          <input
            name="commercialRelevance"
            type="number"
            min={1}
            max={3}
            required
            defaultValue={3}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Intent strength (1–3)</span>
          <input
            name="intentStrength"
            type="number"
            min={1}
            max={3}
            required
            defaultValue={3}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Content gap (1–3)</span>
          <input
            name="contentGap"
            type="number"
            min={1}
            max={3}
            required
            defaultValue={2}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Audit funnel relevance (1–3)</span>
          <input
            name="auditFunnelRelevance"
            type="number"
            min={1}
            max={3}
            required
            defaultValue={2}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">GSC evidence (0–2)</span>
          <input
            name="gscEvidence"
            type="number"
            min={0}
            max={2}
            required
            defaultValue={0}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Effort (1–3, higher=harder)</span>
          <input
            name="effort"
            type="number"
            min={1}
            max={3}
            required
            defaultValue={2}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          disabled={isPending}
          maxLength={2000}
          className="w-full rounded-xl border border-border px-3 py-2 disabled:opacity-60"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Create opportunity"
          )}
        </Button>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={`text-sm ${state.success ? "text-brand" : "text-muted"}`}
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}

type OpportunityRow = {
  id: string;
  slug: string;
  queryConcept: string;
  topic: string;
  intent: string;
  status: string;
  priorityBand: string;
  priorityScore: number;
  source: string;
  evidenceKind: string;
  currentPagePath: string | null;
  recommendedPath: string | null;
  notes: string | null;
};

export function SearchOpportunityRowForm({
  opportunity,
}: {
  opportunity: OpportunityRow;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSearchOpportunityAction,
    updateInitial,
  );

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-xl border border-border/70 bg-white/80 p-3"
      aria-busy={isPending}
    >
      <input type="hidden" name="id" value={opportunity.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-brand">
          {opportunity.queryConcept}{" "}
          <span className="font-normal text-muted">({opportunity.slug})</span>
        </p>
        <p className="text-xs text-muted">
          {opportunity.priorityBand} · score {opportunity.priorityScore} ·{" "}
          {opportunity.topic} · {opportunity.intent}
        </p>
      </div>
      <p className="text-xs text-muted">
        {opportunity.source} / {opportunity.evidenceKind}
        {opportunity.currentPagePath
          ? ` · current ${opportunity.currentPagePath}`
          : ""}
        {opportunity.recommendedPath
          ? ` · recommend ${opportunity.recommendedPath}`
          : ""}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue={opportunity.status}
            disabled={isPending}
            className="flex h-9 w-full rounded-lg border border-border px-2 disabled:opacity-60"
          >
            {SEARCH_OPPORTUNITY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Priority band</span>
          <select
            name="priorityBand"
            defaultValue={opportunity.priorityBand}
            disabled={isPending}
            className="flex h-9 w-full rounded-lg border border-border px-2 disabled:opacity-60"
          >
            {SEARCH_PRIORITY_BANDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs sm:col-span-1">
          <span className="font-medium">Notes</span>
          <input
            name="notes"
            defaultValue={opportunity.notes ?? ""}
            disabled={isPending}
            maxLength={2000}
            className="flex h-9 w-full rounded-lg border border-border px-2 disabled:opacity-60"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Update"}
        </Button>
        <p role="status" aria-live="polite" className="text-xs text-muted">
          {state.message}
        </p>
      </div>
    </form>
  );
}
