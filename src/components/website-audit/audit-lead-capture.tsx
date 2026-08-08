"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { captureAuditLead } from "@/app/report/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditLeadCaptureProps {
  reportId: string;
  hostname: string;
}

export function AuditLeadCapture({
  reportId,
  hostname,
}: AuditLeadCaptureProps) {
  const [isPending, startTransition] =
    useTransition();

  const [error, setError] =
    useState<string | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [emailSent, setEmailSent] =
    useState(false);

  function handleSubmit(
    formData: FormData,
  ): void {
    setError(null);

    startTransition(async () => {
      const result =
        await captureAuditLead(
          reportId,
          formData,
        );

      if (!result.success) {
        setError(
          result.message ??
            "Something went wrong.",
        );

        return;
      }

      setEmailSent(
        result.emailSent ?? false,
      );

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Report request received
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {emailSent
                ? "Your professional report was emailed."
                : "Your professional report is ready."}
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              {emailSent ? (
                <>
                  We emailed your professional report for{" "}
                  <span className="font-medium text-foreground">
                    {hostname}
                  </span>
                  . You can also download a copy below.
                </>
              ) : (
                <>
                  Your request for{" "}
                  <span className="font-medium text-foreground">
                    {hostname}
                  </span>{" "}
                  was saved. The email could not be delivered,
                  but you can download the report below.
                </>
              )}
            </p>

            <Button
              className="mt-5"
              nativeButton={false}
              render={
                <a
                  href={`/report/${reportId}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <FileText
                aria-hidden="true"
                className="size-4"
              />

              Download professional PDF
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="lead-capture-heading"
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)_0,transparent_35%)] opacity-[0.05]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText
              aria-hidden="true"
              className="size-4"
            />

            Professional growth report
          </div>

          <h2
            id="lead-capture-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Get the full report for {hostname}
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Save your report and receive the professional
            version built for strategy review, internal
            discussion, and next-step planning.
          </p>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />

              <span>
                Complete audit findings and growth
                opportunities
              </span>
            </div>

            <div className="flex items-start gap-3">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />

              <span>
                Executive roadmap and business-impact
                analysis
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />

              <span>
                Professional PDF delivered by email
              </span>
            </div>
          </div>
        </div>

        <form
          action={handleSubmit}
          className="rounded-2xl border border-border bg-background p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="audit-lead-first-name"
                className="text-sm font-medium text-foreground"
              >
                First name
              </label>

              <Input
                id="audit-lead-first-name"
                name="firstName"
                autoComplete="given-name"
                className="mt-2"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label
                htmlFor="audit-lead-last-name"
                className="text-sm font-medium text-foreground"
              >
                Last name
              </label>

              <Input
                id="audit-lead-last-name"
                name="lastName"
                autoComplete="family-name"
                className="mt-2"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="audit-lead-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>

            <Input
              id="audit-lead-email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-2"
              required
              disabled={isPending}
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="audit-lead-company"
              className="text-sm font-medium text-foreground"
            >
              Company
            </label>

            <Input
              id="audit-lead-company"
              name="company"
              autoComplete="organization"
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="audit-lead-phone"
              className="text-sm font-medium text-foreground"
            >
              Phone{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <Input
              id="audit-lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="mt-2"
              disabled={isPending}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="mt-5 w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />

                Preparing your report
              </>
            ) : (
              <>
                <FileText
                  aria-hidden="true"
                  className="size-4"
                />

                Send my professional report
              </>
            )}
          </Button>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            We&apos;ll use this information to deliver the
            requested report and follow up about your website
            strategy. We do not sell your information.
          </p>
        </form>
      </div>
    </section>
  );
}