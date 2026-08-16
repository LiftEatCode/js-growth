import { isLocationPath, isServiceAreaPath } from "../page-local";
import { normalizeWhitespace } from "../page-metadata";
import { firstPathSegment, normalizePathname } from "./urls";
import type { AuditSitePageType, AuditSiteSelectionReason } from "./types";

const CONTACT_PATHS = new Set([
  "contact",
  "contact-us",
  "get-in-touch",
  "reach-us",
]);

const ABOUT_PATHS = new Set([
  "about",
  "about-us",
  "our-story",
  "our-team",
  "team",
  "company",
  "who-we-are",
]);

const SERVICES_INDEX_PATHS = new Set([
  "services",
  "service",
  "our-services",
  "what-we-do",
  "offerings",
]);

const BLOG_INDEX_PATHS = new Set([
  "blog",
  "news",
  "articles",
  "posts",
  "insights",
  "resources",
]);

function normalizedHaystack(
  title: string | null,
  h1: string | null,
  anchorText: string,
): string {
  return normalizeWhitespace(
    `${title ?? ""} ${h1 ?? ""} ${anchorText}`,
  ).toLowerCase();
}

function pathSegments(pathname: string): string[] {
  return normalizePathname(pathname)
    .toLowerCase()
    .split("/")
    .filter(Boolean);
}

export function guessPageTypeFromSignals(input: {
  path: string;
  title?: string | null;
  h1?: string | null;
  anchorText?: string;
  localPageType?: string | null;
}): AuditSitePageType {
  const path = normalizePathname(input.path);
  const segments = pathSegments(path);
  const first = firstPathSegment(path);
  const haystack = normalizedHaystack(
    input.title ?? null,
    input.h1 ?? null,
    input.anchorText ?? "",
  );

  if (path === "/" || input.localPageType === "local-business-homepage") {
    if (path === "/") {
      return "home";
    }
  }

  if (first && CONTACT_PATHS.has(first)) {
    return "contact";
  }

  if (
    /\bcontact us\b/.test(haystack) ||
    /\bget in touch\b/.test(haystack)
  ) {
    if (segments.length <= 2) {
      return "contact";
    }
  }

  if (first && ABOUT_PATHS.has(first)) {
    return segments.length === 1 ? "about" : "other";
  }

  if (
    (/\babout us\b/.test(haystack) || /\bour story\b/.test(haystack)) &&
    segments.length <= 2
  ) {
    return "about";
  }

  if (input.localPageType === "location-page" || isLocationPath(`${path}/`)) {
    return isServiceAreaPath(`${path}/`) ? "service-area" : "location";
  }

  if (
    input.localPageType === "service-area-page" ||
    isServiceAreaPath(`${path}/`)
  ) {
    return "service-area";
  }

  if (
    first === "locations" ||
    first === "location" ||
    first === "service-areas" ||
    first === "service-area" ||
    first === "areas-we-serve"
  ) {
    return segments.length <= 1 ? "service-area" : "location";
  }

  if (first && SERVICES_INDEX_PATHS.has(first) && segments.length === 1) {
    return "services-index";
  }

  if (
    first &&
    (first === "services" ||
      first === "service" ||
      first === "our-services") &&
    segments.length >= 2
  ) {
    return "service";
  }

  if (first && BLOG_INDEX_PATHS.has(first)) {
    return segments.length <= 1 ? "blog" : "article";
  }

  if (first === "category" || first === "categories") {
    return "article";
  }

  if (/\b(contact)\b/.test(haystack) && CONTACT_PATHS.has(first ?? "")) {
    return "contact";
  }

  return "other";
}

export function isBlogLikePageType(pageType: AuditSitePageType): boolean {
  return pageType === "blog" || pageType === "article";
}

export function selectionReasonFor(
  pageType: AuditSitePageType,
  source: "seed" | "sitemap" | "navigation" | "link",
  inPrimaryNav: boolean,
): AuditSiteSelectionReason {
  if (source === "seed") {
    return "seed";
  }

  if (pageType === "home") {
    return "homepage";
  }

  if (pageType === "contact") {
    return "contact";
  }

  if (pageType === "about") {
    return "about";
  }

  if (pageType === "service" || pageType === "services-index") {
    return "service-path";
  }

  if (pageType === "location" || pageType === "service-area") {
    return "location-path";
  }

  if (source === "sitemap") {
    return "sitemap";
  }

  if (inPrimaryNav || source === "navigation") {
    return "navigation";
  }

  return "content";
}

export type CrawlPriorityPreset = "default" | "competitor-commercial";

const DEFAULT_TYPE_SCORE: Record<AuditSitePageType, number> = {
  home: 900,
  contact: 860,
  about: 820,
  "services-index": 800,
  service: 760,
  location: 740,
  "service-area": 730,
  other: 400,
  blog: 140,
  article: 120,
};

/**
 * Competitor crawls spend a smaller page budget, so commercial
 * service/location pages outrank contact and about.
 */
const COMPETITOR_COMMERCIAL_TYPE_SCORE: Record<AuditSitePageType, number> = {
  home: 900,
  "services-index": 880,
  service: 860,
  location: 840,
  "service-area": 830,
  contact: 700,
  about: 680,
  other: 400,
  blog: 80,
  article: 70,
};

export function crawlPriorityScore(input: {
  pageType: AuditSitePageType;
  depth: number;
  inPrimaryNav: boolean;
  source: "seed" | "sitemap" | "navigation" | "link";
  isSeed: boolean;
  preset?: CrawlPriorityPreset;
}): number {
  const typeScore =
    input.preset === "competitor-commercial"
      ? COMPETITOR_COMMERCIAL_TYPE_SCORE
      : DEFAULT_TYPE_SCORE;

  let score = typeScore[input.pageType];

  if (input.isSeed) {
    score += 1000;
  }

  if (input.inPrimaryNav || input.source === "navigation") {
    score += 80;
  } else if (input.source === "sitemap") {
    score += 25;
  }

  score -= input.depth * 50;

  return score;
}
