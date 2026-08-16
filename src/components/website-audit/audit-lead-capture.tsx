"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  CheckCircle2,
  FileDown,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { captureAuditLead } from "@/app/report/[id]/actions";
import {
  Button,
  Input,
} from "@/components/ui";

interface AuditLeadCaptureProps {
  reportId: string;
  hostname: string;
  canDownloadPdf?: boolean;
}

export function AuditLeadCapture({
  reportId,
  hostname,
  canDownloadPdf = false,
}: AuditLeadCaptureProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    emailSent,
    setEmailSent,
  ] = useState(false);

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
        result.emailSent ??
          false,
      );

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <section className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600 shadow-sm">
              <CheckCircle2
                aria-hidden="true"
                className="size-6"
              />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Report Ready
              </p>

              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
                {emailSent
                  ? "Your details were emailed."
                  : "Your details were saved."}
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-muted">
                {emailSent ? (
                  <>
                    We saved your information for{" "}
                    <span className="font-semibold text-brand">
                      {hostname}
                    </span>{" "}
                    and sent a confirmation email.
                    {canDownloadPdf
                      ? " You can also download the professional report now."
                      : " You can return to this report anytime using the saved link."}
                  </>
                ) : (
                  <>
                    Your request for{" "}
                    <span className="font-semibold text-brand">
                      {hostname}
                    </span>{" "}
                    was saved. Email
                    delivery was not
                    completed, but your
                    report is still available
                    on this page.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {canDownloadPdf ? (
        <div className="p-6 sm:p-8">
          <Button
            size="lg"
            nativeButton={false}
            render={
              <a
                href={`/report/${reportId}/pdf`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <FileDown
              aria-hidden="true"
              className="size-4"
            />

            Download Professional PDF
          </Button>
        </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="lead-capture-heading"
      className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand text-white shadow-soft"
    >
      <div
        aria-hidden="true"
        className="absolute -right-28 -top-32 size-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-36 -left-24 size-[26rem] rounded-full bg-brand-cyan/10 blur-3xl"
      />

      <div className="relative grid lg:grid-cols-[1fr_430px]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            <FileText
              aria-hidden="true"
              className="size-3.5"
            />

            Professional Growth Report
          </div>

          <h2
            id="lead-capture-heading"
            className="mt-5 max-w-2xl font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Keep the full report for{" "}
            {hostname}.
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Get a professional PDF you can save, share internally, and use when planning the next round of website improvements.
          </p>

          <div className="mt-8 space-y-4">
            <ReportBenefit
              icon={LockKeyhole}
              title="Complete audit findings"
              description="Keep the full website analysis and identified growth opportunities in one report."
            />

            <ReportBenefit
              icon={FileText}
              title="Strategy and roadmap"
              description="Use the prioritized findings and improvement roadmap for planning and internal discussion."
            />

            <ReportBenefit
              icon={Mail}
              title="Delivered by email"
              description="Receive the professional report directly in your inbox with a downloadable PDF copy."
            />
          </div>

          <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-400">
            <ShieldCheck
              aria-hidden="true"
              className="size-4 text-cyan-300"
            />

            Your information is used to deliver the requested report and follow up about your website strategy.
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Send My Report
          </p>

          <h3 className="mt-2 font-heading text-xl font-semibold text-white">
            Where should we send it?
          </h3>

          <form
            action={handleSubmit}
            className="mt-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <LeadField
                id="audit-lead-first-name"
                label="First name"
              >
                <Input
                  id="audit-lead-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  disabled={
                    isPending
                  }
                  className="border-white/15 bg-white text-brand"
                />
              </LeadField>

              <LeadField
                id="audit-lead-last-name"
                label="Last name"
              >
                <Input
                  id="audit-lead-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  disabled={
                    isPending
                  }
                  className="border-white/15 bg-white text-brand"
                />
              </LeadField>
            </div>

            <div className="mt-4">
              <LeadField
                id="audit-lead-email"
                label="Email"
              >
                <Input
                  id="audit-lead-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={
                    isPending
                  }
                  className="border-white/15 bg-white text-brand"
                />
              </LeadField>
            </div>

            <div className="mt-4">
              <LeadField
                id="audit-lead-company"
                label="Company"
                optional
              >
                <Input
                  id="audit-lead-company"
                  name="company"
                  autoComplete="organization"
                  disabled={
                    isPending
                  }
                  className="border-white/15 bg-white text-brand"
                />
              </LeadField>
            </div>

            <div className="mt-4">
              <LeadField
                id="audit-lead-phone"
                label="Phone"
                optional
              >
                <Input
                  id="audit-lead-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  disabled={
                    isPending
                  }
                  className="border-white/15 bg-white text-brand"
                />
              </LeadField>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />

                  Preparing Report…
                </>
              ) : (
                <>
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                  />

                  Email My Professional Report
                </>
              )}
            </Button>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              We do not sell your contact information.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

interface ReportBenefitProps {
  icon: typeof FileText;
  title: string;
  description: string;
}

function ReportBenefit({
  icon: Icon,
  title,
  description,
}: ReportBenefitProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-300">
        <Icon
          aria-hidden="true"
          className="size-4"
        />
      </span>

      <div>
        <p className="font-heading font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

interface LeadFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}

function LeadField({
  id,
  label,
  optional = false,
  children,
}: LeadFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-200"
      >
        {label}

        {optional ? (
          <span className="ml-1 font-normal text-slate-400">
            (optional)
          </span>
        ) : null}
      </label>

      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}