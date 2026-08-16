import {
  getAuditCanonicalUrl,
  getAuditMetaDescriptionText,
  getAuditTitleText,
  normalizeWhitespace,
} from "../page-metadata";
import { normalizeAuditRobotsData } from "../robots";
import type { AuditPageData } from "../types";
import {
  MAX_CONTENT_TOKENS_STORED,
  MAX_OUTGOING_PATHS_STORED,
} from "./constants";
import {
  guessPageTypeFromSignals,
  selectionReasonFor,
} from "./classify-page";
import type {
  AuditSitePageSnapshot,
  AuditSiteSelectionReason,
} from "./types";
import { crawlIdentity, crawlPath, normalizeCrawlUrl } from "./urls";

function firstH1(pageData: AuditPageData): string | null {
  const values = pageData.h1Values ?? pageData.headings?.h1Values ?? [];
  const found = values
    .map((value) => normalizeWhitespace(value))
    .find((value) => value.length > 0);

  return found ?? null;
}

function tokenizeContent(text: string): string[] {
  const tokens = new Set<string>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4);

  for (const word of words) {
    tokens.add(word);

    if (tokens.size >= MAX_CONTENT_TOKENS_STORED) {
      break;
    }
  }

  return [...tokens].sort();
}

function hasMeaningfulConversionPath(pageData: AuditPageData): boolean {
  const conversion = pageData.conversion;

  if (!conversion) {
    return false;
  }

  return conversion.ctas.count > 0 || conversion.path.hasLeadForm;
}

function outgoingPaths(
  pageData: AuditPageData,
  pageUrl: string,
): string[] {
  const links = pageData.links?.internalLinks ?? [];
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (link.isSamePage || !link.resolvedUrl) {
      continue;
    }

    const normalized = normalizeCrawlUrl(link.resolvedUrl, pageUrl);

    if (!normalized) {
      continue;
    }

    if (seen.has(normalized.identity)) {
      continue;
    }

    seen.add(normalized.identity);
    paths.push(normalized.path);

    if (paths.length >= MAX_OUTGOING_PATHS_STORED) {
      break;
    }
  }

  return paths;
}

export function compactSitePage(options: {
  requestedUrl: string;
  finalUrl: string;
  depth: number;
  pageData: AuditPageData | null;
  fetchStatus: "success" | "failed";
  statusCode: number | null;
  errorCode: string | null;
  selectionReason: AuditSiteSelectionReason;
  inPrimaryNav: boolean;
  anchorText?: string;
  contentText?: string;
}): AuditSitePageSnapshot {
  const {
    requestedUrl,
    finalUrl,
    depth,
    pageData,
    fetchStatus,
    statusCode,
    errorCode,
    selectionReason,
    inPrimaryNav,
    anchorText = "",
    contentText = "",
  } = options;

  let parsedFinal: URL | null = null;

  try {
    parsedFinal = new URL(finalUrl);
  } catch {
    parsedFinal = null;
  }

  const path = parsedFinal ? crawlPath(parsedFinal) : "/";
  const identity = parsedFinal
    ? crawlIdentity(parsedFinal)
    : requestedUrl;
  const title = pageData ? getAuditTitleText(pageData.title) : null;
  const metaDescription = pageData
    ? getAuditMetaDescriptionText(pageData.metaDescription)
    : null;
  const h1 = pageData ? firstH1(pageData) : null;
  const localPageType = pageData?.local?.pageType ?? null;

  const pageType = guessPageTypeFromSignals({
    path,
    title,
    h1,
    anchorText,
    localPageType,
  });

  const canonicalUrl = pageData ? getAuditCanonicalUrl(pageData) : null;
  const robots = pageData ? normalizeAuditRobotsData(pageData.robots) : null;
  const conversion = pageData?.conversion;
  const local = pageData?.local;

  return {
    identity,
    url: requestedUrl,
    finalUrl,
    path,
    depth,
    pageType,
    selectionReason:
      selectionReason === "seed"
        ? "seed"
        : selectionReasonFor(
            pageType,
            selectionReason === "sitemap" ? "sitemap" : "link",
            inPrimaryNav,
          ),
    fetchStatus,
    statusCode,
    errorCode,
    inPrimaryNav,
    title,
    metaDescription,
    h1,
    wordCount: pageData?.content?.mainContentWordCount ?? 0,
    canonicalUrl,
    canonicalSelfReferencing: pageData?.canonical
      ? pageData.canonical.selfReferencing
      : null,
    canonicalSameOrigin: pageData?.canonical
      ? pageData.canonical.sameOrigin
      : null,
    indexable: robots ? !robots.effective.noindex : null,
    hasConversionPath: pageData
      ? hasMeaningfulConversionPath(pageData)
      : false,
    hasTelLink: (conversion?.phone.telLinkCount ?? 0) > 0,
    hasClickToCall: Boolean(conversion?.path.hasClickToCall),
    hasLeadForm: Boolean(conversion?.path.hasLeadForm),
    trustCategoryCount: conversion?.trust.trustCategoryCount ?? 0,
    likelyLocalBusiness: Boolean(local?.likelihood.likelyLocalBusiness),
    hasAddressSignal: Boolean(local?.nap.hasAddressSignal),
    hasPhoneSignal:
      Boolean(local?.nap.hasPhoneSignal) ||
      Boolean(conversion?.phone.visiblePhonePresent) ||
      (conversion?.phone.telLinkCount ?? 0) > 0,
    hasServiceAreaLanguage: Boolean(local?.serviceArea.hasServiceAreaLanguage),
    locationPage: Boolean(local?.locationPage.likelyLocationPage),
    localPageType,
    serviceAreaMentions: (local?.serviceArea.mentionedLocations ?? []).slice(
      0,
      8,
    ),
    outgoingInternalCount:
      pageData?.links?.uniqueInternalDestinationCount ??
      pageData?.internalLinkCount ??
      0,
    incomingInternalCount: 0,
    outgoingInternalPaths: pageData
      ? outgoingPaths(pageData, finalUrl)
      : [],
    contentTokens: tokenizeContent(contentText),
  };
}

export function compactFailedPage(options: {
  requestedUrl: string;
  finalUrl: string | null;
  depth: number;
  statusCode: number | null;
  errorCode: string;
  selectionReason: AuditSiteSelectionReason;
  inPrimaryNav: boolean;
  anchorText?: string;
}): AuditSitePageSnapshot {
  return compactSitePage({
    requestedUrl: options.requestedUrl,
    finalUrl: options.finalUrl ?? options.requestedUrl,
    depth: options.depth,
    pageData: null,
    fetchStatus: "failed",
    statusCode: options.statusCode,
    errorCode: options.errorCode,
    selectionReason: options.selectionReason,
    inPrimaryNav: options.inPrimaryNav,
    anchorText: options.anchorText,
  });
}
