import { CONTENT_THIN_WARNING_THRESHOLD } from "./page-content";
import {
  TITLE_H1_ALIGNMENT_THRESHOLD,
  computeTokenOverlap,
  isAuditTitleData,
  normalizeWhitespace,
} from "./page-metadata";
import type {
  AuditContentData,
  AuditConversionIntentType,
  AuditCtaType,
  AuditFormPurposeGuess,
  AuditHeadingData,
  AuditOfferClarityData,
  AuditTitleData,
  AuditTrustCategory,
} from "./types";

export const MAX_CTA_DETAILS = 50;
export const MAX_FORM_DETAILS = 20;
export const MAX_TRUST_EVIDENCE = 20;
export const MAX_INTENT_EVIDENCE = 20;
export const LEAD_FORM_FRICTION_FIELD_THRESHOLD = 9;
export const TRUST_DIVERSITY_PASS_THRESHOLD = 2;

export const PHONE_NUMBER_PATTERN =
  /(?:\+?1[\s.-]?)?(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}/;

export const EMAIL_ADDRESS_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const NON_CONVERSION_CTA_PHRASES = new Set([
  "learn more",
  "read more",
  "view details",
  "next",
  "previous",
  "submit search",
  "menu",
  "login",
  "sign in",
  "log in",
  "search",
  "subscribe",
]);

interface ClassifiedPhrase<T extends string> {
  phrase: string;
  type: T;
}

const CTA_PHRASES: ClassifiedPhrase<AuditCtaType>[] = [
  { phrase: "request a quote", type: "quote" },
  { phrase: "request quote", type: "quote" },
  { phrase: "get a quote", type: "quote" },
  { phrase: "free quote", type: "quote" },
  { phrase: "request an estimate", type: "estimate" },
  { phrase: "request estimate", type: "estimate" },
  { phrase: "get an estimate", type: "estimate" },
  { phrase: "free estimate", type: "estimate" },
  { phrase: "schedule a consultation", type: "consultation" },
  { phrase: "request a consultation", type: "consultation" },
  { phrase: "free consultation", type: "consultation" },
  { phrase: "schedule appointment", type: "booking" },
  { phrase: "book appointment", type: "booking" },
  { phrase: "book online", type: "booking" },
  { phrase: "book now", type: "booking" },
  { phrase: "schedule service", type: "booking" },
  { phrase: "request service", type: "service" },
  { phrase: "request pricing", type: "quote" },
  { phrase: "contact our team", type: "contact" },
  { phrase: "get in touch", type: "contact" },
  { phrase: "speak with us", type: "contact" },
  { phrase: "talk to us", type: "contact" },
  { phrase: "contact us", type: "contact" },
  { phrase: "call today", type: "phone" },
  { phrase: "call now", type: "phone" },
  { phrase: "call us", type: "phone" },
  { phrase: "get started", type: "generic-conversion" },
];

const EXACT_CTA_PHRASES: Record<string, AuditCtaType> = {
  contact: "contact",
  call: "phone",
  schedule: "booking",
  book: "booking",
};

const INTENT_PHRASES: ClassifiedPhrase<AuditConversionIntentType>[] = [
  { phrase: "request a quote", type: "quote" },
  { phrase: "get a quote", type: "quote" },
  { phrase: "free quote", type: "quote" },
  { phrase: "request an estimate", type: "estimate" },
  { phrase: "get an estimate", type: "estimate" },
  { phrase: "free estimate", type: "estimate" },
  { phrase: "schedule a consultation", type: "consultation" },
  { phrase: "request a consultation", type: "consultation" },
  { phrase: "free consultation", type: "consultation" },
  { phrase: "schedule appointment", type: "booking" },
  { phrase: "book appointment", type: "booking" },
  { phrase: "book online", type: "booking" },
  { phrase: "book now", type: "booking" },
  { phrase: "schedule service", type: "booking" },
  { phrase: "request service", type: "service" },
  { phrase: "contact our team", type: "contact" },
  { phrase: "get in touch", type: "contact" },
  { phrase: "speak with us", type: "contact" },
  { phrase: "talk to us", type: "contact" },
  { phrase: "contact us", type: "contact" },
  { phrase: "call today", type: "contact" },
  { phrase: "call us", type: "contact" },
];

const LEAD_FIELD_HINTS = [
  "name",
  "full-name",
  "fullname",
  "first-name",
  "firstname",
  "last-name",
  "lastname",
  "email",
  "phone",
  "tel",
  "mobile",
  "message",
  "comment",
  "company",
  "service",
  "appointment",
  "date",
  "quote",
  "estimate",
];

const LEAD_SUBMIT_PHRASES = [
  "contact",
  "send message",
  "request quote",
  "get quote",
  "request estimate",
  "get estimate",
  "schedule",
  "book",
  "submit request",
  "get started",
  "request service",
  "send",
];

