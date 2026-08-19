import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getAuditGrade } from "@/lib/website-audit/grading";

import type { AuditReportRepository } from "./repository";
import type {
  AuditReport,
  AuditReportSummary,
} from "./types";

const auditReportSummarySelect = {
  id: true,
  createdAt: true,
  website: true,
  hostname: true,
  reportMode: true,
  overallScore: true,
  grade: true,
  criticalIssues: true,
  quickWins: true,
  opportunityScore: true,

  lead: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      contacted: true,
      status: true,
      followUpAt: true,
      notes: true,
    },
  },
} satisfies Prisma.AuditReportSelect;

type StoredAuditReport =
  Prisma.AuditReportGetPayload<object>;

type StoredAuditReportSummary =
  Prisma.AuditReportGetPayload<{
    select: typeof auditReportSummarySelect;
  }>;

function toAuditReport(
  report: StoredAuditReport,
): AuditReport {
  return {
    id: report.id,

    version: report.version,

    createdAt:
      report.createdAt.toISOString(),

    website: report.website,

    hostname: report.hostname,

    reportMode:
      report.reportMode as AuditReport["reportMode"],

    source:
      report.source === "PROSPECTING" ? "PROSPECTING" : "PUBLIC_FUNNEL",

    audit:
      report.audit as unknown as AuditReport["audit"],
  };
}

function toAuditReportSummary(
  report: StoredAuditReportSummary,
): AuditReportSummary {
  return {
    id: report.id,

    createdAt:
      report.createdAt.toISOString(),

    website: report.website,

    hostname: report.hostname,

    reportMode:
      report.reportMode as AuditReportSummary["reportMode"],

    overallScore:
      report.overallScore,

    grade:
      report.grade,

    criticalIssues:
      report.criticalIssues,

    quickWins:
      report.quickWins,

    opportunityScore:
      report.opportunityScore,

    lead: report.lead
      ? {
          id: report.lead.id,

          createdAt:
            report.lead.createdAt.toISOString(),

          updatedAt:
            report.lead.updatedAt.toISOString(),

          firstName:
            report.lead.firstName,

          lastName:
            report.lead.lastName,

          email:
            report.lead.email,

          phone:
            report.lead.phone,

          company:
            report.lead.company,

          contacted:
            report.lead.contacted,

          status:
            report.lead.status,

          followUpAt:
            report.lead.followUpAt?.toISOString() ??
            null,

          notes:
            report.lead.notes,
        }
      : null,
  };
}

export class PrismaAuditReportRepository
  implements AuditReportRepository
{
  async save(
    report: AuditReport,
  ): Promise<AuditReport> {
    const audit =
      report.audit;

    const grade =
      getAuditGrade(
        audit.overallScore,
      ).letter;

    const saved =
      await prisma.auditReport.upsert({
        where: {
          id: report.id,
        },

        update: {
          version:
            report.version,

          website:
            report.website,

          hostname:
            report.hostname,

          reportMode:
            report.reportMode,

          source:
            report.source === "PROSPECTING"
              ? "PROSPECTING"
              : "PUBLIC_FUNNEL",

          overallScore:
            audit.overallScore,

          grade,

          criticalIssues:
            audit.summary
              .criticalIssues,

          quickWins:
            audit.summary
              .quickWins,

          opportunityScore:
            audit.opportunity
              .score,

          audit:
            audit as unknown as Prisma.InputJsonValue,
        },

        create: {
          id:
            report.id,

          version:
            report.version,

          createdAt:
            new Date(
              report.createdAt,
            ),

          website:
            report.website,

          hostname:
            report.hostname,

          reportMode:
            report.reportMode,

          source:
            report.source === "PROSPECTING"
              ? "PROSPECTING"
              : "PUBLIC_FUNNEL",

          overallScore:
            audit.overallScore,

          grade,

          criticalIssues:
            audit.summary
              .criticalIssues,

          quickWins:
            audit.summary
              .quickWins,

          opportunityScore:
            audit.opportunity
              .score,

          audit:
            audit as unknown as Prisma.InputJsonValue,
        },
      });

    return toAuditReport(
      saved,
    );
  }

  async findById(
    id: string,
  ): Promise<AuditReport | null> {
    const report =
      await prisma.auditReport.findUnique({
        where: {
          id,
        },
      });

    if (!report) {
      return null;
    }

    return toAuditReport(
      report,
    );
  }

  async list(): Promise<
    AuditReportSummary[]
  > {
    const reports =
      await prisma.auditReport.findMany({
        where: {
          source: "PUBLIC_FUNNEL",
        },

        select:
          auditReportSummarySelect,

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return reports.map(
      toAuditReportSummary,
    );
  }

  async delete(
    id: string,
  ): Promise<boolean> {
    try {
      await prisma.auditReport.delete({
        where: {
          id,
        },
      });

      return true;
    } catch {
      return false;
    }
  }
}