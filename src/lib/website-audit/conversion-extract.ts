import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import {
  EMAIL_ADDRESS_PATTERN,
  MAX_CTA_DETAILS,
  MAX_FORM_DETAILS,
  MAX_TRUST_EVIDENCE,
  PHONE_NUMBER_PATTERN,
  TRUST_BODY_PATTERNS,
  buildOfferClarity,
  classifyCtaFromHref,
  classifyCtaText,
  classifyFormPurpose,
  collectIntentMatches,
  countPatternMatches,
  headingTrustCategory,
  isAboutPath,
  isCaseStudyPath,
  isLikelyLeadForm,
  isNonConversionCtaText,
  isPortfolioPath,
  isTeamPath,
  normalizePhrase,
  uniqueStrings,
} from "./page-conversion";
import { isSameSiteUrl, normalizeWhitespace } from "./page-metadata";
import type {
  AuditContentData,
  AuditConversionData,
  AuditCta,
  AuditCtaElementType,
  AuditCtaLocation,
  AuditCtaType,
  AuditFormDetail,
  AuditHeadingData,
  AuditTitleData,
  AuditTrustCategory,
  AuditTrustData,
} from "./types";

const NON_CONTENT_SELECTORS =
  "script, style, noscript, template, svg";

interface ConversionExtractInput {
  pageUrl: URL;
  title: AuditTitleData | string;
  headings: AuditHeadingData;
  content: AuditContentData;
  structuredDataTypes: string[];
  visibleText: string;
}

function controlText($: CheerioAPI, node: Cheerio<AnyNode>): string {
  const tagName = (node.prop("tagName") ?? "").toLowerCase();

  if (tagName === "input") {
    return normalizeWhitespace(
      node.attr("value") ??
        node.attr("aria-label") ??
        node.attr("title") ??
        "",
    );
  }

  const clone = node.clone();
  clone.find(NON_CONTENT_SELECTORS).remove();

  return normalizeWhitespace(
    clone.text() ||
      node.attr("aria-label") ||
      node.attr("title") ||
      "",
  );
}

function getSemanticLocation(
  $: CheerioAPI,
  node: Cheerio<AnyNode>,
): AuditCtaLocation {
  if (node.closest("nav").length > 0) {
    return "navigation";
  }

  if (node.closest("header").length > 0) {
    return "header";
  }

  if (node.closest("main, [role='main']").length > 0) {
    return "main";
  }

  if (node.closest("footer").length > 0) {
    return "footer";
  }

  return "other";
}

function addUniqueLocation(
  locations: Set<AuditCtaLocation>,
  location: AuditCtaLocation,
): void {
  locations.add(location);
}

function isUserEntryField(type: string): boolean {
  return ![
    "hidden",
    "submit",
    "button",
    "reset",
    "image",
    "checkbox",
    "radio",
  ].includes(type);
}

function collectFieldHints(
  $: CheerioAPI,
  form: Cheerio<AnyNode>,
): string[] {
  const hints: string[] = [];

  form.find("input, textarea, select").each((_, element) => {
    const field = $(element);
    const type = (field.attr("type") ?? "text").toLowerCase();

    if (["hidden", "submit", "button", "reset", "image"].includes(type)) {
      return;
    }

    hints.push(
      type,
      field.attr("name") ?? "",
      field.attr("id") ?? "",
      field.attr("placeholder") ?? "",
      field.attr("aria-label") ?? "",
    );
  });

  form.find("label").each((_, element) => {
    hints.push($(element).text());
  });

  return hints
    .map((hint) => normalizePhrase(hint))
    .filter(Boolean);
}

function countUserEntryFields(
  $: CheerioAPI,
  form: Cheerio<AnyNode>,
): number {
  let count = 0;

  form.find("input, textarea, select").each((_, element) => {
    const type = ($(element).attr("type") ?? "text").toLowerCase();

    if (isUserEntryField(type)) {
      count += 1;
    }
  });

  return count;
}

