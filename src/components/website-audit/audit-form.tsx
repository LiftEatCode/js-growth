"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Globe2,
  LoaderCircle,
} from "lucide-react";

import { auditWebsite } from "@/app/website-audit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  WebsiteAuditResponse,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditFormProps {
  onAuditComplete: (result: WebsiteAuditResult) => void;
}

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
          "The audit could not be completed. Please try again.",
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label
          htmlFor="website-audit-url"
          className="text-sm font-medium text-foreground"
        >
          Website URL
        </label>

        <div className="relative">
          <Globe2
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            id="website-audit-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            value={url}
            onChange={(event) =>
              setUrl(event.target.value)
            }
            disabled={isPending}
            aria-describedby={
              error
                ? "website-audit-error"
                : "website-audit-help"
            }
            aria-invalid={Boolean(error)}
            className="h-12 pl-10 text-base"
            required
          />
        </div>

        <p
          id="website-audit-help"
          className="text-sm text-muted-foreground"
        >
          Enter a public homepage URL. You can leave off
          the https:// prefix.
        </p>
      </div>

      {error ? (
        <div
          id="website-audit-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />

          <span>{error}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isPending || !url.trim()}
        className="h-12 w-full px-5 sm:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
            />
            Auditing website…
          </>
        ) : (
          <>
            Run free audit
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-xs leading-5 text-muted-foreground">
        The MVP analyzes the submitted homepage&apos;s
        HTML, metadata, technical setup, accessibility
        signals, and local business signals. It does not
        modify the website.
      </p>
    </form>
  );
}