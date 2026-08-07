import {
    summarizeReport,
  } from "./report";
  import type {
    AuditReportRepository,
  } from "./repository";
  import type {
    AuditReport,
    AuditReportSummary,
  } from "./types";
  
  const reports =
    new Map<string, AuditReport>();
  
  export class MemoryAuditReportRepository
    implements AuditReportRepository
  {
    async save(
      report: AuditReport,
    ): Promise<AuditReport> {
      reports.set(
        report.id,
        report,
      );
  
      return report;
    }
  
    async findById(
      id: string,
    ): Promise<AuditReport | null> {
      return reports.get(id) ?? null;
    }
  
    async list(): Promise<
      AuditReportSummary[]
    > {
      return Array.from(
        reports.values(),
      )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .map(summarizeReport);
    }
  
    async delete(
      id: string,
    ): Promise<boolean> {
      return reports.delete(id);
    }
  }