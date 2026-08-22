"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addCustomLineItemAction,
  approvePricingAction,
  markPricingReviewedAction,
  removeCustomLineItemAction,
  updatePricingLineItemAction,
  updatePricingNotesAction,
} from "@/app/reports/opportunities/pricing-actions";
import { Button } from "@/components/ui";
import {
  effortBandLabel,
  formatUsdCents,
  type PricingEffortBand,
} from "@/lib/commercialization/pricing/constants";
import { evaluatePricingCompleteness } from "@/lib/commercialization/pricing/completeness";

export interface PricingEditorProps {
  pricingId: string;
  editable: boolean;
  status: string;
  initialNotes: string;
  recommendedIncludedCents: number;
  recommendedOptionalCents: number;
  recommendedTotalCents: number;
  finalIncludedCents: number;
  finalOptionalCents: number;
  finalTotalCents: number;
  minimumEngagementCents: number;
  minimumApplied: boolean;
  assessmentOnly: boolean;
  lineItems: Array<{
    id: string;
    title: string;
    workType: string;
    effortBand: string;
    quantity: number;
    recommendedUnitPriceCents: number | null;
    recommendedLineTotalCents: number | null;
    finalUnitPriceCents: number | null;
    finalLineTotalCents: number | null;
    isOptional: boolean;
    isIncluded: boolean;
    isCustom: boolean;
    isOverridden: boolean;
    overrideReason: string | null;
    sourceSectionTitles: string[];
  }>;
}

