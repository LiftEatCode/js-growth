"use server";
import { getResendClient } from "@/lib/email/resend";
import { normalizeAcquisitionForPersistence } from "@/lib/growth/acquisition-capture";
import type { CampaignAttribution } from "@/lib/growth/attribution";
import { createContactSubmission } from "@/lib/growth/contact-submission-store";

import { contactFormSchema } from "@/lib/validations/contact";

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawData = {
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    service: formData.get("service"),
    budget: formData.get("budget"),
    message: formData.get("message"),
    companyWebsite: formData.get("companyWebsite"),
  };

  const result = contactFormSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const data = result.data;

  let attribution: CampaignAttribution | null = null;
  const rawAttribution = formData.get("growth_attribution");
  if (typeof rawAttribution === "string" && rawAttribution.trim()) {
    try {
      attribution = normalizeAcquisitionForPersistence(
        JSON.parse(rawAttribution),
      );
    } catch {
      attribution = null;
    }
  }

  // Honeypot spam protection.
  // Return a successful response without sending email when a bot fills this in.
  if (data.companyWebsite) {
    return {
      success: true,
      message: "Thank you. Your message has been sent.",
    };
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!process.env.RESEND_API_KEY || !fromEmail || !toEmail) {
    console.error("Missing Resend or contact email environment variables.");

    return {
      success: false,
      message: "The contact form is temporarily unavailable.",
    };
  }

  try {
    const resend = getResendClient();

    /*
     * Send the lead notification to JS Solutions.
     * replyTo allows you to reply directly to the prospective customer.
     */
    const { error: notificationError } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: data.email,
      subject: `New JS Solutions lead from ${data.name}`,
      text: buildLeadNotificationText(data, attribution),
      html: buildLeadNotificationHtml(data, attribution),
    });

    if (notificationError) {
      console.error(
        "Resend lead notification error:",
        notificationError
      );

      return {
        success: false,
        message: "Your message could not be sent. Please try again.",
      };
    }

    // First-party attribution persistence — must never block contact success.
    try {
      const persisted = await createContactSubmission({
        name: data.name,
        email: data.email,
        phone: data.phone,
        businessName: data.businessName,
        website: data.website,
        service: data.service,
        budget: data.budget,
        message: data.message,
        attribution,
      });
      if (!persisted.ok) {
        console.error("Contact attribution persist error:", persisted.error);
      }
    } catch (persistError) {
      console.error("Contact attribution persist error:", persistError);
    }

    /*
     * Send an automatic confirmation to the prospective customer.
     *
     * The lead notification has already been delivered at this point, so a
     * confirmation-email failure is logged without telling the customer that
     * their original submission failed.
     */
    const { error: confirmationError } = await resend.emails.send({
      from: fromEmail,
      to: data.email,
      replyTo: toEmail,
      subject: "We received your request — JS Solutions",
      text: buildCustomerConfirmationText(data),
      html: buildCustomerConfirmationHtml(data),
    });

    if (confirmationError) {
      console.error(
        "Resend customer confirmation error:",
        confirmationError
      );
    }

    return {
      success: true,
      message:
        "Thank you. Your request has been received, and we will be in touch soon.",
    };
  } catch (error) {
    console.error("Contact form error:", error);

    return {
      success: false,
      message: "Your message could not be sent. Please try again.",
    };
  }
}

type ContactFormData = {
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  website?: string;
  service: string;
  budget?: string;
  message: string;
  companyWebsite?: string;
};

function formatAttributionLine(attribution: CampaignAttribution | null): string {
  if (!attribution) {
    return "Attribution: (none captured)";
  }

  return [
    `Attribution source: ${attribution.source ?? "(none)"}`,
    `Attribution medium: ${attribution.medium ?? "(none)"}`,
    `Attribution campaign: ${attribution.campaign ?? "(none)"}`,
    `Attribution content: ${attribution.content ?? "(none)"}`,
    `Landing path: ${attribution.landingPath}`,
  ].join("\n");
}

function buildLeadNotificationText(
  data: ContactFormData,
  attribution: CampaignAttribution | null,
): string {
  return `
New website inquiry

Name: ${data.name}
Business: ${data.businessName || "Not provided"}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Website: ${data.website || "Not provided"}
Service: ${data.service}
Budget: ${data.budget || "Not provided"}

${formatAttributionLine(attribution)}

Message:
${data.message}
  `.trim();
}

