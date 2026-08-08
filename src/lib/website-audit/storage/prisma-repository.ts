import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { summarizeReport } from "./report";
import type { AuditReportRepository } from "./repository";
import type {
  AuditReport,
  AuditReportSummary,
} from "./types";

function toAuditReport(
  report: {
    id: string;
    version: number;
    createdAt: Date;
    website: string;
    hostname: string;
    reportMode: string;
    audit: Prisma.JsonValue;
  },
): AuditReport {
  return {
    id: report.id,
    version: report.version,
    createdAt: report.createdAt.toISOString(),
    website: report.website,
    hostname: report.hostname,
    reportMode:
      report.reportMode as AuditReport["reportMode"],
    audit:
      report.audit as unknown as AuditReport["audit"],
  };
}

export class PrismaAuditReportRepository
  implements AuditReportRepository
{
  async save(
    report: AuditReport,
  ): Promise<AuditReport> {
    const saved =
      await prisma.auditReport.upsert({
        where: {
          id: report.id,
        },

        update: {
          version: report.version,
          website: report.website,
          hostname: report.hostname,
          reportMode: report.reportMode,
          audit:
            report.audit as unknown as Prisma.InputJsonValue,
        },

        create: {
          id: report.id,
          version: report.version,
          createdAt: new Date(
            report.createdAt,
          ),
          website: report.website,
          hostname: report.hostname,
          reportMode: report.reportMode,
          audit:
            report.audit as unknown as Prisma.InputJsonValue,
        },
      });

    return toAuditReport(saved);
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

    return toAuditReport(report);
  }

  async list(): Promise<
    AuditReportSummary[]
  > {
    const reports =
      await prisma.auditReport.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return reports.map((report) =>
      summarizeReport(
        toAuditReport(report),
      ),
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