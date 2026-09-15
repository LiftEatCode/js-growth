import { THRESHOLDS } from "./constants";
import type { BusinessProfileData, GbpRegularHoursDay } from "./types";

const MS_PER_DAY = 86_400_000;

export function daysSince(iso: string, asOf: string): number {
  const then = Date.parse(iso);
  const now = Date.parse(asOf);
  if (!Number.isFinite(then) || !Number.isFinite(now)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((now - then) / MS_PER_DAY);
}

export function isNewBusiness(
  profile: BusinessProfileData,
  asOf: string,
): boolean {
  const openingDate = profile.configuration.openingDate;
  if (!openingDate) {
    return false;
  }
  const age = daysSince(openingDate, asOf);
  return age <= THRESHOLDS.newBusinessDays;
}

export function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeBusinessName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,'"/\\]/g, " ")
    .replace(
      /\b(llc|l\.l\.c\.|inc|incorporated|ltd|co|company|dba)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function namesLookConsistent(a: string, b: string): boolean {
  const left = normalizeBusinessName(a);
  const right = normalizeBusinessName(b);
  if (!left || !right) {
    return false;
  }
  return left === right || left.includes(right) || right.includes(left);
}

export function phonesLookConsistent(a: string, b: string): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  if (left.length < 7 || right.length < 7) {
    return false;
  }
  return left === right || left.endsWith(right) || right.endsWith(left);
}

export function hostnameFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function hasOpenHours(hours: GbpRegularHoursDay[] | null): boolean {
  if (!hours || hours.length === 0) {
    return false;
  }
  return hours.some((day) => !day.closed && Boolean(day.openTime));
}

export function mostRecentIso(values: Array<string | null | undefined>): string | null {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export function deriveMostRecentPostAt(
  profile: BusinessProfileData,
): string | null {
  return (
    profile.activity.mostRecentPostAt ??
    mostRecentIso(profile.activity.posts.map((post) => post.publishedAt))
  );
}

export function deriveMostRecentReviewAt(
  profile: BusinessProfileData,
): string | null {
  return (
    profile.reviews.mostRecentReviewAt ??
    mostRecentIso(profile.reviews.reviews.map((review) => review.publishedAt))
  );
}

export function deriveOldestReviewAt(
  profile: BusinessProfileData,
): string | null {
  const timestamps = profile.reviews.reviews
    .map((review) => review.publishedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

export function deriveOwnerResponseCount(
  profile: BusinessProfileData,
): number | null {
  if (profile.reviews.ownerResponseCount !== null) {
    return profile.reviews.ownerResponseCount;
  }
  if (profile.reviews.reviews.length === 0) {
    return null;
  }
  return profile.reviews.reviews.filter((review) => review.hasOwnerResponse)
    .length;
}

export function derivePostCount(profile: BusinessProfileData): number | null {
  if (profile.activity.postCount !== null) {
    return profile.activity.postCount;
  }
  if (profile.activity.posts.length > 0) {
    return profile.activity.posts.length;
  }
  return null;
}
