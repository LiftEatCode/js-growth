import { load } from "cheerio";
import type { Element } from "domhandler";

import { normalizeWhitespace } from "@/lib/website-audit/page-metadata";

import type { ContactSourceType } from "./types";
import type {
  DetectedContactFormFields,
  ExtractedContactFormCandidate,
} from "./form-types";

const REJECTED_FORM_PATTERN =
  /newsletter|subscribe|subscription|signup|sign-up|sign_up|login|log-in|log_in|signin|sign-in|register|registration|search|checkout|payment|cart|job|career|apply\b|application|portal|review|rating|comment-form|financing|loan|account|password|wp-login|woocommerce/i;

const POSITIVE_FORM_PATTERN =
  /contact|message|inquiry|enquiry|quote|estimate|request service|get in touch|schedule|reach out|ask a question|how can we help|service request|describe your problem|elementor-form|wpcf7|contact-form|gravityform|wpforms|formidable|fluentform/i;

const NAME_FIELD_PATTERN =
  /\b(name|fname|lname|firstname|lastname|full_?name|your-?name|form_fields\[name\])\b/i;
const EMAIL_FIELD_PATTERN =
  /\b(email|e-mail|mail|form_fields\[email\]|form_fields\[message\])\b/i;
const PHONE_FIELD_PATTERN =
  /\b(phone|tel|mobile|cell|form_fields\[phone\])\b/i;
