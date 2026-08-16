import { load, type CheerioAPI } from "cheerio";

import {
  MAX_INTERNAL_LINK_DETAILS,
  SUBSTANTIAL_PARAGRAPH_WORDS,
  buildHeadingData,
  countWords,
  hasUsefulAccessibleLinkText,
  isGenericAnchorText,
  isSuspiciousImageAlt,
} from "./page-content";
import {
  getPageLocationKey,
  isSamePageUrl,
  isSameSiteUrl,
  normalizeWhitespace,
} from "./page-metadata";
import type {
  AuditContentData,
  AuditHeadingData,
  AuditHeadingItem,
  AuditHeadingLevel,
  AuditImageData,
  AuditInternalLink,
  AuditLinkData,
} from "./types";

const NON_CONTENT_SELECTORS =
  "script, style, noscript, template, svg";
const CONTENT_SCOPE_ID = "__audit_content_scope__";

function createCleanedScope(html: string): CheerioAPI {
  const fragment = load(
    `<div id="${CONTENT_SCOPE_ID}">${html}</div>`,
  );
  const root = fragment(`#${CONTENT_SCOPE_ID}`);

  root.find("head").remove();
  root.find(NON_CONTENT_SELECTORS).remove();

  return fragment;
}

function scopeText(fragment: CheerioAPI): string {
  return normalizeWhitespace(
    fragment(`#${CONTENT_SCOPE_ID}`).text(),
  );
}

function bodyInnerHtml($: CheerioAPI): string {
  if ($("body").length > 0) {
    return $("body").html() ?? "";
  }

  return $.root().html() ?? "";
}

function mainInnerHtml($: CheerioAPI): {
  html: string;
  usedMainElement: boolean;
} {
  const main = $("main").first();

  if (main.length > 0) {
    return {
      html: main.html() ?? "",
      usedMainElement: true,
    };
  }

  const roleMain = $('[role="main"]').first();

  if (roleMain.length > 0) {
    return {
      html: roleMain.html() ?? "",
      usedMainElement: true,
    };
  }

  return {
    html: bodyInnerHtml($),
    usedMainElement: false,
  };
}

export function extractVisibleText($: CheerioAPI): string {
  return scopeText(createCleanedScope(bodyInnerHtml($)));
}

export function extractContentData($: CheerioAPI): AuditContentData {
  const visibleText = extractVisibleText($);
  const { html: mainHtml, usedMainElement } = mainInnerHtml($);
  const mainScope = createCleanedScope(mainHtml);

  let paragraphCount = 0;
  let nonEmptyParagraphCount = 0;
  let substantialParagraphCount = 0;

  mainScope("p").each((_, element) => {
    paragraphCount += 1;

    const wordCount = countWords(mainScope(element).text());

    if (wordCount === 0) {
      return;
    }

    nonEmptyParagraphCount += 1;

    if (wordCount >= SUBSTANTIAL_PARAGRAPH_WORDS) {
      substantialParagraphCount += 1;
    }
  });

  return {
    totalVisibleWordCount: countWords(visibleText),
    mainContentWordCount: countWords(scopeText(mainScope)),
    paragraphCount,
    nonEmptyParagraphCount,
    substantialParagraphCount,
    usedMainElement,
  };
}

export function extractHeadingData($: CheerioAPI): AuditHeadingData {
  const items: AuditHeadingItem[] = [];

  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const tagName = ($(element).prop("tagName") ?? "").toLowerCase();
    const parsedLevel = Number(tagName.replace("h", ""));

    if (
      parsedLevel !== 1 &&
      parsedLevel !== 2 &&
      parsedLevel !== 3 &&
      parsedLevel !== 4 &&
      parsedLevel !== 5 &&
      parsedLevel !== 6
    ) {
      return;
    }

    const level = parsedLevel as AuditHeadingLevel;
    const text = normalizeWhitespace($(element).text());

    items.push({
      level,
      text,
      empty: text.length === 0,
    });
  });

  return buildHeadingData(items);
}