function formHasSubmitControl(
  $: CheerioAPI,
  form: Cheerio<AnyNode>,
): boolean {
  if (
    form.find('input[type="submit"], input[type="image"]').length > 0
  ) {
    return true;
  }

  let matched = false;

  form.find("button").each((_, element) => {
    const type = ($(element).attr("type") ?? "submit").toLowerCase();

    if (type === "submit") {
      matched = true;
    }
  });

  return matched;
}

function collectFormSubmitText(
  $: CheerioAPI,
  form: Cheerio<AnyNode>,
): string {
  const parts: string[] = [];

  form
    .find('button, input[type="submit"], input[type="button"]')
    .each((_, element) => {
      parts.push(controlText($, $(element)));
    });

  return parts.join(" ");
}

function hrefProtocolType(href: string | null): AuditCtaType | null {
  return classifyCtaFromHref(href);
}

function resolveHref(
  href: string | null,
  pageUrl: URL,
): {
  resolved: URL | null;
  isInternal: boolean | null;
} {
  if (!href) {
    return { resolved: null, isInternal: null };
  }

  const lowered = href.toLowerCase();

  if (
    lowered.startsWith("tel:") ||
    lowered.startsWith("mailto:") ||
    lowered.startsWith("javascript:")
  ) {
    return { resolved: null, isInternal: null };
  }

  try {
    const resolved = new URL(href, pageUrl);

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return { resolved: null, isInternal: null };
    }

    return {
      resolved,
      isInternal: isSameSiteUrl(resolved, pageUrl),
    };
  } catch {
    return { resolved: null, isInternal: null };
  }
}

function incrementCtaType(
  counts: Record<AuditCtaType, number>,
  type: AuditCtaType,
): void {
  counts[type] += 1;
}

function extractCtas(
  $: CheerioAPI,
  pageUrl: URL,
  locations: Set<AuditCtaLocation>,
): {
  ctas: AuditCta[];
  telLinkCount: number;
  mailtoLinkCount: number;
} {
  const ctas: AuditCta[] = [];
  let telLinkCount = 0;
  let mailtoLinkCount = 0;

  $("a[href], button, input[type='submit'], input[type='button']").each(
    (_, element) => {
      const node = $(element);
      const tagName = (node.prop("tagName") ?? "").toLowerCase();
      const href = node.attr("href")?.trim() ?? null;
      const loweredHref = href?.toLowerCase() ?? "";

      if (tagName !== "a" && node.closest("a").length > 0) {
        return;
      }

      if (loweredHref.startsWith("tel:")) {
        telLinkCount += 1;
      }

      if (loweredHref.startsWith("mailto:")) {
        mailtoLinkCount += 1;
      }

      const text = controlText($, node);

      if (href && isNonConversionCtaText(text) && !hrefProtocolType(href)) {
        return;
      }

      const type =
        hrefProtocolType(href) ?? classifyCtaText(text);

      if (!type) {
        return;
      }

      const location = getSemanticLocation($, node);
      addUniqueLocation(locations, location);
      const { isInternal } = resolveHref(href, pageUrl);
      const inputType = (node.attr("type") ?? "").toLowerCase();
      const elementType: AuditCtaElementType =
        tagName === "a"
          ? "link"
          : inputType === "submit" ||
              ((tagName === "button" || tagName === "input") &&
                (node.attr("type") ?? "submit").toLowerCase() === "submit")
            ? "submit"
            : "button";

      ctas.push({
        text,
        elementType,
        href,
        type,
        location,
        isInternal,
      });
    },
  );

  return { ctas, telLinkCount, mailtoLinkCount };
}

