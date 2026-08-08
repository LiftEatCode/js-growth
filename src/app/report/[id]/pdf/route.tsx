import { renderToBuffer } from "@react-pdf/renderer";

import { AuditReportPdf } from "@/components/website-audit/audit-report-pdf";
import { auditReportRepository } from "@/lib/website-audit/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await context.params;

  const report =
    await auditReportRepository.findById(id);

  if (!report) {
    return new Response(
      "Report not found.",
      {
        status: 404,
      },
    );
  }

  const pdf = await renderToBuffer(
    <AuditReportPdf report={report} />,
  );

  const filename =
    `website-growth-report-${report.hostname}`
      .replace(
        /[^a-zA-Z0-9.-]+/g,
        "-",
      )
      .toLowerCase();

  return new Response(new Uint8Array(pdf), {
    status: 200,

    headers: {
      "Content-Type":
        "application/pdf",

      "Content-Disposition":
        `attachment; filename="${filename}.pdf"`,

      "Cache-Control":
        "private, no-store",
    },
  });
}