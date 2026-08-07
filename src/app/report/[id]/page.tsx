import { notFound } from "next/navigation";

import { AuditResults } from "@/components/website-audit/audit-results";
import { auditReportRepository } from "@/lib/website-audit/storage";

interface ReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage({
  params,
}: ReportPageProps) {
  const { id } = await params;

  const report =
    await auditReportRepository.findById(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AuditResults
          result={report.audit}
          mode={report.reportMode}
        />
      </div>
    </main>
  );
}