function extractForms(
  $: CheerioAPI,
  locations: Set<AuditCtaLocation>,
): {
  details: AuditFormDetail[];
  totalForms: number;
  totalInputFields: number;
  maxFieldsInSingleForm: number;
  formsWithSubmitControl: number;
} {
  const details: AuditFormDetail[] = [];
  let totalForms = 0;
  let totalInputFields = 0;
  let maxFieldsInSingleForm = 0;
  let formsWithSubmitControl = 0;

  $("form").each((_, element) => {
    const form = $(element);
    totalForms += 1;

    const fieldCount = countUserEntryFields($, form);
    totalInputFields += fieldCount;
    maxFieldsInSingleForm = Math.max(maxFieldsInSingleForm, fieldCount);

    const hasSubmitControl = formHasSubmitControl($, form);

    if (hasSubmitControl) {
      formsWithSubmitControl += 1;
    }

    const fieldHints = collectFieldHints($, form);
    const submitText = collectFormSubmitText($, form);
    const purposeGuess = classifyFormPurpose({
      role: (form.attr("role") ?? "").toLowerCase() || null,
      className: form.attr("class") ?? null,
      fieldHints,
      submitText,
      formText: form.text(),
      hasPassword: form.find('input[type="password"]').length > 0,
      hasSearchInput: form.find('input[type="search"]').length > 0,
    });
    const location = getSemanticLocation($, form);

    if (isLikelyLeadForm(purposeGuess)) {
      addUniqueLocation(locations, location);
    }

    details.push({
      purposeGuess,
      fieldCount,
      hasSubmitControl,
      location,
    });
  });

  return {
    details,
    totalForms,
    totalInputFields,
    maxFieldsInSingleForm,
    formsWithSubmitControl,
  };
}

function extractTrust(
  $: CheerioAPI,
  pageUrl: URL,
  headings: AuditHeadingData,
  structuredDataTypes: string[],
  visibleText: string,
): AuditTrustData {
  const counts: Record<AuditTrustCategory, number> = {
    testimonials: 0,
    reviews: 0,
    guarantee: 0,
    warranty: 0,
    certification: 0,
    license: 0,
    insured: 0,
    experience: 0,
    about: 0,
    team: 0,
    "case-study": 0,
    portfolio: 0,
  };
  const evidence: string[] = [];

  const addSignal = (category: AuditTrustCategory, sample: string) => {
    counts[category] += 1;

    if (evidence.length < MAX_TRUST_EVIDENCE) {
      evidence.push(normalizeWhitespace(sample).slice(0, 80));
    }
  };

  for (const heading of headings.items) {
    const category = headingTrustCategory(heading.text);

    if (category) {
      addSignal(category, heading.text);
    }
  }

  if (
    structuredDataTypes.some(
      (type) => type === "Review" || type === "AggregateRating",
    )
  ) {
    addSignal("reviews", "structured data: Review/AggregateRating");
  }

  $("a[href]").each((_, element) => {
    const node = $(element);
    const href = node.attr("href")?.trim();

    if (!href) {
      return;
    }

    const { resolved, isInternal } = resolveHref(href, pageUrl);

    if (!isInternal || !resolved) {
      return;
    }

    const pathname = resolved.pathname;
    const text = controlText($, node);

    if (isAboutPath(pathname) || headingTrustCategory(text) === "about") {
      addSignal("about", text || pathname);
    }

    if (isTeamPath(pathname) || headingTrustCategory(text) === "team") {
      addSignal("team", text || pathname);
    }

    if (
      isPortfolioPath(pathname) ||
      headingTrustCategory(text) === "portfolio"
    ) {
      addSignal("portfolio", text || pathname);
    }

    if (
      isCaseStudyPath(pathname) ||
      headingTrustCategory(text) === "case-study"
    ) {
      addSignal("case-study", text || pathname);
    }
  });

  for (const { category, pattern } of TRUST_BODY_PATTERNS) {
    const matches = visibleText.match(
      new RegExp(pattern.source, `${pattern.flags}g`),
    );

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      addSignal(category, match);
    }
  }

  const presentCategories = (
    Object.keys(counts) as AuditTrustCategory[]
  ).filter((category) => counts[category] > 0);

  return {
    testimonialSignals: counts.testimonials,
    reviewSignals: counts.reviews,
    guaranteeSignals: counts.guarantee,
    warrantySignals: counts.warranty,
    certificationSignals: counts.certification,
    licenseSignals: counts.license,
    insuredSignals: counts.insured,
    experienceSignals: counts.experience,
    aboutSignals: counts.about,
    teamSignals: counts.team,
    caseStudySignals: counts["case-study"],
    portfolioSignals: counts.portfolio,
    trustCategoryCount: presentCategories.length,
    presentCategories,
    evidence,
    detailsTruncated: evidence.length >= MAX_TRUST_EVIDENCE,
  };
}

