export type ContactSourceType =
  | "WEBSITE"
  | "CONTACT_PAGE"
  | "PROVIDER"
  | "MANUAL"
  | "WEBSITE_HOMEPAGE"
  | "WEBSITE_CONTACT_PAGE"
  | "WEBSITE_ABOUT_PAGE"
  | "WEBSITE_TEAM_PAGE"
  | "WEBSITE_OTHER";

export type ContactConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ContactStatus =
  | "DISCOVERED"
  | "SELECTED"
  | "REJECTED"
  | "SUPPRESSED"
  | "STALE";

export type ContactDiscoveryOutcomeCode =
  | "CONTACTS_FOUND"
  | "NO_PUBLIC_EMAIL_FOUND"
  | "CONTACT_DISCOVERY_FAILED"
  | "SUPPRESSED"
  | "REUSED";

export interface ExtractedEmailCandidate {
  email: string;
  normalizedEmail: string;
  name: string | null;
  role: string | null;
  sourceUrl: string;
  sourceType: ContactSourceType;
  viaMailto: boolean;
}

export interface NormalizedContactCandidate {
  email: string;
  normalizedEmail: string;
  name: string | null;
  role: string | null;
  sourceUrl: string;
  sourceType: ContactSourceType;
  confidence: ContactConfidence;
  confidenceReason: string;
}

export interface ProspectContactDiscoveryInput {
  prospectId: string;
  websiteUrl: string;
}

export interface WebsiteContactDiscoveryResult {
  pagesFetched: number;
  pageUrls: string[];
  candidates: NormalizedContactCandidate[];
  forms: import("./form-types").NormalizedContactFormCandidate[];
  failed: boolean;
  failureMessage: string | null;
  diagnostics?: {
    pagesSelected: number;
    rawFormsSeen: number;
    formsAccepted: number;
    emailsFound: number;
    fetchFailures: number;
  };
}

export interface ProspectContactDiscoveryProvider {
  discoverProspectContacts(input: {
    websiteUrl: string;
  }): Promise<WebsiteContactDiscoveryResult>;
}