function centsToDollarInput(cents: number | null): string {
  if (cents == null) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

export function PricingEditor({
  pricingId,
  editable,
  status,
  initialNotes,
  recommendedIncludedCents: _recommendedIncludedCents,
  recommendedOptionalCents,
  recommendedTotalCents,
  finalIncludedCents: _finalIncludedCents,
  finalOptionalCents,
  finalTotalCents,
  minimumEngagementCents,
  minimumApplied,
  assessmentOnly,
  lineItems,
}: PricingEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customOptional, setCustomOptional] = useState(false);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Update failed.");
        return;
      }
      router.refresh();
    });
  }

  const completeness = evaluatePricingCompleteness(lineItems);

  if (!editable) {
    return (
      <p className="text-sm text-muted">
        This Pricing is {status.toLowerCase()} and immutable. Use Revise on the
        Opportunity to create a new draft from the current approved Scope.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Work units
        </h3>
        <p className="text-xs text-muted">
          Overlapping Scope deliverables are deduplicated into one commercial
          work unit. Recommended prices are preserved when you override.
        </p>
        <ul className="space-y-3">
          {lineItems.map((line) => (
            <li
              key={line.id}
              className="rounded-lg border border-border/60 bg-surface/30 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{line.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {effortBandLabel(line.effortBand as PricingEffortBand)} ·{" "}
                    {line.workType.replaceAll("_", " ")}
                    {line.isCustom ? " · Custom" : ""}
                    {line.isOverridden ? " · Overridden" : ""}
                  </p>
                  {line.sourceSectionTitles.length > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      Supports: {line.sourceSectionTitles.join(" · ")}
                    </p>
                  ) : null}
                  {line.recommendedUnitPriceCents != null ? (
                    <p className="mt-1 text-xs text-muted">
                      Recommended:{" "}
                      {formatUsdCents(line.recommendedUnitPriceCents)}
                      {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800">
                      Custom — enter a price before approval
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={line.isIncluded}
                      onChange={(e) =>
                        run(() =>
                          updatePricingLineItemAction(pricingId, line.id, {
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
                      checked={line.isOptional}
                      onChange={(e) =>
                        run(() =>
                          updatePricingLineItemAction(pricingId, line.id, {
                            isOptional: e.target.checked,
                          }),
                        )
                      }
                    />
                    Optional
                  </label>
                  <label className="flex items-center gap-1">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="w-14 rounded border border-border bg-white px-1 py-0.5"
                      defaultValue={line.quantity}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== line.quantity) {
                          run(() =>
                            updatePricingLineItemAction(pricingId, line.id, {
                              quantity: next,
                            }),
                          );
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="text-xs text-muted">
                  Final unit ($)
                  <input
                    className="mt-1 block w-28 rounded border border-border bg-white px-2 py-1 text-sm text-ink"
                    defaultValue={centsToDollarInput(line.finalUnitPriceCents)}
                    placeholder={line.isCustom ? "Required" : undefined}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      let cents: number | null = null;
                      if (raw.length > 0) {
                        const dollars = Number(raw);
                        if (!Number.isFinite(dollars)) {
                          return;
                        }
                        cents = Math.round(dollars * 100);
                      }
                      if (cents === line.finalUnitPriceCents) {
                        return;
                      }
                      const reasonInput = (
                        document.getElementById(
                          `override-reason-${line.id}`,
                        ) as HTMLInputElement | null
                      )?.value;
                      run(() =>
                        updatePricingLineItemAction(pricingId, line.id, {
                          finalUnitPriceCents: cents,
                          overrideReason: reasonInput ?? line.overrideReason,
                        }),
                      );
                    }}
                  />
                </label>
                <label className="min-w-[12rem] flex-1 text-xs text-muted">
                  Override reason
                  <input
                    id={`override-reason-${line.id}`}
                    className="mt-1 block w-full rounded border border-border bg-white px-2 py-1 text-sm text-ink"
                    defaultValue={line.overrideReason ?? ""}
                    placeholder="Required when changing recommended price"
                  />
                </label>
                <p className="text-sm font-medium text-ink">
                  {line.finalLineTotalCents != null
                    ? formatUsdCents(line.finalLineTotalCents)
                    : "—"}
                </p>
                {line.isCustom ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(() =>
                        removeCustomLineItemAction(pricingId, line.id),
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
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Add custom work
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded border border-border bg-white px-2 py-1 text-sm"
            placeholder="Custom deliverable title"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
          <input
            className="w-28 rounded border border-border bg-white px-2 py-1 text-sm"
            placeholder="Price $"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
          />
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              checked={customOptional}
              onChange={(e) => setCustomOptional(e.target.checked)}
            />
            Optional
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !customTitle.trim()}
            onClick={() => {
              const title = customTitle;
              const price = customPrice;
              const optional = customOptional;
              setCustomTitle("");
              setCustomPrice("");
              setCustomOptional(false);
              run(() =>
                addCustomLineItemAction(pricingId, title, price, optional),
              );
            }}
          >
            Add
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border/80 px-4 py-3 text-sm">
        <h3 className="font-heading text-base font-semibold text-brand">
          Totals
        </h3>
        {!completeness.isComplete ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Pricing is incomplete — {completeness.unpricedIncludedCount} included
            item(s) still need a price. Primary investment totals stay Incomplete
            until those are entered.
          </p>
        ) : null}
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Known priced work</dt>
            <dd>{formatUsdCents(completeness.knownPricedIncludedCents)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Unpriced included work</dt>
            <dd>
              {completeness.isComplete
                ? "None"
                : `${completeness.unpricedIncludedCount} item${
                    completeness.unpricedIncludedCount === 1 ? "" : "s"
                  }`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Recommended optional</dt>
            <dd>{formatUsdCents(recommendedOptionalCents)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Final optional</dt>
            <dd>{formatUsdCents(finalOptionalCents)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Recommended investment</dt>
            <dd className="font-medium">
              {completeness.isComplete
                ? formatUsdCents(recommendedTotalCents)
                : "Incomplete"}
              {completeness.isComplete && minimumApplied && !assessmentOnly
                ? ` (min ${formatUsdCents(minimumEngagementCents)})`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Final investment</dt>
            <dd className="font-semibold text-brand">
              {completeness.isComplete
                ? formatUsdCents(finalTotalCents)
                : "Incomplete"}
            </dd>
          </div>
        </dl>
        {assessmentOnly && completeness.isComplete ? (
          <p className="mt-2 text-xs text-muted">
            Assessment-only engagement — minimum engagement not applied.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">Notes</h3>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal pricing notes"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => updatePricingNotesAction(pricingId, notes))}
        >
          Save notes
        </Button>
      </section>

      <section className="flex flex-wrap gap-3">
        {status === "DRAFT" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => markPricingReviewedAction(pricingId))}
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Mark reviewed
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={isPending}
          onClick={() => run(() => approvePricingAction(pricingId))}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Approve pricing
        </Button>
        {!completeness.isComplete ? (
          <p className="w-full text-xs text-amber-800">
            Approval is blocked until all included work is priced.
          </p>
        ) : null}
      </section>
    </div>
  );
}