const SUBJECT_FIELD_PATTERN = /\b(subject|topic|regarding)\b/i;
const MESSAGE_FIELD_PATTERN =
  /\b(message|comment|comments|body|inquiry|enquiry|details|question|description|notes|how can we help|problem|form_fields\[field_|textarea)\b/i;
const SERVICE_FIELD_PATTERN =
  /\b(service|estimate|quote|appointment|address|city|zip|preferred date)\b/i;

const CONTACT_ANCHOR_PATTERN =
  /\b(contact us|contact|get in touch|request service|request an estimate|free estimate|get a quote|request a quote|schedule service|book service|schedule appointment|service request)\b/i;

const KNOWN_FORM_PROVIDER_PATTERN =
  /(jotform|typeform|wufoo|formstack|hubspot|hsforms|google\.com\/forms|docs\.google\.com\/forms|submissions\.hubspot|form\.jotform|mycontactform|123formbuilder|paperform|tally\.so|surveymonkey|cognitoforms|formspree\.io)/i;

export interface ContactFormExtractionStats {
  rawForms: number;
  rejectedForms: number;
  acceptedForms: number;
  iframeCandidates: number;
  externalLinks: number;
}

function fieldToken(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function collectFieldTokens(
  $: ReturnType<typeof load>,
  element: Element,
): string[] {
  const tokens: string[] = [];
  const attrs = ["name", "id", "placeholder", "aria-label", "type", "class"];

  for (const attr of attrs) {
    const value = $(element).attr(attr);

    if (value) {
      tokens.push(fieldToken(value));
    }
  }

  const label = $(element).attr("id")
    ? $(`label[for="${$(element).attr("id")}"]`).text()
    : $(element).closest("label").text();

  if (label) {
    tokens.push(fieldToken(label));
  }

  return tokens;
}

function detectFields(
  $: ReturnType<typeof load>,
  form: ReturnType<ReturnType<typeof load>>,
): DetectedContactFormFields {
  const fields = {
    hasName: false,
    hasEmail: false,
    hasPhone: false,
    hasSubject: false,
    hasMessage: false,
  };

  form.find("input, textarea, select").each((_, element) => {
    const type = fieldToken($(element).attr("type"));
    const tokens = collectFieldTokens($, element);
    const combined = tokens.join(" ");

    if (type === "hidden" || type === "submit" || type === "button") {
      return;
    }

    if (type === "email" || EMAIL_FIELD_PATTERN.test(combined)) {
      fields.hasEmail = true;
    }

    if (type === "tel" || PHONE_FIELD_PATTERN.test(combined)) {
      fields.hasPhone = true;
    }

    if (NAME_FIELD_PATTERN.test(combined)) {
      fields.hasName = true;
    }

    if (SUBJECT_FIELD_PATTERN.test(combined)) {
      fields.hasSubject = true;
    }

    if (
      element.tagName === "textarea" ||
      MESSAGE_FIELD_PATTERN.test(combined) ||
      SERVICE_FIELD_PATTERN.test(combined)
    ) {
      fields.hasMessage = true;
    }
  });

  return fields;
}

function hasSubmitControl(
  $: ReturnType<typeof load>,
  form: ReturnType<ReturnType<typeof load>>,
): boolean {
  return (
    form.find(
      'input[type="submit"], button[type="submit"], button:not([type]), input[type="button"]',
    ).length > 0
  );
}

function formContextText(
  $: ReturnType<typeof load>,
  form: ReturnType<ReturnType<typeof load>>,
): string {
  const id = form.attr("id") ?? "";
  const className = form.attr("class") ?? "";
  const action = form.attr("action") ?? "";
  const heading = form.prevAll("h1,h2,h3,h4").first().text();
  const legend = form.find("legend").first().text();
  const buttonText = form
    .find(
      'input[type="submit"], button[type="submit"], button:not([type]), input[type="button"]',
    )
    .map((_, element) => $(element).text() || $(element).attr("value") || "")
    .get()
    .join(" ");

  return normalizeWhitespace(
    [id, className, action, heading, legend, buttonText].join(" "),
  ).toLowerCase();
}

function resolveFormUrl(
  pageUrl: string,
  formAction: string | null | undefined,
): string {
  try {
    if (!formAction || formAction.trim() === "" || formAction.startsWith("#")) {
      return pageUrl.split("#")[0] ?? pageUrl;
    }

    return new URL(formAction, pageUrl).toString().split("#")[0] ?? pageUrl;
  } catch {
    return pageUrl.split("#")[0] ?? pageUrl;
  }
}

export function normalizeContactFormUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

function scoreConfidence(
  sourceType: ContactSourceType,
  fields: DetectedContactFormFields,
): { confidence: "HIGH" | "MEDIUM" | "LOW"; reason: string } {
  const contactPage =
    sourceType === "WEBSITE_CONTACT_PAGE" || sourceType === "CONTACT_PAGE";

  if (fields.hasMessage && (fields.hasName || fields.hasEmail || fields.hasPhone) && contactPage) {
    return {
      confidence: "HIGH",
      reason: "Contact page form with message and identity fields.",
    };
  }

  if ((fields.hasName || fields.hasEmail) && fields.hasPhone && contactPage) {
    return {
      confidence: "HIGH",
      reason: "Contact page form with identity and phone fields.",
    };
  }

  if (fields.hasMessage) {
    return {
      confidence: contactPage ? "HIGH" : "MEDIUM",
      reason: contactPage
        ? "Contact page form with a message field."
        : "Public form with a message field.",
    };
  }

  return {
    confidence: "LOW",
    reason: "Form matched with limited message evidence.",
  };
}

function isRejectedForm(context: string): boolean {
  return REJECTED_FORM_PATTERN.test(context);
}

function isLikelyInquiryForm(
  context: string,
  fields: DetectedContactFormFields,
  sourceType: ContactSourceType,
): boolean {
  if (fields.hasMessage) {
    return true;
  }

  const contactPage =
    sourceType === "WEBSITE_CONTACT_PAGE" || sourceType === "CONTACT_PAGE";

  if (
    contactPage &&
    (fields.hasName || fields.hasEmail) &&
    (fields.hasPhone || fields.hasSubject)
  ) {
    return true;
  }

  if (contactPage && fields.hasName && fields.hasEmail && fields.hasPhone) {
    return true;
  }

  return POSITIVE_FORM_PATTERN.test(context);
}

function isSafeEmbeddedFormUrl(url: string, pageUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const page = new URL(pageUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (
      parsed.hostname === page.hostname ||
      parsed.hostname.endsWith(`.${page.hostname.replace(/^www\./, "")}`)
    ) {
      return true;
    }

    return KNOWN_FORM_PROVIDER_PATTERN.test(parsed.hostname + parsed.pathname);
  } catch {
    return false;
  }
}

function extractIframeForms(
  html: string,
  pageUrl: string,
  sourceType: ContactSourceType,
): ExtractedContactFormCandidate[] {
  const $ = load(html);
  const results: ExtractedContactFormCandidate[] = [];
  const seen = new Set<string>();

  $("iframe[src]").each((_, element) => {
    const src = $(element).attr("src")?.trim();

    if (!src) {
      return;
    }

    let resolved: string;

    try {
      resolved = new URL(src, pageUrl).toString();
    } catch {
      return;
    }

    if (!isSafeEmbeddedFormUrl(resolved, pageUrl)) {
      return;
    }

    const title = $(element).attr("title") ?? "";
    const context = normalizeWhitespace(
      [title, resolved, $(element).attr("class") ?? ""].join(" "),
    ).toLowerCase();

    if (isRejectedForm(context)) {
      return;
    }

    if (
      !KNOWN_FORM_PROVIDER_PATTERN.test(resolved) &&
      !/contact|form|quote|estimate|schedule|request/i.test(context + resolved)
    ) {
      return;
    }

    const normalizedUrl = normalizeContactFormUrl(resolved);

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);
    const scored = scoreConfidence(sourceType, {
      hasName: true,
      hasEmail: true,
      hasPhone: false,
      hasSubject: false,
      hasMessage: true,
    });

    results.push({
      url: resolved,
      normalizedUrl,
      sourcePageUrl: pageUrl,
      formMethod: "GET",
      formAction: resolved,
      detectedFields: {
        hasName: true,
        hasEmail: true,
        hasPhone: false,
        hasSubject: false,
        hasMessage: true,
      },
      confidence: scored.confidence,
      confidenceReason: "Embedded iframe contact form.",
    });
  });

  return results;
}

function extractExternalFormLinks(
  html: string,
  pageUrl: string,
): ExtractedContactFormCandidate[] {
  const $ = load(html);
  const results: ExtractedContactFormCandidate[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();
    const text = normalizeWhitespace($(element).text()).toLowerCase();

    if (!href) {
      return;
    }

    let resolved: string;

    try {
      resolved = new URL(href, pageUrl).toString();
    } catch {
      return;
    }

    if (!KNOWN_FORM_PROVIDER_PATTERN.test(resolved)) {
      return;
    }

    if (
      !CONTACT_ANCHOR_PATTERN.test(text) &&
      !KNOWN_FORM_PROVIDER_PATTERN.test(resolved)
    ) {
      return;
    }

    const normalizedUrl = normalizeContactFormUrl(resolved);

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);

    results.push({
      url: resolved,
      normalizedUrl,
      sourcePageUrl: pageUrl,
      formMethod: "GET",
      formAction: resolved,
      detectedFields: {
        hasName: true,
        hasEmail: true,
        hasPhone: false,
        hasSubject: false,
        hasMessage: true,
      },
      confidence: "MEDIUM",
      confidenceReason: "External hosted contact form link.",
    });
  });

  return results;
}

