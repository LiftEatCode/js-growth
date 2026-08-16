import {
  createElement,
  type ReactElement,
} from "react";
import {
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";

import { AuditReportPdf } from "@/components/website-audit/pdf/audit-report-pdf";
import type { AiInterpretationView } from "@/lib/website-audit/ai-interpretation/types";
import type { AuditReport } from "@/lib/website-audit/storage";

export async function generateAuditReportPdf(
  report: AuditReport,
  interpretation?: AiInterpretationView | null,
): Promise<Buffer> {
  return renderToBuffer(
    createElement(AuditReportPdf, {
      report,
      interpretation,
    }) as ReactElement<DocumentProps>,
  );
}

export function createAuditReportPdfFilename(
  hostname: string,
): string {
  const safeHostname = hostname
    .replace(
      /[^a-zA-Z0-9.-]+/g,
      "-",
    )
    .toLowerCase();

  return `website-growth-report-${safeHostname}.pdf`;
}