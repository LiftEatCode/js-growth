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
  /contact|message|inquiry|enquiry|quote|estimate|request service|get in touch|schedule|reach out|ask a question|how can we help|service request/i;

const NAME_FIELD_PATTERN =
  /\b(name|fname|lname|firstname|lastname|full_?name|your-?name)\b/i;
const EMAIL_FIELD_PATTERN = /\b(email|e-mail|mail)\b/i;
const PHONE_FIELD_PATTERN = /\b(phone|tel|mobile|cell)\b/i;
const SUBJECT_FIELD_PATTERN = /\b(subject|topic|regarding)\b/i;
const MESSAGE_FIELD_PATTERN =
  /\b(message|comment|comments|body|inquiry|enquiry|details|question|description|notes|how can we help)\b/i;

function fieldToken(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function collectFieldTokens(
  $: ReturnType<typeof load>,
  element: Element,
): string[] {
  const tokens: string[] = [];
  const attrs = ["name", "id", "placeholder", "aria-label", "type"];

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
      MESSAGE_FIELD_PATTERN.test(combined)
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
    form.find('input[type="submit"], button[type="submit"], button:not([type])')
      .length > 0
  );
}

function formContextText(
  $: ReturnType<typeof load>,
  form: ReturnType<ReturnType<typeof load>>,
): string {
  const id = form.attr("id");
  const className = form.attr("class") ?? "";
  const action = form.attr("action") ?? "";
  const heading = form.prevAll("h1,h2,h3,h4").first().text();
  const legend = form.find("legend").first().text();
  const buttonText = form
    .find('input[type="submit"], button[type="submit"], button:not([type])')
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
      return pageUrl;
    }

    return new URL(formAction, pageUrl).toString();
  } catch {
    return pageUrl;
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

  if (fields.hasMessage && (fields.hasName || fields.hasEmail) && contactPage) {
    return {
      confidence: "HIGH",
      reason: "Contact page form with message and identity fields.",
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
): boolean {
  if (fields.hasMessage) {
    return true;
  }

  return POSITIVE_FORM_PATTERN.test(context);
}

export function extractContactFormsFromHtml(
  html: string,
  pageUrl: string,
  sourceType: ContactSourceType,
): ExtractedContactFormCandidate[] {
  const $ = load(html);
  $("script, style, noscript, svg, iframe, template").remove();

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

    if (!isLikelyInquiryForm(context, fields)) {
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

  return results;
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
