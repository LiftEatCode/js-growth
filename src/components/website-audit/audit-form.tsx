"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  SearchCheck,
} from "lucide-react";

import { auditWebsite } from "@/app/website-audit/actions";
import {
  Button,
  Card,
  Input,
} from "@/components/ui";
import type {
  WebsiteAuditResponse,
  WebsiteAuditSuccessResponse,
} from "@/lib/website-audit/types";

interface AuditFormProps {
  onAuditComplete: (
    result: WebsiteAuditSuccessResponse,
  ) => void;
}

const auditStatusMessages = [
  "Analyzing technical health…",
  "Discovering important pages…",
  "Reviewing service pages…",
  "Checking site-wide consistency…",
  "Analyzing conversion paths…",
  "Reviewing local visibility…",
] as const;

export function AuditForm({
  onAuditComplete,
}: AuditFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      let response: WebsiteAuditResponse;

      try {
        response = await auditWebsite(formData);
      } catch (submissionError) {
        console.error(
          "Website audit submission failed:",
          submissionError,
        );

        setError(
          "We could not complete the audit. Check the website address and try again.",
        );

        return;
      }

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      onAuditComplete(response);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={isPending}
      >
        <div className="space-y-2">
          <label
            htmlFor="website-audit-url"
            className="text-sm font-semibold text-brand"
          >
            Website URL
          </label>

          <div className="relative">
            <Globe2
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
            />

            <Input
              id="website-audit-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              value={url}
              onChange={(
                event: ChangeEvent<HTMLInputElement>,
              ) => setUrl(event.target.value)}
              disabled={isPending}
              aria-describedby={
                error
                  ? "website-audit-error"
                  : "website-audit-help"
              }
              aria-invalid={Boolean(error)}
              className="h-14 rounded-xl pl-12 pr-4 text-base"
              required
            />
          </div>

          <p
            id="website-audit-help"
            className="text-sm leading-6 text-muted"
          >
            Enter a public website URL. example.com is fine — you can leave off
            https://.
          </p>
        </div>

        {error ? (
          <div
            id="website-audit-error"
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />

            <span>{error}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="xl"
          disabled={isPending || !url.trim()}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
              />

              Running website audit…
            </>
          ) : (
            <>
              Run My Free Website Audit

              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </>
          )}
        </Button>
      </form>

      {isPending ? (
        <AuditProgress />
      ) : (
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5">
          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <CheckCircle2
              aria-hidden="true"
              className="size-4 text-emerald-600"
            />

            No credit card required
          </div>

          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <SearchCheck
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Read-only analysis
          </div>
        </div>
      )}
    </div>
  );
}

function AuditProgress() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex(
        (current) => (current + 1) % auditStatusMessages.length,
      );
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card
      variant="brand"
      padding="md"
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 animate-spin"
          />
        </span>

        <div>
          <p className="font-heading font-semibold text-brand">
            The audit is running
          </p>

          <p
            className="mt-1 text-sm leading-6 text-muted"
            aria-live="polite"
          >
            {auditStatusMessages[messageIndex]}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted">
        This usually takes a moment. We are reviewing public page signals —
        please keep this page open.
      </p>
    </Card>
  );
}