import { load } from "cheerio";

import { normalizeWhitespace } from "@/lib/website-audit/page-metadata";

import {
  IMAGE_OR_ASSET_TLDS,
  REJECTED_EMAIL_DOMAINS,
  REJECTED_LOCAL_PARTS,
} from "./constants";
import { contactSelectionScore } from "./select";
import type { ContactSourceType, ExtractedEmailCandidate } from "./types";

const VISIBLE_EMAIL_PATTERN =
  /[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi;

const OBFUSCATED_EMAIL_PATTERN =
  /([A-Z0-9._%+\-]+)\s*(?:\[|\()?at(?:\]|\))?\s*([A-Z0-9.\-]+)\s*(?:\[|\()?dot(?:\]|\))?\s*([A-Z]{2,})/gi;

function isPlausibleLocalPart(localPart: string): boolean {
  if (!localPart || localPart.startsWith(".") || localPart.endsWith(".")) {
    return false;
  }

  if (localPart.includes("..")) {
    return false;
  }

  return /^[a-z0-9._%+\-]+$/i.test(localPart);
}

export function normalizeEmailAddress(raw: string): string | null {
  const withoutMailto = raw
    .trim()
    .replace(/^mailto:/i, "")
    .split("?")[0]
    ?.split("#")[0]
    ?.replace(/^\/+/, "")
    .replace(/^<|>$/g, "")
    .trim();

  if (!withoutMailto) {
    return null;
  }

  const lowered = withoutMailto.toLowerCase();
  const at = lowered.lastIndexOf("@");

  if (at <= 0 || at === lowered.length - 1) {
    return null;
  }

  const localPart = lowered.slice(0, at);
  const domain = lowered.slice(at + 1).replace(/\.$/, "");

  if (!isPlausibleLocalPart(localPart) || !domain.includes(".")) {
    return null;
  }

  if (!/^[a-z0-9.-]+$/i.test(domain) || domain.startsWith("-") || domain.endsWith("-")) {
    return null;
  }

  return `${localPart}@${domain}`;
}

export function isRejectedContactEmail(email: string): boolean {
  const normalized = normalizeEmailAddress(email);

  if (!normalized) {
    return true;
  }

  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return true;
  }

  const tld = domain.split(".").pop() ?? "";

  if (IMAGE_OR_ASSET_TLDS.has(tld)) {
    return true;
  }

  if (REJECTED_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  if (REJECTED_LOCAL_PARTS.has(localPart)) {
    return true;
  }

  if (localPart === "example" || localPart === "test" || localPart === "user") {
    return true;
  }

  if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(localPart)) {
    return true;
  }

  return false;
}

function nameFromAnchorText(text: string, email: string): string | null {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned || cleaned.includes("@") || cleaned.length > 80) {
    return null;
  }

  if (cleaned.toLowerCase() === email.toLowerCase()) {
    return null;
  }

  if (!/^[A-Za-z][A-Za-z .'\-]{1,79}$/.test(cleaned)) {
    return null;
  }

  const words = cleaned.split(" ").filter(Boolean);

  if (words.length < 1 || words.length > 4) {
    return null;
  }

  return cleaned;
}

function collectFromText(
  text: string,
  sourceUrl: string,
  sourceType: ContactSourceType,
  seen: Set<string>,
  results: ExtractedEmailCandidate[],
): void {
  VISIBLE_EMAIL_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(VISIBLE_EMAIL_PATTERN)) {
    const normalized = normalizeEmailAddress(match[0] ?? "");

    if (!normalized || seen.has(normalized) || isRejectedContactEmail(normalized)) {
      continue;
    }

    seen.add(normalized);
    results.push({
      email: normalized,
      normalizedEmail: normalized,
      name: null,
      role: null,
      sourceUrl,
      sourceType,
      viaMailto: false,
    });
  }

  OBFUSCATED_EMAIL_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(OBFUSCATED_EMAIL_PATTERN)) {
    const reconstructed = `${match[1]}@${match[2]}.${match[3]}`;
    const normalized = normalizeEmailAddress(reconstructed);

    if (!normalized || seen.has(normalized) || isRejectedContactEmail(normalized)) {
      continue;
    }

    seen.add(normalized);
    results.push({
      email: normalized,
      normalizedEmail: normalized,
      name: null,
      role: null,
      sourceUrl,
      sourceType,
      viaMailto: false,
    });
  }
}

export function extractEmailsFromHtml(
  html: string,
  sourceUrl: string,
  sourceType: ContactSourceType,
): ExtractedEmailCandidate[] {
  const $ = load(html);
  $("script, style, noscript, svg, iframe, template").remove();

  const seen = new Set<string>();
  const results: ExtractedEmailCandidate[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();

    if (!href || !href.toLowerCase().startsWith("mailto:")) {
      return;
    }

    const normalized = normalizeEmailAddress(href);

    if (!normalized || isRejectedContactEmail(normalized)) {
      return;
    }

    const name = nameFromAnchorText($(element).text(), normalized);

    if (seen.has(normalized)) {
      const existing = results.find((row) => row.normalizedEmail === normalized);

      if (existing && !existing.name && name) {
        existing.name = name;
      }

      return;
    }

    seen.add(normalized);
    results.push({
      email: normalized,
      normalizedEmail: normalized,
      name,
      role: null,
      sourceUrl,
      sourceType,
      viaMailto: true,
    });
  });

  const visibleText = normalizeWhitespace($("body").text() || $.root().text());
  collectFromText(visibleText, sourceUrl, sourceType, seen, results);

  return results;
}

export function dedupeExtractedEmails(
  candidates: ExtractedEmailCandidate[],
): ExtractedEmailCandidate[] {
  const byEmail = new Map<string, ExtractedEmailCandidate>();

  for (const candidate of candidates) {
    const existing = byEmail.get(candidate.normalizedEmail);

    if (!existing) {
      byEmail.set(candidate.normalizedEmail, { ...candidate });
      continue;
    }

    if (!existing.name && candidate.name) {
      existing.name = candidate.name;
    }

    const currentScore = contactSelectionScore({
      sourceType: existing.sourceType,
      confidence: "HIGH",
      name: existing.name,
    });
    const nextScore = contactSelectionScore({
      sourceType: candidate.sourceType,
      confidence: "HIGH",
      name: candidate.name,
    });

    if (nextScore > currentScore || (!existing.viaMailto && candidate.viaMailto)) {
      existing.viaMailto = existing.viaMailto || candidate.viaMailto;
      existing.sourceUrl = candidate.sourceUrl;
      existing.sourceType = candidate.sourceType;
    }
  }

  return [...byEmail.values()];
}
