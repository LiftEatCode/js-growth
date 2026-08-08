import {
  createElement,
  type ReactElement,
} from "react";
import {
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";

import { AuditReportPdf } from "@/components/website-audit/pdf/audit-report-pdf";
import type { AuditReport } from "@/lib/website-audit/storage";

export async function generateAuditReportPdf(
  report: AuditReport,
): Promise<Buffer> {
  return renderToBuffer(
    createElement(AuditReportPdf, {
      report,
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