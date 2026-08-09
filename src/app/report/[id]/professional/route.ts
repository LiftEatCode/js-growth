import { NextResponse } from "next/server";

import {
  buildProfessionalReport,
} from "@/lib/website-audit/professional-report";
import {
  auditReportRepository,
} from "@/lib/website-audit/storage";

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
  const { id } =
    await context.params;

  const report =
    await auditReportRepository.findById(
      id,
    );

  if (!report) {
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

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}