const SEARCH_FIELD_HINTS = ["q", "s", "query", "search", "keywords"];
const NEWSLETTER_HINTS = ["newsletter", "subscribe", "mailing list"];
const LOGIN_HINTS = ["sign in", "log in", "login", "password", "register"];
const JOB_HINTS = [
  "resume",
  "curriculum vitae",
  "cover letter",
  "job application",
  "apply now",
];
const CHECKOUT_HINTS = [
  "credit card",
  "card number",
  "cvv",
  "billing",
  "shipping",
  "payment",
  "checkout",
];

const ABOUT_LINK_PATHS = [
  "/about",
  "/about-us",
  "/our-story",
  "/our-company",
  "/who-we-are",
];
const TEAM_LINK_PATHS = ["/team", "/our-team", "/meet-the-team", "/staff"];
const PORTFOLIO_LINK_PATHS = [
  "/portfolio",
  "/gallery",
  "/our-work",
  "/work",
  "/projects",
];
const CASE_STUDY_LINK_PATHS = ["/case-studies", "/case-study"];

export function normalizePhrase(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countPatternMatches(
  text: string,
  pattern: RegExp,
): number {
  const globalPattern = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );

  return text.match(globalPattern)?.length ?? 0;
}

function includesPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${phrase} `);
}

export function isNonConversionCtaText(text: string): boolean {
  return NON_CONVERSION_CTA_PHRASES.has(normalizePhrase(text));
}

export function classifyCtaText(text: string): AuditCtaType | null {
  const normalized = normalizePhrase(text);

  if (!normalized || NON_CONVERSION_CTA_PHRASES.has(normalized)) {
    return null;
  }

  for (const candidate of CTA_PHRASES) {
    if (includesPhrase(normalized, candidate.phrase)) {
      return candidate.type;
    }
  }

  return EXACT_CTA_PHRASES[normalized] ?? null;
}

export function classifyCtaFromHref(
  href: string | null,
): AuditCtaType | null {
  if (!href) {
    return null;
  }

  const lowered = href.trim().toLowerCase();

  if (lowered.startsWith("tel:")) {
    return "phone";
  }

  if (lowered.startsWith("mailto:")) {
    return "email";
  }

  return null;
}

export function collectIntentMatches(
  texts: string[],
): {
  types: AuditConversionIntentType[];
  phraseCount: number;
  evidence: string[];
  detailsTruncated: boolean;
} {
  const types = new Set<AuditConversionIntentType>();
  const evidence: string[] = [];
  let phraseCount = 0;

  for (const text of texts) {
    const normalized = normalizePhrase(text);

    if (!normalized) {
      continue;
    }

    for (const candidate of INTENT_PHRASES) {
      if (!includesPhrase(normalized, candidate.phrase)) {
        continue;
      }

      phraseCount += 1;
      types.add(candidate.type);

      if (evidence.length < MAX_INTENT_EVIDENCE) {
        evidence.push(candidate.phrase);
      }
    }
  }

  return {
    types: [...types],
    phraseCount,
    evidence,
    detailsTruncated: phraseCount > evidence.length,
  };
}

export function classifyFormPurpose(options: {
  role: string | null;
  className: string | null;
  fieldHints: string[];
  submitText: string;
  formText: string;
  hasPassword: boolean;
  hasSearchInput: boolean;
}): AuditFormPurposeGuess {
  const haystack = normalizePhrase(
    [options.role, options.className, options.submitText, options.formText]
      .filter(Boolean)
      .join(" "),
  );
  const fieldHaystack = normalizePhrase(options.fieldHints.join(" "));

  if (
    options.role === "search" ||
    options.hasSearchInput ||
    SEARCH_FIELD_HINTS.some((hint) => options.fieldHints.includes(hint)) ||
    includesPhrase(haystack, "search")
  ) {
    return "search";
  }

  if (
    options.hasPassword ||
    LOGIN_HINTS.some((hint) => includesPhrase(haystack, hint))
  ) {
    return "login";
  }

  if (JOB_HINTS.some((hint) => includesPhrase(haystack, hint))) {
    return "job";
  }

  if (CHECKOUT_HINTS.some((hint) => includesPhrase(haystack, hint))) {
    return "checkout";
  }

  if (
    NEWSLETTER_HINTS.some(
      (hint) =>
        includesPhrase(haystack, hint) || includesPhrase(fieldHaystack, hint),
    )
  ) {
    return "newsletter";
  }

  const leadFieldHits = LEAD_FIELD_HINTS.filter(
    (hint) =>
      options.fieldHints.some((field) => field.includes(hint)) ||
      includesPhrase(fieldHaystack, hint),
  ).length;
  const leadSubmit = LEAD_SUBMIT_PHRASES.some((phrase) =>
    includesPhrase(normalizePhrase(options.submitText), phrase),
  );

  if (leadFieldHits >= 2 || leadSubmit) {
    return "lead";
  }

  return "other";
}

export function isLikelyLeadForm(purpose: AuditFormPurposeGuess): boolean {
  return purpose === "lead";
}

export function pathnameMatches(
  pathname: string,
  prefixes: string[],
): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  return prefixes.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function isAboutPath(pathname: string): boolean {
  return pathnameMatches(pathname, ABOUT_LINK_PATHS);
}

export function isTeamPath(pathname: string): boolean {
  return pathnameMatches(pathname, TEAM_LINK_PATHS);
}

export function isPortfolioPath(pathname: string): boolean {
  return pathnameMatches(pathname, PORTFOLIO_LINK_PATHS);
}

export function isCaseStudyPath(pathname: string): boolean {
  return pathnameMatches(pathname, CASE_STUDY_LINK_PATHS);
}

export function headingTrustCategory(
  heading: string,
): AuditTrustCategory | null {
  const normalized = normalizePhrase(heading);

  if (!normalized) {
    return null;
  }

  if (
    normalized === "testimonials" ||
    includesPhrase(normalized, "testimonials") ||
    includesPhrase(normalized, "what our customers say") ||
    includesPhrase(normalized, "what our clients say")
  ) {
    return "testimonials";
  }

  if (
    normalized === "reviews" ||
    includesPhrase(normalized, "customer reviews") ||
    includesPhrase(normalized, "client reviews") ||
    includesPhrase(normalized, "our reviews")
  ) {
    return "reviews";
  }

  if (
    normalized === "about" ||
    normalized === "about us" ||
    includesPhrase(normalized, "our company") ||
    includesPhrase(normalized, "our story") ||
    includesPhrase(normalized, "who we are")
  ) {
    return "about";
  }

  if (
    includesPhrase(normalized, "our team") ||
    includesPhrase(normalized, "meet the team") ||
    normalized === "team"
  ) {
    return "team";
  }

  if (includesPhrase(normalized, "case stud")) {
    return "case-study";
  }

  if (
    normalized === "portfolio" ||
    includesPhrase(normalized, "our work") ||
    includesPhrase(normalized, "recent work") ||
    includesPhrase(normalized, "project gallery")
  ) {
    return "portfolio";
  }

  return null;
}

export const TRUST_BODY_PATTERNS: Array<{
  category: AuditTrustCategory;
  pattern: RegExp;
}> = [
  {
    category: "insured",
    pattern:
      /\b(?:licensed\s+and\s+insured|fully\s+insured|insured\s+and\s+bonded|bonded(?:\s+and\s+insured)?)\b/i,
  },
  {
    category: "license",
    pattern:
      /\b(?:licensed\s+and\s+insured|state[\s-]?licensed|fully\s+licensed)\b/i,
  },
  {
    category: "certification",
    pattern:
      /\b(?:certified\s+technicians|factory[\s-]?certified|independently\s+certified)\b/i,
  },
  {
    category: "warranty",
    pattern: /\b(?:workmanship\s+warranty|lifetime\s+warranty|\d{1,2}-year\s+warranty|warranties|warranty)\b/i,
  },
  {
    category: "guarantee",
    pattern: /\b(?:satisfaction\s+guarantee|money-back\s+guarantee|guaranteed)\b/i,
  },
  {
    category: "experience",
    pattern:
      /\b(?:\d{1,2}\s+years?\s+of\s+experience|over\s+\d{1,2}\s+years?|(?:serving|family[\s-]?owned|established)\b[^.!?]{0,40}\bsince\s+(?:19|20)\d{2})\b/i,
  },
];

export function uniqueStrings(values: Iterable<string>): string[] {
  return [...new Set(values)];
}

export function buildOfferClarity(options: {
  title: AuditTitleData | string;
  headings: AuditHeadingData;
  content: AuditContentData;
  hasConversionIntent: boolean;
}): AuditOfferClarityData {
  const hasMeaningfulTitle = isAuditTitleData(options.title)
    ? Boolean(options.title.value && !options.title.isEmpty)
    : options.title.trim().length > 0;
  const meaningfulH1s = options.headings.h1Values.filter(
    (value) => value.length > 0,
  );
  const hasMeaningfulH1 = meaningfulH1s.length > 0;
  const titleValue = isAuditTitleData(options.title)
    ? options.title.value
    : options.title;
  let titleH1Aligned: boolean | null = null;

  if (hasMeaningfulTitle && meaningfulH1s.length === 1 && titleValue) {
    const h1 = meaningfulH1s[0];
    const overlap = h1 ? computeTokenOverlap(titleValue, h1) : null;

    titleH1Aligned =
      overlap == null ? null : overlap >= TITLE_H1_ALIGNMENT_THRESHOLD;
  }

  return {
    hasMeaningfulTitle,
    hasMeaningfulH1,
    titleH1Aligned,
    hasSubstantialContent:
      options.content.mainContentWordCount >= CONTENT_THIN_WARNING_THRESHOLD,
    hasConversionIntent: options.hasConversionIntent,
  };
}
