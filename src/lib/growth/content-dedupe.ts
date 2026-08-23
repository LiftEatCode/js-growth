/**
 * Pure helpers for GrowthContentRecord create-identity / rapid-dedupe.
 * Kept free of `server-only` so verify scripts can import them.
 */

export const GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS = 120_000;

export type GrowthContentIdentityFingerprint = {
  publisherType: string;
  utmContent: string;
  publishedAtMs: number;
  title: string;
  contentJob: string;
  contentPillar: string;
  contentFormat: string;
  createdByEmail: string;
};

export function buildGrowthContentIdentityFingerprint(input: {
  publisherType: string;
  utmContent: string;
  publishedAt: Date;
  title: string;
  contentJob: string;
  contentPillar: string;
  contentFormat: string;
  createdByEmail: string;
}): GrowthContentIdentityFingerprint {
  return {
    publisherType: input.publisherType,
    utmContent: input.utmContent,
    publishedAtMs: input.publishedAt.getTime(),
    title: input.title.trim().toLowerCase(),
    contentJob: input.contentJob,
    contentPillar: input.contentPillar,
    contentFormat: input.contentFormat,
    createdByEmail: input.createdByEmail.trim().toLowerCase(),
  };
}

export function matchesGrowthContentIdentityFingerprint(
  a: GrowthContentIdentityFingerprint,
  b: GrowthContentIdentityFingerprint,
): boolean {
  return (
    a.publisherType === b.publisherType &&
    a.utmContent === b.utmContent &&
    a.publishedAtMs === b.publishedAtMs &&
    a.title === b.title &&
    a.contentJob === b.contentJob &&
    a.contentPillar === b.contentPillar &&
    a.contentFormat === b.contentFormat &&
    a.createdByEmail === b.createdByEmail
  );
}

export function isWithinRapidDuplicateWindow(
  existingCreatedAt: Date,
  now: Date = new Date(),
  windowMs: number = GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS,
): boolean {
  const age = now.getTime() - existingCreatedAt.getTime();
  return age >= 0 && age <= windowMs;
}
