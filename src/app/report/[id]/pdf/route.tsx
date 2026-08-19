import {
  createAuditReportPdfFilename,
  generateAuditReportPdf,
} from "@/lib/website-audit/pdf/generate-audit-report-pdf";
import { canServeProfessionalReportArtifact } from "@/lib/payments/report-artifacts";
import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { ensureAiInterpretationForEntitledReport } from "@/lib/website-audit/ai-interpretation/ensure";
import { canExposeAuditReportPublicly } from "@/lib/website-audit/report-source";
import { auditReportRepository } from "@/lib/website-audit/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  if (!report || !canExposeAuditReportPublicly(report.source)) {
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

  const entitled = await reportHasProfessionalEntitlement(report.id);
  const interpretation = entitled
    ? await ensureAiInterpretationForEntitledReport({
        reportId: report.id,
        audit: report.audit,
      })
    : null;

  const pdfBuffer = await generateAuditReportPdf(report, interpretation);
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
