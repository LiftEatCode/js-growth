"use server";

import { revalidatePath } from "next/cache";

import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { getResendClient } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { resolveReportTier } from "@/lib/website-audit/report-access";
import {
  buildCustomerReportHtml,
  buildCustomerReportText,
  buildInternalLeadHtml,
  buildInternalLeadText,
} from "@/lib/website-audit/email/report-emails";
import {
  createAuditReportPdfFilename,
  generateAuditReportPdf,
} from "@/lib/website-audit/pdf/generate-audit-report-pdf";
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

    let emailSent = false;

    try {
      const professionallyUnlocked =
        await reportHasProfessionalEntitlement(reportId);
      const canAttachProfessionalPdf =
        resolveReportTier({
          mode: report.reportMode,
          professionallyUnlocked,
        }) === "professional";

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

      const customerEmailData = {
        firstName,
        hostname:
          report.hostname,
        overallScore:
          report.audit.overallScore,
        opportunityScore:
          report.audit.opportunity
            .score,
        criticalIssues:
          report.audit.summary
            .criticalIssues,
        quickWins:
          report.audit.summary
            .quickWins,
        highImpactFindings:
          report.audit.summary
            .highImpactFindings,
      };

      const attachments: Array<{
        filename: string;
        content: string;
      }> = [];

      if (canAttachProfessionalPdf) {
        const pdfBuffer =
          await generateAuditReportPdf(
            report,
          );

        attachments.push({
          filename:
            createAuditReportPdfFilename(
              report.hostname,
            ),
          content: pdfBuffer.toString(
            "base64",
          ),
        });
      }

      const {
        error:
          customerEmailError,
      } =
        await resend.emails.send({
          from: fromEmail,

          to: email,

          replyTo:
            internalEmail ??
            undefined,

          subject:
            `Your Website Growth Report for ${report.hostname}`,

          text:
            buildCustomerReportText(
              customerEmailData,
            ),

          html:
            buildCustomerReportHtml(
              customerEmailData,
            ),

          attachments:
            attachments.length > 0
              ? attachments
              : undefined,
        });

      if (customerEmailError) {
        throw new Error(
          customerEmailError.message,
        );
      }

      emailSent = true;

      if (internalEmail) {
        const internalLeadData = {
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
            report.audit.opportunity
              .score,
          criticalIssues:
            report.audit.summary
              .criticalIssues,
        };

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
              buildInternalLeadText(
                internalLeadData,
              ),

            html:
              buildInternalLeadHtml(
                internalLeadData,
              ),
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
        ? "Your information was emailed successfully."
        : "Your information was saved, but the email could not be delivered. You can still view the report on this page.",
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