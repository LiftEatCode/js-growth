import { getResendClient } from "@/lib/email/resend";
import {
  buildCustomerReportHtml,
  buildCustomerReportText,
  buildInternalLeadHtml,
  buildInternalLeadText,
} from "@/lib/email/templates/audit-report";
import type { AuditReport } from "@/lib/website-audit/storage";

interface SendAuditReportEmailInput {
  report: AuditReport;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  reportId: string;
  pdfBuffer: Buffer;
  filename: string;
}

export async function sendAuditReportEmail({
  report,
  firstName,
  lastName,
  email,
  phone,
  company,
  reportId,
  pdfBuffer,
  filename,
}: SendAuditReportEmailInput): Promise<boolean> {
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL;

  const internalEmail =
    process.env.CONTACT_TO_EMAIL;

  if (!fromEmail) {
    throw new Error(
      "Missing CONTACT_FROM_EMAIL",
    );
  }

  const resend =
    getResendClient();

  const {
    error: customerEmailError,
  } =
    await resend.emails.send({
      from: fromEmail,

      to: email,

      replyTo:
        internalEmail ??
        undefined,

      subject:
        `Your Website Growth Report for ${report.hostname}`,

      text: buildCustomerReportText({
        firstName,

        hostname:
          report.hostname,

        overallScore:
          report.audit.overallScore,

        opportunityScore:
          report.audit.opportunity.score,

        criticalIssues:
          report.audit.summary.criticalIssues,
      }),

      html: buildCustomerReportHtml({
        firstName,

        hostname:
          report.hostname,

        overallScore:
          report.audit.overallScore,

        opportunityScore:
          report.audit.opportunity.score,

        criticalIssues:
          report.audit.summary.criticalIssues,
      }),

      attachments: [
        {
          filename,

          content:
            pdfBuffer.toString(
              "base64",
            ),
        },
      ],
    });

  if (customerEmailError) {
    throw new Error(
      customerEmailError.message,
    );
  }

  if (internalEmail) {
    const {
      error: notificationError,
    } =
      await resend.emails.send({
        from: fromEmail,

        to: internalEmail,

        replyTo: email,

        subject:
          `New audit lead: ${report.hostname}`,

        text: buildInternalLeadText({
          firstName,
          lastName,
          email,
          phone,
          company,

          hostname:
            report.hostname,

          reportId,

          overallScore:
            report.audit.overallScore,

          opportunityScore:
            report.audit.opportunity.score,
        }),

        html: buildInternalLeadHtml({
          firstName,
          lastName,
          email,
          phone,
          company,

          hostname:
            report.hostname,

          reportId,

          overallScore:
            report.audit.overallScore,

          opportunityScore:
            report.audit.opportunity.score,
        }),
      });

    if (notificationError) {
      console.error(
        "Audit lead notification email failed:",
        notificationError,
      );
    }
  }

  return true;
}