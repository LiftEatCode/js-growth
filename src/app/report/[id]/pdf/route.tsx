import {
  createAuditReportPdfFilename,
  generateAuditReportPdf,
} from "@/lib/website-audit/pdf/generate-audit-report-pdf";
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
  const { id } =
    await context.params;

  const report =
    await auditReportRepository.findById(
      id,
    );

  if (!report) {
    return new Response(
      "Report not found.",
      {
        status: 404,
      },
    );
  }

  const pdfBuffer =
    await generateAuditReportPdf(
      report,
    );

  const filename =
    createAuditReportPdfFilename(
      report.hostname,
    );

  return new Response(
    new Uint8Array(
      pdfBuffer,
    ),
    {
      status: 200,

      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Cache-Control":
          "private, no-store",
      },
    },
  );
}