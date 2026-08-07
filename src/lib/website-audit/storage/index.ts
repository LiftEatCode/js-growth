import {
    MemoryAuditReportRepository,
  } from "./memory-repository";
  import type {
    AuditReportRepository,
  } from "./repository";
  
  const globalForAuditStorage =
    globalThis as unknown as {
      auditReportRepository?:
        AuditReportRepository;
    };
  
  export const auditReportRepository =
    globalForAuditStorage
      .auditReportRepository ??
    new MemoryAuditReportRepository();
  
  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    globalForAuditStorage
      .auditReportRepository =
      auditReportRepository;
  }
  
  export type {
    AuditReportRepository,
  } from "./repository";
  
  export type {
    AuditReport,
    AuditReportSummary,
  } from "./types";
  
  export {
    createAuditReport,
    summarizeReport,
  } from "./report";