import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  SearchCheck,
} from "lucide-react";

import { AuditResults } from "@/components/website-audit/audit-results";
import {
  Button,
  Container,
} from "@/components/ui";
import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { auditReportRepository } from "@/lib/website-audit/storage";

interface ReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { id } = await params;

  const report =
    await auditReportRepository.findById(
      id,
    );

  if (!report) {
    return {
      title: "Website Audit Report",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `Website Audit Report - ${report.hostname}`,
    description: `Website growth audit and improvement report for ${report.hostname}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReportPage({
  params,
}: ReportPageProps) {
  const { id } = await params;

  const report =
    await auditReportRepository.findById(
      id,
    );

  if (!report) {
    notFound();
  }

  const professionallyUnlocked =
    await reportHasProfessionalEntitlement(report.id);

  return (
    <main className="min-h-screen bg-slate-50/60">
      <div className="border-b border-border bg-white">
        <Container className="py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <FileText
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
                  <SearchCheck
                    aria-hidden="true"
                    className="size-3.5"
                  />

                  Website Growth Audit
                </div>

                <p className="mt-1 font-heading font-semibold text-brand">
                  {report.hostname}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/website-audit" />
              }
            >
              <ArrowLeft
                aria-hidden="true"
                className="size-4"
              />

              Run Another Audit
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-8 sm:py-10 lg:py-12">
        <AuditResults
          result={report.audit}
          mode={report.reportMode}
          reportId={report.id}
          professionallyUnlocked={professionallyUnlocked}
        />
      </Container>
    </main>
  );
}