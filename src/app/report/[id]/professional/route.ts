import { NextResponse } from "next/server";

import { canServeProfessionalReportArtifact } from "@/lib/payments/report-artifacts";
import { buildProfessionalReport } from "@/lib/website-audit/professional-report";
import { auditReportRepository } from "@/lib/website-audit/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await context.params;
  const report = await auditReportRepository.findById(id);

  if (!report) {
    return NextResponse.json(
      {
        error: "Audit report not found.",
      },
      {
        status: 404,
      },
    );
  }

  const canAccess = await canServeProfessionalReportArtifact({
    reportId: report.id,
    reportMode: report.reportMode,
  });

  if (!canAccess) {
    return NextResponse.json(
      {
        error: "Professional report access is required.",
      },
      {
        status: 403,
      },
    );
  }

  const professionalReport = buildProfessionalReport(report.audit);

  return NextResponse.json(professionalReport, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
