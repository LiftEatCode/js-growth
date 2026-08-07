import type {
    AuditReport,
    AuditReportSummary,
  } from "./types";
  
  export interface AuditReportRepository {
    save(
      report: AuditReport,
    ): Promise<AuditReport>;
  
    findById(
      id: string,
    ): Promise<AuditReport | null>;
  
    list(): Promise<AuditReportSummary[]>;
  
    delete(
      id: string,
    ): Promise<boolean>;
  }