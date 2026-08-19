import { NextResponse } from "next/server";

import {
  buildProfessionalReport,
} from "@/lib/website-audit/professional-report";
import { canExposeAuditReportPublicly } from "@/lib/website-audit/report-source";
import {
  auditReportRepository,
} from "@/lib/website-audit/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return NextResponse.json(
      {
        error:
          "This development inspection route is disabled in production.",
      },
      {
        status: 404,
      },
    );
  }

  const { id } =
    await context.params;

  const report =
    await auditReportRepository.findById(
      id,
    );

  if (!report || !canExposeAuditReportPublicly(report.source)) {
    return NextResponse.json(
      {
        error:
          "Audit report not found.",
      },
      {
        status: 404,
      },
    );
  }

  const professionalReport =
    buildProfessionalReport(
      report.audit,
    );

  return NextResponse.json(
    professionalReport,
    {
      status: 200,
    },
  );
}