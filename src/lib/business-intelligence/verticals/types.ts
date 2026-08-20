export const BUSINESS_VERTICALS = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "ROOFING",
  "LANDSCAPING",
  "AUTO_REPAIR",
  "CONSTRUCTION",
  "LEGAL",
  "DENTAL",
  "MEDICAL",
  "RESTAURANT",
  "HOME_SERVICES",
  "OTHER",
] as const;

export type BusinessVertical = (typeof BUSINESS_VERTICALS)[number];

export interface VerticalSignal {
  source: "places_type" | "places_display" | "industry" | "campaign" | "business_name";
  text: string;
}

export interface VerticalNormalizationResult {
  verticals: BusinessVertical[];
  evidence: Array<{
    vertical: BusinessVertical;
    source: VerticalSignal["source"];
    matched: string;
  }>;
}

export function isBusinessVertical(value: string): value is BusinessVertical {
  return (BUSINESS_VERTICALS as readonly string[]).includes(value);
}