function buildLeadNotificationHtml(
  data: ContactFormData,
  attribution: CampaignAttribution | null,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New JS Solutions Lead</title>
      </head>

      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div
          style="
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
          "
        >
          <div
            style="
              max-width: 680px;
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
                padding: 28px 32px;
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
                New website lead
              </h1>
            </div>

            <div style="padding: 32px;">
              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #4b5563;
                "
              >
                A prospective customer submitted the JS Solutions contact
                form.
              </p>

              <table
                role="presentation"
                style="
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 15px;
                "
              >
                <tbody>
                  ${buildTableRow("Name", data.name)}
                  ${buildTableRow(
                    "Business",
                    data.businessName || "Not provided"
                  )}
                  ${buildTableRow("Email", data.email)}
                  ${buildTableRow(
                    "Phone",
                    data.phone || "Not provided"
                  )}
                  ${buildTableRow(
                    "Website",
                    data.website || "Not provided"
                  )}
                  ${buildTableRow("Service", data.service)}
                  ${buildTableRow(
                    "Budget",
                    data.budget || "Not provided"
                  )}
                  ${buildTableRow(
                    "Campaign source",
                    attribution?.source || "Not captured"
                  )}
                  ${buildTableRow(
                    "Campaign medium",
                    attribution?.medium || "Not captured"
                  )}
                  ${buildTableRow(
                    "Campaign",
                    attribution?.campaign || "Not captured"
                  )}
                  ${buildTableRow(
                    "Landing path",
                    attribution?.landingPath || "Not captured"
                  )}
                </tbody>
              </table>

              <h2
                style="
                  margin: 32px 0 12px;
                  font-size: 20px;
                  line-height: 1.3;
                "
              >
                Project details
              </h2>

              <div
                style="
                  padding: 18px;
                  border-radius: 12px;
                  background-color: #f3f4f6;
                  color: #374151;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                ${escapeHtml(data.message).replace(/\n/g, "<br />")}
              </div>

              <div style="margin-top: 28px;">
                <a
                  href="mailto:${escapeHtml(data.email)}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    border-radius: 8px;
                    background-color: #111827;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                  "
                >
                  Reply to ${escapeHtml(data.name)}
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildCustomerConfirmationText(data: ContactFormData): string {
  return `
Hi ${data.name},

Thank you for contacting JS Solutions.

We received your request and will review the information you provided. We typically respond within one business day.

Your request:

Service: ${data.service}
Budget: ${data.budget || "Not provided"}

Message:
${data.message}

We appreciate the opportunity to learn more about your business.

JS Solutions
Grow your business. We build the systems.
  `.trim();
}

function buildCustomerConfirmationHtml(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>We received your request</title>
      </head>

      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
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
                We received your request.
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
                Hi ${escapeHtml(data.name)},
              </p>

              <p
                style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                Thank you for contacting
                <strong style="color: #111827;">JS Solutions</strong>.
                We received your project request and will review the
                information you provided.
              </p>

              <p
                style="
                  margin: 0 0 28px;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                We typically respond within one business day.
              </p>

              <div
                style="
                  padding: 20px;
                  border: 1px solid #e5e7eb;
                  border-radius: 12px;
                  background-color: #f9fafb;
                "
              >
                <h2
                  style="
                    margin: 0 0 16px;
                    font-size: 18px;
                    line-height: 1.3;
                  "
                >
                  Your request
                </h2>

                <p
                  style="
                    margin: 0 0 8px;
                    font-size: 15px;
                    line-height: 1.6;
                  "
                >
                  <strong>Service:</strong>
                  ${escapeHtml(data.service)}
                </p>

                <p
                  style="
                    margin: 0 0 18px;
                    font-size: 15px;
                    line-height: 1.6;
                  "
                >
                  <strong>Budget:</strong>
                  ${escapeHtml(data.budget || "Not provided")}
                </p>

                <p
                  style="
                    margin: 0 0 8px;
                    font-size: 15px;
                    font-weight: 700;
                    line-height: 1.6;
                  "
                >
                  Message:
                </p>

                <div
                  style="
                    font-size: 15px;
                    line-height: 1.7;
                    color: #4b5563;
                  "
                >
                  ${escapeHtml(data.message).replace(/\n/g, "<br />")}
                </div>
              </div>

              <p
                style="
                  margin: 28px 0 0;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #4b5563;
                "
              >
                We appreciate the opportunity to learn more about your
                business.
              </p>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                <strong>JS Solutions</strong><br />
                <span style="color: #6b7280;">
                  Grow your business. We build the systems.
                </span>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildTableRow(label: string, value: string): string {
  return `
    <tr>
      <td
        style="
          width: 130px;
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
} 