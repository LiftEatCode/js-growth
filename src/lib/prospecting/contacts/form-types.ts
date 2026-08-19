export interface DetectedContactFormFields {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasSubject: boolean;
  hasMessage: boolean;
}

export interface ExtractedContactFormCandidate {
  url: string;
  normalizedUrl: string;
  sourcePageUrl: string;
  formMethod: string | null;
  formAction: string | null;
  detectedFields: DetectedContactFormFields;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceReason: string;
}

export interface NormalizedContactFormCandidate {
  url: string;
  normalizedUrl: string;
  sourcePageUrl: string;
  formMethod: string | null;
  formAction: string | null;
  detectedFields: DetectedContactFormFields;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceReason: string;
}