export function extractConversionData(
  $: CheerioAPI,
  input: ConversionExtractInput,
): AuditConversionData {
  const locations = new Set<AuditCtaLocation>();
  const { ctas, telLinkCount, mailtoLinkCount } = extractCtas(
    $,
    input.pageUrl,
    locations,
  );
  const forms = extractForms($, locations);
  const typeCounts: Record<AuditCtaType, number> = {
    phone: 0,
    email: 0,
    contact: 0,
    quote: 0,
    estimate: 0,
    booking: 0,
    consultation: 0,
    service: 0,
    "generic-conversion": 0,
  };

  for (const cta of ctas) {
    incrementCtaType(typeCounts, cta.type);
  }

  const uniqueTypes = (
    Object.keys(typeCounts) as AuditCtaType[]
  ).filter((type) => typeCounts[type] > 0);
  const leadForms = forms.details.filter((form) =>
    isLikelyLeadForm(form.purposeGuess),
  );
  const likelyLeadFormCount = leadForms.length;
  const maxLeadFormFields = leadForms.reduce(
    (maximum, form) => Math.max(maximum, form.fieldCount),
    0,
  );
  const intent = collectIntentMatches([
    input.visibleText,
    ...input.headings.items.map((item) => item.text),
    ...ctas.map((cta) => cta.text),
  ]);
  const visiblePhoneCount = countPatternMatches(
    input.visibleText,
    PHONE_NUMBER_PATTERN,
  );
  const visibleEmailCount = countPatternMatches(
    input.visibleText,
    EMAIL_ADDRESS_PATTERN,
  );
  const trust = extractTrust(
    $,
    input.pageUrl,
    input.headings,
    input.structuredDataTypes,
    input.visibleText,
  );
  const pathTypes = uniqueStrings([
    ...uniqueTypes,
    ...(likelyLeadFormCount > 0 ? ["form"] : []),
    ...(telLinkCount > 0 ? ["phone"] : []),
    ...(mailtoLinkCount > 0 ? ["email"] : []),
  ]);

  return {
    ctas: {
      count: ctas.length,
      uniqueTypes,
      phoneCtaCount: typeCounts.phone,
      contactCtaCount: typeCounts.contact,
      quoteCtaCount: typeCounts.quote + typeCounts.estimate,
      bookingCtaCount: typeCounts.booking,
      details: ctas.slice(0, MAX_CTA_DETAILS),
      detailsTruncated: ctas.length > MAX_CTA_DETAILS,
    },
    forms: {
      totalForms: forms.totalForms,
      contactLikeForms: likelyLeadFormCount,
      formsWithSubmitControl: forms.formsWithSubmitControl,
      formsWithoutSubmitControl:
        forms.totalForms - forms.formsWithSubmitControl,
      totalInputFields: forms.totalInputFields,
      maxFieldsInSingleForm: forms.maxFieldsInSingleForm,
      likelyLeadFormCount,
      maxLeadFormFields,
      details: forms.details.slice(0, MAX_FORM_DETAILS),
      detailsTruncated: forms.details.length > MAX_FORM_DETAILS,
    },
    phone: {
      visiblePhonePresent: visiblePhoneCount > 0,
      visiblePhoneCount,
      telLinkCount,
      phoneCtaCount: typeCounts.phone,
    },
    email: {
      visibleEmailPresent: visibleEmailCount > 0,
      mailtoLinkCount,
    },
    trust,
    intent,
    offerClarity: buildOfferClarity({
      title: input.title,
      headings: input.headings,
      content: input.content,
      hasConversionIntent: intent.phraseCount > 0,
    }),
    path: {
      hasClickToCall: telLinkCount > 0,
      hasLeadForm: likelyLeadFormCount > 0,
      hasMailto: mailtoLinkCount > 0,
      hasQuoteCta: typeCounts.quote + typeCounts.estimate > 0,
      hasBookingCta: typeCounts.booking > 0,
      hasConsultationCta: typeCounts.consultation > 0,
      hasContactCta: typeCounts.contact > 0,
      pathTypes,
      locations: [...locations],
    },
  };
}
