import type {
    AuditCategory,
    AuditPriority,
    BusinessImpact,
    OpportunityConfidence,
  } from "@/lib/website-audit/types";
  
  export const PROFESSIONAL_REPORT_VERSION = 1;
  
  export type ProfessionalReportHealth =
    | "excellent"
    | "strong"
    | "moderate"
    | "weak"
    | "critical";
  
  export type ProfessionalReportUrgency =
    | "low"
    | "medium"
    | "high"
    | "urgent";
  
  export type ProfessionalReportTimeframe =
    | "immediate"
    | "30-days"
    | "60-days"
    | "90-days";
  
  export type ProfessionalReportEffort =
    | "low"
    | "medium"
    | "high";
  
  export type ProfessionalReportConfidence =
    OpportunityConfidence;
  
  export interface ProfessionalReportExecutiveSummary {
    headline: string;
  
    summary: string;
  
    overallHealth: ProfessionalReportHealth;
  
    biggestOpportunity: string;
  
    biggestRisk: string;
  
    recommendedFocus: string;
  }
  
  export interface ProfessionalReportBusinessImpact {
    headline: string;
  
    summary: string;
  
    visibilityImpact: string;
  
    leadGenerationImpact: string;
  
    trustImpact: string;
  
    growthImpact: string;
  
    urgency: ProfessionalReportUrgency;
  }
  
  export interface ProfessionalReportStrength {
    id: string;
  
    title: string;
  
    description: string;
  
    category: AuditCategory;
  }
  
  export interface ProfessionalReportWeakness {
    id: string;
  
    title: string;
  
    description: string;
  
    businessImpact: string;
  
    category: AuditCategory;
  
    priority: AuditPriority;
  }
  
  export interface ProfessionalReportQuickWin {
    id: string;
  
    title: string;
  
    description: string;
  
    businessValue: string;
  
    category: AuditCategory;
  
    estimatedMinutes: number;
  }
  
  export interface ProfessionalReportStrategicOpportunity {
    id: string;
  
    title: string;
  
    description: string;
  
    businessValue: string;
  
    category: AuditCategory;
  
    businessImpact: BusinessImpact;
  
    effort: ProfessionalReportEffort;
  
    confidence: ProfessionalReportConfidence;
  }
  
  export interface ProfessionalReportRoadmapItem {
    id: string;
  
    title: string;
  
    description: string;
  
    businessReason: string;
  
    category: AuditCategory;
  
    timeframe: ProfessionalReportTimeframe;
  
    priority: AuditPriority;
  }
  
  export interface ProfessionalReportRoadmap {
    immediate: ProfessionalReportRoadmapItem[];
  
    thirtyDays: ProfessionalReportRoadmapItem[];
  
    sixtyDays: ProfessionalReportRoadmapItem[];
  
    ninetyDays: ProfessionalReportRoadmapItem[];
  }
  
  export interface ProfessionalReportCategoryInsight {
    category: AuditCategory;
  
    label: string;
  
    score: number;
  
    maxScore: number;
  
    health: ProfessionalReportHealth;
  
    summary: string;
  
    businessImpact: string;
  }
  
  export interface ProfessionalReportOpportunitySummary {
    score: number;
  
    headline: string;
  
    summary: string;
  
    confidence: ProfessionalReportConfidence;
  }
  
  export interface ProfessionalReportClosingSummary {
    headline: string;
  
    summary: string;
  
    nextStep: string;
  }
  
  export interface ProfessionalReport {
    version: number;
  
    generatedAt: string;
  
    website: string;
  
    hostname: string;
  
    overallScore: number;
  
    executiveSummary: ProfessionalReportExecutiveSummary;
  
    businessImpact: ProfessionalReportBusinessImpact;
  
    strengths: ProfessionalReportStrength[];
  
    weaknesses: ProfessionalReportWeakness[];
  
    quickWins: ProfessionalReportQuickWin[];
  
    strategicOpportunities: ProfessionalReportStrategicOpportunity[];
  
    categoryInsights: ProfessionalReportCategoryInsight[];
  
    opportunity: ProfessionalReportOpportunitySummary;
  
    priorityRoadmap: ProfessionalReportRoadmap;
  
    closingSummary: ProfessionalReportClosingSummary;
  }