/**
 * Internal links are same-hostname/same-site as the audited page
 * (hostname casing and default ports normalized). Subdomains such as
 * www vs blog are treated as different sites.
 */
export function extractLinkData(
  $: CheerioAPI,
  pageUrl: URL,
): AuditLinkData & { externalLinkCount: number } {
  const allInternalLinks: AuditInternalLink[] = [];
  const uniqueDestinations = new Set<string>();

  let totalLinks = 0;
  let externalLinkCount = 0;
  let samePageLinkCount = 0;
  let genericAnchorCount = 0;
  let emptyAnchorCount = 0;
  let internalPageLinkCount = 0;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();

    if (
      !href ||
      href.toLowerCase().startsWith("mailto:") ||
      href.toLowerCase().startsWith("tel:") ||
      href.toLowerCase().startsWith("javascript:")
    ) {
      return;
    }

    let resolved: URL;

    try {
      resolved = new URL(href, pageUrl);
    } catch {
      return;
    }

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return;
    }

    totalLinks += 1;

    const image = $(element).find("img").first();
    const hasImage = image.length > 0;
    const rawAlt = hasImage ? image.attr("alt") : undefined;
    const imageAltText =
      rawAlt == null ? null : normalizeWhitespace(rawAlt) || "";
    const usefulImageAlt =
      imageAltText && imageAltText.length > 0 ? imageAltText : null;

    const clone = $(element).clone();
    clone.find(NON_CONTENT_SELECTORS).remove();
    const anchorText = normalizeWhitespace(clone.text());
    const hasText = anchorText.length > 0;
    const isInternal = isSameSiteUrl(resolved, pageUrl);
    const isSamePage = isInternal && isSamePageUrl(resolved, pageUrl);

    if (!isInternal) {
      externalLinkCount += 1;
      return;
    }

    if (isSamePage) {
      samePageLinkCount += 1;
    } else {
      internalPageLinkCount += 1;
      uniqueDestinations.add(getPageLocationKey(resolved));

      if (isGenericAnchorText(anchorText)) {
        genericAnchorCount += 1;
      }

      if (!hasUsefulAccessibleLinkText(anchorText, usefulImageAlt)) {
        emptyAnchorCount += 1;
      }
    }

    allInternalLinks.push({
      href,
      resolvedUrl: resolved.toString(),
      anchorText,
      isSamePage,
      hasText,
      hasImage,
      imageAltText: usefulImageAlt,
    });
  });

  return {
    totalLinks,
    internalLinks: allInternalLinks.slice(0, MAX_INTERNAL_LINK_DETAILS),
    internalLinkCount: internalPageLinkCount,
    uniqueInternalDestinationCount: uniqueDestinations.size,
    genericAnchorCount,
    emptyAnchorCount,
    samePageLinkCount,
    detailsTruncated: allInternalLinks.length > MAX_INTERNAL_LINK_DETAILS,
    externalLinkCount,
  };
}

export function extractImageData($: CheerioAPI): AuditImageData {
  let total = 0;
  let withAlt = 0;
  let missingAltAttribute = 0;
  let emptyAlt = 0;
  let meaningfulAlt = 0;
  let suspiciousAlt = 0;

  $("img").each((_, element) => {
    total += 1;

    const alt = $(element).attr("alt");

    if (alt == null) {
      missingAltAttribute += 1;
      return;
    }

    withAlt += 1;
    const normalized = normalizeWhitespace(alt);

    if (!normalized) {
      emptyAlt += 1;
      return;
    }

    if (isSuspiciousImageAlt(normalized)) {
      suspiciousAlt += 1;
      return;
    }

    meaningfulAlt += 1;
  });

  return {
    total,
    withAlt,
    missingAltAttribute,
    emptyAlt,
    meaningfulAlt,
    suspiciousAlt,
  };
}