export function extractContactFormsFromHtml(
  html: string,
  pageUrl: string,
  sourceType: ContactSourceType,
): ExtractedContactFormCandidate[] {
  const $ = load(html);
  $("script, style, noscript, svg, template").remove();

  const results: ExtractedContactFormCandidate[] = [];
  const seen = new Set<string>();

  $("form").each((_, formElement) => {
    const form = $(formElement);
    const context = formContextText($, form);

    if (isRejectedForm(context)) {
      return;
    }

    const fields = detectFields($, form);

    if (!hasSubmitControl($, form)) {
      return;
    }

    if (!isLikelyInquiryForm(context, fields, sourceType)) {
      return;
    }

    const formMethod = form.attr("method")?.trim().toLowerCase() ?? null;
    const formAction = form.attr("action")?.trim() ?? null;
    const url = resolveFormUrl(pageUrl, formAction);
    const normalizedUrl = normalizeContactFormUrl(url);

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);

    const scored = scoreConfidence(sourceType, fields);

    results.push({
      url,
      normalizedUrl,
      sourcePageUrl: pageUrl,
      formMethod,
      formAction,
      detectedFields: fields,
      confidence: scored.confidence,
      confidenceReason: scored.reason,
    });
  });

  const iframeForms = extractIframeForms(html, pageUrl, sourceType);
  const externalForms = extractExternalFormLinks(html, pageUrl);

  for (const candidate of [...iframeForms, ...externalForms]) {
    if (seen.has(candidate.normalizedUrl)) {
      continue;
    }

    seen.add(candidate.normalizedUrl);
    results.push(candidate);
  }

  return results;
}

export function summarizeContactFormExtraction(
  html: string,
  pageUrl: string,
  sourceType: ContactSourceType,
): ContactFormExtractionStats {
  const $ = load(html);
  const rawForms = $("form").length;
  const accepted = extractContactFormsFromHtml(html, pageUrl, sourceType);

  return {
    rawForms,
    rejectedForms: Math.max(0, rawForms - accepted.filter((row) => row.sourcePageUrl === pageUrl && !row.confidenceReason.includes("iframe")).length),
    acceptedForms: accepted.length,
    iframeCandidates: $("iframe[src]").length,
    externalLinks: accepted.filter((row) =>
      row.confidenceReason.includes("External hosted"),
    ).length,
  };
}

export function dedupeExtractedContactForms(
  candidates: ExtractedContactFormCandidate[],
): ExtractedContactFormCandidate[] {
  const byUrl = new Map<string, ExtractedContactFormCandidate>();

  for (const candidate of candidates) {
    const existing = byUrl.get(candidate.normalizedUrl);

    if (!existing) {
      byUrl.set(candidate.normalizedUrl, candidate);
      continue;
    }

    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const nextRank = rank[candidate.confidence];
    const currentRank = rank[existing.confidence];

    if (nextRank > currentRank) {
      byUrl.set(candidate.normalizedUrl, candidate);
    }
  }

  return [...byUrl.values()];
}
