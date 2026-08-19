import "server-only";

import { prisma } from "@/lib/prisma";
import type { OutreachOutcomeValue } from "@/lib/prospecting/outreach/outcome-types";
import {
  computeCampaignFunnelMetrics,
  type CampaignFunnelMetrics,
  type CampaignFunnelProspectRow,
} from "@/lib/prospecting/metrics/campaign-funnel";

export async function loadCampaignFunnelMetrics(
  campaignId: string,
): Promise<CampaignFunnelMetrics> {
  const [discovered, memberships] = await Promise.all([
    prisma.prospectDiscoveryCandidate.count({
      where: {
        discoveryRun: { campaignId },
      },
    }),
    prisma.campaignProspect.findMany({
      where: { campaignId },
      include: {
        prospect: {
          include: {
            contacts: {
              where: { isPrimary: true },
              select: { status: true },
            },
            contactForms: {
              where: { isPrimary: true },
              select: { status: true },
            },
            outreachMessages: {
              where: { campaignId },
              select: { status: true, channel: true },
            },
            outreachOutcomes: {
              select: { outcome: true },
            },
          },
        },
      },
    }),
  ]);

  const rows: CampaignFunnelProspectRow[] = memberships.map((membership) => {
    const prospect = membership.prospect;
    const messages = prospect.outreachMessages;

    return {
      prospectId: prospect.id,
      qualificationStatus: prospect.qualificationStatus,
      outreachStatus: prospect.outreachStatus,
      isSelectedTopN: membership.isSelectedTopN,
      auditReportId: prospect.auditReportId,
      leadId: prospect.leadId,
      hasPrimaryEmail: prospect.contacts.some(
        (contact) =>
          contact.status === "DISCOVERED" || contact.status === "SELECTED",
      ),
      hasPrimaryContactForm: prospect.contactForms.some(
        (form) => form.status === "DISCOVERED" || form.status === "SELECTED",
      ),
      hasDraft: messages.length > 0,
      hasApprovedDraft: messages.some(
        (message) =>
          message.status === "APPROVED" ||
          message.status === "SENT" ||
          message.status === "SUBMITTED" ||
          message.status === "SENDING",
      ),
      hasEmailSent: messages.some(
        (message) => message.channel === "EMAIL" && message.status === "SENT",
      ),
      hasFormSubmitted: messages.some(
        (message) =>
          message.channel === "CONTACT_FORM" && message.status === "SUBMITTED",
      ),
      outcomes: prospect.outreachOutcomes.map(
        (row) => row.outcome as OutreachOutcomeValue,
      ),
    };
  });

  return computeCampaignFunnelMetrics({
    discovered,
    rows,
  });
}

export async function loadProspectSuppressionState(input: {
  hostname: string | null;
  emails: string[];
}): Promise<{
  hostnameSuppressed: boolean;
  emailSuppressed: string[];
  customerHostname: boolean;
}> {
  const emails = [...new Set(input.emails.map((email) => email.toLowerCase()))];
  const hostname = input.hostname?.toLowerCase() ?? null;

  if (!hostname && emails.length === 0) {
    return {
      hostnameSuppressed: false,
      emailSuppressed: [],
      customerHostname: false,
    };
  }

  const entries = await prisma.suppressionEntry.findMany({
    where: {
      OR: [
        hostname ? { type: "HOSTNAME", value: hostname } : undefined,
        emails.length > 0
          ? { type: "EMAIL", value: { in: emails } }
          : undefined,
      ].filter(Boolean) as Array<
        | { type: "HOSTNAME"; value: string }
        | { type: "EMAIL"; value: { in: string[] } }
      >,
    },
    select: {
      type: true,
      value: true,
      reason: true,
    },
  });

  const emailSuppressed: string[] = [];
  let hostnameSuppressed = false;
  let customerHostname = false;

  for (const entry of entries) {
    if (entry.type === "HOSTNAME" && entry.value === hostname) {
      hostnameSuppressed = true;

      if (entry.reason === "CUSTOMER") {
        customerHostname = true;
      }
    }

    if (entry.type === "EMAIL" && emails.includes(entry.value)) {
      emailSuppressed.push(entry.value);
    }
  }

  return {
    hostnameSuppressed,
    emailSuppressed,
    customerHostname,
  };
}
