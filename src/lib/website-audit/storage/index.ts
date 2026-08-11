import { PrismaAuditReportRepository } from "./prisma-repository";

export const auditReportRepository =
  new PrismaAuditReportRepository();

export type {
  AuditReportRepository,
} from "./repository";

export type {
  AuditLeadStatus,
  AuditReport,
  AuditReportLeadSummary,
  AuditReportSummary,
} from "./types";

export {
  createAuditReport,
  summarizeReport,
} from "./report";