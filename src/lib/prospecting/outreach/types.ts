export interface OutreachFindingContext {
  title: string;
  category: string;
  whyItMatters: string;
  evidence: string;
  effort: string;
}

export type OutreachChannelValue = "EMAIL" | "CONTACT_FORM";

export interface OutreachDraftContext {
  businessName: string;
  website: string;
  location: string | null;
  industry: string | null;
  websiteGrowthScore: number;
  scoreBand: string;
  primaryFinding: OutreachFindingContext;
  secondaryFinding: OutreachFindingContext | null;
  strongestArea: string | null;
  weakestRelevantArea: string | null;
  jsSolutionsContext: string;
  channel: OutreachChannelValue;
}

export interface OutreachDraftOutput {
  subject: string;
  body: string;
}

export interface ContactFormDraftOutput {
  subject?: string;
  body: string;
}
