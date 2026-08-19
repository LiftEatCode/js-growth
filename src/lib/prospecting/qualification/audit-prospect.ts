import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import { runDeterministicWebsiteAudit } from "@/lib/website-audit/run-deterministic-audit";
import {
  auditReportRepository,
  createAuditReport,
} from "@/lib/website-audit/storage";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import { isReusableProspectingAudit } from "./limit";

export type ProspectAuditAttempt =
  | {
      ok: true;
      audit: WebsiteAuditResult;
      reportId: string;
      reused: boolean;
    }
  | {
      ok: false;
      code: "invalid-website" | "audit-failed";
      message: string;
    };

export async function auditProspectWebsite(options: {
  prospectId: string;
  website: string | null;
  linkedReportId: string | null;
  force?: boolean;
}): Promise<ProspectAuditAttempt> {
  const hostname = tryNormalizeProspectHostname(options.website);

  if (!options.website || !hostname) {
    return {
      ok: false,
      code: "invalid-website",
      message: "This prospect does not have a usable public website.",
    };
  }

  if (!options.force && options.linkedReportId) {
    const existing = await prisma.auditReport.findUnique({
      where: { id: options.linkedReportId },
    });

    if (
      existing &&
      isReusableProspectingAudit({
        source: existing.source,
        createdAt: existing.createdAt,
      })
    ) {
      return {
        ok: true,
        audit: existing.audit as unknown as WebsiteAuditResult,
        reportId: existing.id,
        reused: true,
      };
    }
  }

  const deterministic = await runDeterministicWebsiteAudit(options.website);

  if (!deterministic.success) {
    return {
      ok: false,
      code: "audit-failed",
      message: deterministic.error.message,
    };
  }

  const report = createAuditReport(deterministic.audit, "consultation", {
    source: "PROSPECTING",
  });

  await auditReportRepository.save(report);

  await prisma.prospect.update({
    where: { id: options.prospectId },
    data: {
      auditReportId: report.id,
    },
  });

  return {
    ok: true,
    audit: deterministic.audit,
    reportId: report.id,
    reused: false,
  };
}

export async function loadQualificationBlockers(options: {
  hostname: string | null;
}): Promise<{
  suppressed: boolean;
  customerSuppressed: boolean;
  existingLead: boolean;
}> {
  if (!options.hostname) {
    return {
      suppressed: false,
      customerSuppressed: false,
      existingLead: false,
    };
  }

  const [suppressions, leads] = await Promise.all([
    prisma.suppressionEntry.findMany({
      where: {
        type: "HOSTNAME",
        value: options.hostname,
      },
      select: { reason: true },
    }),
    prisma.lead.findMany({
      where: {
        website: {
          contains: options.hostname,
          mode: "insensitive",
        },
      },
      select: { website: true },
      take: 20,
    }),
  ]);

  const existingLead = leads.some((lead) => {
    const hostname = tryNormalizeProspectHostname(lead.website);
    return hostname === options.hostname;
  });

  return {
    suppressed: suppressions.length > 0,
    customerSuppressed: suppressions.some((entry) => entry.reason === "CUSTOMER"),
    existingLead,
  };
}

export function qualificationJsonValue(
  value: object,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
