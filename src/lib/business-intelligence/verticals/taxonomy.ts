import type { BusinessVertical } from "./types";

export interface VerticalKeywordRule {
  vertical: BusinessVertical;
  patterns: RegExp[];
}

/**
 * Strong service-trade keywords. These override a generic Places type
 * such as "general contractor" or "services".
 */
export const STRONG_VERTICAL_RULES: VerticalKeywordRule[] = [
  {
    vertical: "HVAC",
    patterns: [
      /\bhvac\b/i,
      /\bheating\b/i,
      /\bcooling\b/i,
      /\bair\s*conditioning\b/i,
      /\ba\/?c\b/i,
      /\bfurnace\b/i,
      /\bheat\s*pump\b/i,
      /\bhvac_contractor\b/i,
    ],
  },
  {
    vertical: "PLUMBING",
    patterns: [
      /\bplumb(?:er|ing)\b/i,
      /\bdrain\b/i,
      /\bsewer\b/i,
      /\bwater\s*heater\b/i,
    ],
  },
  {
    vertical: "ELECTRICAL",
    patterns: [
      /\belectric(?:ian|al)?\b/i,
      /\bwiring\b/i,
      /\bpanel\s*upgrade\b/i,
    ],
  },
  {
    vertical: "ROOFING",
    patterns: [
      /\broof(?:er|ing)?\b/i,
      /\bshingle\b/i,
    ],
  },
  {
    vertical: "LANDSCAPING",
    patterns: [
      /\blandscap(?:er|ing)\b/i,
      /\blawn\s*care\b/i,
      /\blawn_care_service\b/i,
    ],
  },
  {
    vertical: "AUTO_REPAIR",
    patterns: [
      /\bauto\s*repair\b/i,
      /\bcar\s*repair\b/i,
      /\bmechanic\b/i,
      /\bauto_repair\b/i,
    ],
  },
  {
    vertical: "LEGAL",
    patterns: [/\blawyer\b/i, /\battorney\b/i, /\blaw\s*firm\b/i, /\blegal\b/i],
  },
  {
    vertical: "DENTAL",
    patterns: [/\bdentist\b/i, /\bdental\b/i, /\borthodont/i],
  },
  {
    vertical: "MEDICAL",
    patterns: [
      /\bphysician\b/i,
      /\bdoctor\b/i,
      /\bclinic\b/i,
      /\bhospital\b/i,
      /\bmedical\b/i,
    ],
  },
  {
    vertical: "RESTAURANT",
    patterns: [/\brestaurant\b/i, /\bcafe\b/i, /\bdiner\b/i, /\bpizza\b/i],
  },
];

export const WEAK_VERTICAL_RULES: VerticalKeywordRule[] = [
  {
    vertical: "CONSTRUCTION",
    patterns: [
      /\bgeneral_contractor\b/i,
      /\bgeneral\s*contractor\b/i,
      /\bconstruction\b/i,
      /\bbuilder\b/i,
    ],
  },
  {
    vertical: "HOME_SERVICES",
    patterns: [
      /\bhome\s*service/i,
      /\bhandyman\b/i,
      /\bhome_improvement\b/i,
      /\bservices\b/i,
    ],
  },
];

export const PLACES_TYPE_VERTICAL: Record<string, BusinessVertical> = {
  hvac_contractor: "HVAC",
  plumber: "PLUMBING",
  electrician: "ELECTRICAL",
  roofing_contractor: "ROOFING",
  landscaper: "LANDSCAPING",
  lawn_care_service: "LANDSCAPING",
  auto_repair: "AUTO_REPAIR",
  car_repair: "AUTO_REPAIR",
  general_contractor: "CONSTRUCTION",
  lawyer: "LEGAL",
  dentist: "DENTAL",
  doctor: "MEDICAL",
  hospital: "MEDICAL",
  restaurant: "RESTAURANT",
};

export const VERTICAL_SEARCH_PHRASES: Record<BusinessVertical, string[]> = {
  HVAC: ["HVAC contractor", "air conditioning contractor", "heating and cooling"],
  PLUMBING: ["plumber", "plumbing contractor", "plumbing services"],
  ELECTRICAL: ["electrician", "electrical contractor", "electrical services"],
  ROOFING: ["roofing contractor", "roofer", "roofing services"],
  LANDSCAPING: ["landscaper", "lawn care", "landscaping services"],
  AUTO_REPAIR: ["auto repair", "car repair", "auto mechanic"],
  CONSTRUCTION: ["general contractor", "construction contractor", "home builder"],
  LEGAL: ["lawyer", "attorney", "law firm"],
  DENTAL: ["dentist", "dental office", "dental clinic"],
  MEDICAL: ["doctor", "medical clinic", "physician"],
  RESTAURANT: ["restaurant", "cafe", "diner"],
  HOME_SERVICES: ["home services", "handyman", "home improvement"],
  OTHER: ["local contractor", "local services", "local business"],
};
