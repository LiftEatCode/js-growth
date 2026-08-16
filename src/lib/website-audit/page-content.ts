import type {
  AuditHeadingData,
  AuditHeadingItem,
  AuditHeadingLevel,
} from "./types";
import { normalizeWhitespace } from "./page-metadata";

export const SUBSTANTIAL_PARAGRAPH_WORDS = 30;
export const CONTENT_THIN_STRONG_THRESHOLD = 100;
export const CONTENT_THIN_WARNING_THRESHOLD = 200;
export const CONTENT_STRUCTURE_MIN_WORDS = 300;
export const GENERIC_ANCHOR_MIN_COUNT = 3;
export const GENERIC_ANCHOR_RATE_THRESHOLD = 0.3;
export const LOW_INTERNAL_DIVERSITY_MAX = 2;
export const LOW_INTERNAL_DIVERSITY_MIN_WORDS = 200;
export const MAX_HEADING_DETAILS = 100;
export const MAX_INTERNAL_LINK_DETAILS = 200;
export const IMAGE_MISSING_ALT_LOW_RATE = 0.2;
export const IMAGE_MISSING_ALT_HIGH_RATE = 0.5;

const GENERIC_ANCHOR_PHRASES = new Set([
  "click here",
  "learn more",
  "read more",
  "more",
  "here",
  "details",
  "view more",
  "see more",
  "continue",
]);

export function countWords(text: string): number {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return 0;
  }

  return normalized
    .split(" ")
    .filter((word) => /[a-z0-9]/i.test(word)).length;
}

export function countSkippedHeadingLevels(
  items: Array<Pick<AuditHeadingItem, "level">>,
): number {
  let skippedLevelCount = 0;

  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];

    if (!previous || !current) {
      continue;
    }

    if (current.level > previous.level + 1) {
      skippedLevelCount += 1;
    }
  }

  return skippedLevelCount;
}

export function buildHeadingData(
  items: AuditHeadingItem[],
): AuditHeadingData {
  const counts: Record<AuditHeadingLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };

  const h1Values: string[] = [];
  let emptyHeadingCount = 0;

  for (const item of items) {
    counts[item.level] += 1;

    if (item.level === 1) {
      h1Values.push(item.text);
    }

    if (item.empty) {
      emptyHeadingCount += 1;
    }
  }

  return {
    items: items.slice(0, MAX_HEADING_DETAILS),
    h1Count: counts[1],
    h2Count: counts[2],
    h3Count: counts[3],
    h4Count: counts[4],
    h5Count: counts[5],
    h6Count: counts[6],
    h1Values: h1Values.slice(0, MAX_HEADING_DETAILS),
    emptyHeadingCount,
    skippedLevelCount: countSkippedHeadingLevels(items),
    detailsTruncated: items.length > MAX_HEADING_DETAILS,
  };
}

export function isGenericAnchorText(value: string): boolean {
  const normalized = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return GENERIC_ANCHOR_PHRASES.has(normalized);
}

export function isSuspiciousImageAlt(alt: string): boolean {
  const trimmed = normalizeWhitespace(alt);

  if (!trimmed) {
    return false;
  }

  if (/\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$/i.test(trimmed)) {
    return true;
  }

  return /^(img|dsc|dscn|photo|image|pic|picture|screenshot)[-_\s.]?\d+/i.test(
    trimmed,
  );
}

export function hasUsefulAccessibleLinkText(
  anchorText: string,
  imageAltText: string | null,
): boolean {
  if (anchorText.length > 0) {
    return true;
  }

  return Boolean(imageAltText && imageAltText.length > 0);
}
