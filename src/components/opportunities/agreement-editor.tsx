"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveAgreementAction,
  markAgreementReviewedAction,
  updateAgreementPresentationAction,
} from "@/app/reports/opportunities/agreement-actions";
import { Button } from "@/components/ui";
import {
  AGREEMENT_PAYMENT_TERM_TYPES,
  agreementPaymentTermTypeLabel,
  type AgreementPaymentTermType,
} from "@/lib/commercialization/agreement/constants";

export interface AgreementEditorProps {
  agreementId: string;
  opportunityId: string;
  editable: boolean;
  status: string;
  initialTitle: string;
  initialEngagementOverview: string;
  initialClientResponsibilities: string[];
  initialJsResponsibilities: string[];
  initialTimelineTerms: string;
  initialChangeRequestTerms: string;
  initialThirdPartyCostTerms: string;
  initialResultsDisclaimer: string;
  initialAcceptanceLanguage: string;
  initialPaymentTermType: AgreementPaymentTermType;
  initialPaymentCustomText: string;
  initialDepositPercent: number;
}

function listToTextarea(items: string[]): string {
  return items.join("\n");
}

function textareaToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AgreementEditor({
  agreementId,
  opportunityId,
  editable,
  status,
  initialTitle,
  initialEngagementOverview,
  initialClientResponsibilities,
  initialJsResponsibilities,
  initialTimelineTerms,
  initialChangeRequestTerms,
  initialThirdPartyCostTerms,
  initialResultsDisclaimer,
  initialAcceptanceLanguage,
  initialPaymentTermType,
  initialPaymentCustomText,
  initialDepositPercent,
}: AgreementEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [engagementOverview, setEngagementOverview] = useState(
    initialEngagementOverview,
  );
  const [clientResponsibilities, setClientResponsibilities] = useState(
    listToTextarea(initialClientResponsibilities),
  );
  const [jsResponsibilities, setJsResponsibilities] = useState(
    listToTextarea(initialJsResponsibilities),
  );
  const [timelineTerms, setTimelineTerms] = useState(initialTimelineTerms);
  const [changeRequestTerms, setChangeRequestTerms] = useState(
    initialChangeRequestTerms,
  );
  const [thirdPartyCostTerms, setThirdPartyCostTerms] = useState(
    initialThirdPartyCostTerms,
  );
  const [resultsDisclaimer, setResultsDisclaimer] = useState(
    initialResultsDisclaimer,
  );
  const [acceptanceLanguage, setAcceptanceLanguage] = useState(
    initialAcceptanceLanguage,
  );
  const [paymentTermType, setPaymentTermType] = useState(
    initialPaymentTermType,
  );
  const [paymentCustomText, setPaymentCustomText] = useState(
    initialPaymentCustomText,
  );
  const [depositPercent, setDepositPercent] = useState(
    String(initialDepositPercent),
  );

  function presentationPayload() {
    return {
      opportunityId,
      agreementId,
      title,
      engagementOverview,
      clientResponsibilities: textareaToList(clientResponsibilities),
      jsResponsibilities: textareaToList(jsResponsibilities),
      timelineTerms,
      changeRequestTerms,
      thirdPartyCostTerms,
      resultsDisclaimer,
      acceptanceLanguage,
      paymentTermType,
      paymentCustomText:
        paymentTermType === "CUSTOM" ? paymentCustomText || null : null,
      depositPercent:
        paymentTermType === "DEPOSIT_AND_BALANCE"
          ? Number.parseInt(depositPercent, 10)
          : undefined,
    };
  }

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

  if (!editable) {
    return (
      <p className="text-sm text-muted">
        This Agreement is {status.toLowerCase()} and immutable. Scope, pricing,
        and included services cannot be edited here. Use Revise after updating
        upstream commercial approvals.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Presentation and terms fields only. Included services, quantities, and
        prices come from the approved Proposal snapshot and cannot be changed
        here.
      </p>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Title</span>
        <input
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Engagement overview
        </span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={engagementOverview}
          onChange={(e) => setEngagementOverview(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Client responsibilities (one per line)
        </span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={clientResponsibilities}
          onChange={(e) => setClientResponsibilities(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          JS Solutions responsibilities (one per line)
        </span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={jsResponsibilities}
          onChange={(e) => setJsResponsibilities(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Timeline terms</span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={timelineTerms}
          onChange={(e) => setTimelineTerms(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Change request terms
        </span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={changeRequestTerms}
          onChange={(e) => setChangeRequestTerms(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Third-party cost terms
        </span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={thirdPartyCostTerms}
          onChange={(e) => setThirdPartyCostTerms(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Results disclaimer
        </span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={resultsDisclaimer}
          onChange={(e) => setResultsDisclaimer(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Acceptance language
        </span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={acceptanceLanguage}
          onChange={(e) => setAcceptanceLanguage(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Payment term type</span>
        <select
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={paymentTermType}
          onChange={(e) =>
            setPaymentTermType(e.target.value as AgreementPaymentTermType)
          }
        >
          {AGREEMENT_PAYMENT_TERM_TYPES.map((type) => (
            <option key={type} value={type}>
              {agreementPaymentTermTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>

      {paymentTermType === "DEPOSIT_AND_BALANCE" ? (
        <label className="block space-y-1 text-sm">
          <span className="text-xs font-medium text-muted">
            Deposit percent
          </span>
          <input
            type="number"
            min={1}
            max={99}
            className="w-full rounded-lg border border-border bg-white px-3 py-2"
            value={depositPercent}
            onChange={(e) => setDepositPercent(e.target.value)}
          />
        </label>
      ) : null}

      {paymentTermType === "CUSTOM" ? (
        <label className="block space-y-1 text-sm">
          <span className="text-xs font-medium text-muted">
            Custom payment text
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2"
            value={paymentCustomText}
            onChange={(e) => setPaymentCustomText(e.target.value)}
          />
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() => updateAgreementPresentationAction(presentationPayload()))
          }
        >
          Save presentation
        </Button>
        {status === "DRAFT" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() =>
                markAgreementReviewedAction({ opportunityId, agreementId }),
              )
            }
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
        {status === "REVIEWED" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => approveAgreementAction({ opportunityId, agreementId }))
            }
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Approve agreement
          </Button>
        ) : null}
      </div>
    </div>
  );
}
