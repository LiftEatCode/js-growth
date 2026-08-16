import {
  createAuditReportPdfFilename,
  generateAuditReportPdf,
} from "@/lib/website-audit/pdf/generate-audit-report-pdf";
import { canServeProfessionalReportArtifact } from "@/lib/payments/report-artifacts";
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

  const report = await auditReportRepository.findById(id);

  if (!report) {
    return new Response("Report not found.", {
      status: 404,
    });
  }

  const canDownload = await canServeProfessionalReportArtifact({
    reportId: report.id,
    reportMode: report.reportMode,
  });

  if (!canDownload) {
    return new Response(
      "The professional PDF is available after the report is unlocked.",
      {
        status: 403,
      },
    );
  }

  const pdfBuffer = await generateAuditReportPdf(report);
  const filename = createAuditReportPdfFilename(report.hostname);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
