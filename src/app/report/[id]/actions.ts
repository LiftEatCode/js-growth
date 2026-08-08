"use server";

import {
  createElement,
  type ReactElement,
} from "react";
import {
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import { revalidatePath } from "next/cache";

import { AuditReportPdf } from "@/components/website-audit/audit-report-pdf";
import { getResendClient } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { auditReportRepository } from "@/lib/website-audit/storage";

export interface CaptureLeadResult {
  success: boolean;
  message?: string;
  leadId?: string;
  emailSent?: boolean;
}

function normalizeString(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function createPdfFilename(
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

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function captureAuditLead(
  reportId: string,
  formData: FormData,
): Promise<CaptureLeadResult> {
  const firstName = normalizeString(
    formData.get("firstName"),
  );

  const lastName = normalizeString(
    formData.get("lastName"),
  );

  const email = normalizeString(
    formData.get("email"),
  ).toLowerCase();

  const phone =
    normalizeString(
      formData.get("phone"),
    ) || null;

  const company =
    normalizeString(
      formData.get("company"),
    ) || null;

  if (!reportId) {
    return {
      success: false,
      message:
        "A valid report is required.",
    };
  }

  if (!firstName) {
    return {
      success: false,
      message:
        "First name is required.",
    };
  }

  if (!lastName) {
    return {
      success: false,
      message:
        "Last name is required.",
    };
  }

  if (
    !email ||
    !isValidEmail(email)
  ) {
    return {
      success: false,
      message:
        "Enter a valid email address.",
    };
  }

  try {
    /*
     * Retrieve the persisted audit.
     */
    const report =
      await auditReportRepository.findById(
        reportId,
      );

    if (!report) {
      return {
        success: false,
        message:
          "The audit report could not be found.",
      };
    }

    /*
     * Save the lead and associate it with
     * the audit report.
     */
    const lead =
      await prisma.$transaction(
        async (transaction) => {
          const createdLead =
            await transaction.lead.create({
              data: {
                firstName,
                lastName,
                email,
                phone,
                company,
                website:
                  report.website,
              },
            });

          await transaction.auditReport.update({
            where: {
              id: reportId,
            },

            data: {
              leadId:
                createdLead.id,
            },
          });

          return createdLead;
        },
      );

    /*
     * Lead capture should still succeed even
     * if email delivery fails.
     *
     * The visitor can fall back to the direct
     * PDF download route.
     */
    let emailSent = false;

    try {
      const pdfBuffer =
        await renderToBuffer(
          createElement(AuditReportPdf, {
            report,
          }) as ReactElement<DocumentProps>,
        );

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

      const filename =
        createPdfFilename(
          report.hostname,
        );

      /*
       * Send the professional audit PDF
       * to the prospective customer.
       */
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
              report.audit
                .overallScore,
            opportunityScore:
              report.audit
                .opportunity.score,
            criticalIssues:
              report.audit.summary
                .criticalIssues,
          }),

          html: buildCustomerReportHtml({
            firstName,
            hostname:
              report.hostname,
            overallScore:
              report.audit
                .overallScore,
            opportunityScore:
              report.audit
                .opportunity.score,
            criticalIssues:
              report.audit.summary
                .criticalIssues,
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

      emailSent = true;

      /*
       * Send an internal notification too.
       *
       * We don't need another PDF attachment
       * here because the report already exists
       * in the JS Growth dashboard.
       */
      if (internalEmail) {
        const {
          error:
            notificationError,
        } =
          await resend.emails.send({
            from: fromEmail,

            to: internalEmail,

            replyTo: email,

            subject:
              `New audit lead: ${report.hostname}`,

            text:
              buildInternalLeadText({
                firstName,
                lastName,
                email,
                phone,
                company,
                hostname:
                  report.hostname,
                reportId,
                overallScore:
                  report.audit
                    .overallScore,
                opportunityScore:
                  report.audit
                    .opportunity
                    .score,
              }),

            html:
              buildInternalLeadHtml({
                firstName,
                lastName,
                email,
                phone,
                company,
                hostname:
                  report.hostname,
                reportId,
                overallScore:
                  report.audit
                    .overallScore,
                opportunityScore:
                  report.audit
                    .opportunity
                    .score,
              }),
          });

        if (notificationError) {
          console.error(
            "Audit lead notification email failed:",
            notificationError,
          );
        }
      }
    } catch (emailError) {
      console.error(
        "Audit report email failed:",
        emailError,
      );
    }

    revalidatePath(
      `/report/${reportId}`,
    );

    revalidatePath(
      "/reports",
    );

    return {
      success: true,

      leadId: lead.id,

      emailSent,

      message: emailSent
        ? "Your professional report was emailed successfully."
        : "Your information was saved, but the email could not be delivered. You can still download the report directly.",
    };
  } catch (error) {
    console.error(
      "Failed to capture audit lead:",
      error,
    );

    return {
      success: false,

      message:
        "We could not save your information. Please try again.",
    };
  }
}

interface CustomerReportEmailData {
  firstName: string;
  hostname: string;
  overallScore: number;
  opportunityScore: number;
  criticalIssues: number;
}

function buildCustomerReportText(
  data: CustomerReportEmailData,
): string {
  return `
Hi ${data.firstName},

Your Website Growth Report for ${data.hostname} is ready.

Website Score: ${data.overallScore}/100
Growth Opportunity Score: ${data.opportunityScore}/100
Critical Issues: ${data.criticalIssues}

Your professional report is attached to this email.

The report highlights the most important opportunities identified during the audit without giving away detailed implementation work.

If you would like help prioritizing or implementing these improvements, reply to this email and JS Solutions can walk through the findings with you.

JS Solutions
Grow your business. We build the systems.
  `.trim();
}

function buildCustomerReportHtml(
  data: CustomerReportEmailData,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>
          Your Website Growth Report
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        "
      >
        <div
          style="
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
          "
        >
          <div
            style="
              max-width: 640px;
              margin: 0 auto;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              background-color: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            "
          >
            <div
              style="
                padding: 32px;
                background-color: #111827;
                color: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 1.5px;
                  text-transform: uppercase;
                  color: #93c5fd;
                "
              >
                JS Solutions
              </p>

              <h1
                style="
                  margin: 0;
                  font-size: 28px;
                  line-height: 1.25;
                "
              >
                Your Website Growth Report
              </h1>
            </div>

            <div style="padding: 32px;">
              <p
                style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hi ${escapeHtml(
                  data.firstName,
                )},
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                Your professional website growth report
                for
                <strong style="color: #111827;">
                  ${escapeHtml(
                    data.hostname,
                  )}
                </strong>
                is ready and attached to this email.
              </p>

              <div
                style="
                  padding: 20px;
                  border: 1px solid #dbeafe;
                  border-radius: 12px;
                  background-color: #eff6ff;
                "
              >
                <table
                  role="presentation"
                  style="
                    width: 100%;
                    border-collapse: collapse;
                  "
                >
                  <tbody>
                    ${buildMetricRow(
                      "Website Score",
                      `${data.overallScore}/100`,
                    )}

                    ${buildMetricRow(
                      "Growth Opportunity",
                      `${data.opportunityScore}/100`,
                    )}

                    ${buildMetricRow(
                      "Critical Issues",
                      String(
                        data.criticalIssues,
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                The report highlights areas that may be
                limiting search visibility, website
                performance, and future growth.
              </p>

              <p
                style="
                  margin: 20px 0 0;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                If you&apos;d like help prioritizing or
                implementing these improvements, simply
                reply to this email.
              </p>

              <p
                style="
                  margin: 28px 0 0;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                <strong>
                  JS Solutions
                </strong>

                <br />

                <span
                  style="
                    color: #6b7280;
                  "
                >
                  Grow your business. We build the
                  systems.
                </span>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface InternalLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  hostname: string;
  reportId: string;
  overallScore: number;
  opportunityScore: number;
}

function buildInternalLeadText(
  data: InternalLeadData,
): string {
  return `
New website audit lead

Name: ${data.firstName} ${data.lastName}
Company: ${data.company ?? "Not provided"}
Email: ${data.email}
Phone: ${data.phone ?? "Not provided"}
Website: ${data.hostname}

Website Score: ${data.overallScore}/100
Opportunity Score: ${data.opportunityScore}/100

Report ID:
${data.reportId}
  `.trim();
}

function buildInternalLeadHtml(
  data: InternalLeadData,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        "
      >
        <div
          style="
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
          "
        >
          <div
            style="
              max-width: 640px;
              margin: 0 auto;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              overflow: hidden;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            "
          >
            <div
              style="
                padding: 28px 32px;
                background-color: #111827;
                color: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  color: #93c5fd;
                  font-size: 12px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                "
              >
                JS Solutions
              </p>

              <h1
                style="
                  margin: 0;
                  font-size: 26px;
                "
              >
                New audit lead
              </h1>
            </div>

            <div style="padding: 32px;">
              <table
                role="presentation"
                style="
                  width: 100%;
                  border-collapse: collapse;
                "
              >
                <tbody>
                  ${buildMetricRow(
                    "Name",
                    `${data.firstName} ${data.lastName}`,
                  )}

                  ${buildMetricRow(
                    "Company",
                    data.company ??
                      "Not provided",
                  )}

                  ${buildMetricRow(
                    "Email",
                    data.email,
                  )}

                  ${buildMetricRow(
                    "Phone",
                    data.phone ??
                      "Not provided",
                  )}

                  ${buildMetricRow(
                    "Website",
                    data.hostname,
                  )}

                  ${buildMetricRow(
                    "Website Score",
                    `${data.overallScore}/100`,
                  )}

                  ${buildMetricRow(
                    "Opportunity",
                    `${data.opportunityScore}/100`,
                  )}
                </tbody>
              </table>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 13px;
                  color: #6b7280;
                "
              >
                Report ID:
                ${escapeHtml(
                  data.reportId,
                )}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildMetricRow(
  label: string,
  value: string,
): string {
  return `
    <tr>
      <td
        style="
          width: 170px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 700;
          vertical-align: top;
        "
      >
        ${escapeHtml(label)}
      </td>

      <td
        style="
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
          vertical-align: top;
        "
      >
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}