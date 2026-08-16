import {
  load,
  type CheerioAPI,
} from "cheerio";

import type {
  AuditPageData,
} from "./types";
import {
  buildCanonicalData,
  buildMetaDescriptionData,
  buildTextFieldData,
  normalizeWhitespace,
} from "./page-metadata";

const PHONE_PATTERN =
  /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;

const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const STREET_ADDRESS_PATTERN =
  /\b\d{1,6}\s+[A-Za-z0-9.'#-]+(?:\s+[A-Za-z0-9.'#-]+){0,5}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|parkway|pkwy|highway|hwy|circle|cir|trail|trl|way|place|pl)\b/i;

const LOCAL_TEXT_SIGNALS = [
  "service area",
  "serving",
  "directions",
  "business hours",
  "hours of operation",
  "get directions",
  "visit us",
  "located in",
];

const LOCAL_BUSINESS_SCHEMA_TYPES =
  new Set([
    "LocalBusiness",
    "AutomotiveBusiness",
    "AutoRepair",
    "Dentist",
    "MedicalBusiness",
    "ProfessionalService",
    "HomeAndConstructionBusiness",
    "Electrician",
    "GeneralContractor",
    "HVACBusiness",
    "Plumber",
    "RoofingContractor",
    "Restaurant",
    "Store",
  ]);

function getTrimmedAttribute(
  $: CheerioAPI,
  selector: string,
  attribute: string,
): string | null {
  const value =
    $(selector)
      .first()
      .attr(attribute)
      ?.trim();

  return value || null;
}

function collectNormalizedTexts(
  $: CheerioAPI,
  selector: string,
): string[] {
  const values: string[] = [];

  $(selector).each(
    (
      _,
      element,
    ) => {
      values.push(
        normalizeWhitespace(
          $(element).text(),
        ),
      );
    },
  );

  return values;
}

function collectMetaDescriptionValues(
  $: CheerioAPI,
): string[] {
  const values: string[] = [];

  $("meta[name]").each(
    (
      _,
      element,
    ) => {
      const name =
        $(element)
          .attr("name")
          ?.trim()
          .toLowerCase();

      if (name !== "description") {
        return;
      }

      const content =
        $(element).attr(
          "content",
        );

      values.push(
        content == null
          ? ""
          : content,
      );
    },
  );

  return values;
}

function collectCanonicalHrefs(
  $: CheerioAPI,
): string[] {
  const values: string[] = [];

  $("link[rel]").each(
    (
      _,
      element,
    ) => {
      const relTokens =
        $(element)
          .attr("rel")
          ?.toLowerCase()
          .split(/\s+/)
          .filter(Boolean) ??
        [];

      if (
        !relTokens.includes(
          "canonical",
        )
      ) {
        return;
      }

      values.push(
        $(element).attr(
          "href",
        ) ?? "",
      );
    },
  );

  return values;
}

function normalizeVisibleText(
  $: CheerioAPI,
): string {
  const body =
    $("body").clone();

  body
    .find(
      "script, style, noscript, template, svg",
    )
    .remove();

  return body
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function addSchemaType(
  value: unknown,
  schemaTypes: Set<string>,
): void {
  if (
    typeof value ===
    "string"
  ) {
    schemaTypes.add(
      value,
    );

    return;
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      addSchemaType(
        item,
        schemaTypes,
      );
    }
  }
}

function collectStructuredDataTypes(
  value: unknown,
  schemaTypes: Set<string>,
): void {
  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      collectStructuredDataTypes(
        item,
        schemaTypes,
      );
    }

    return;
  }

  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  addSchemaType(
    record["@type"],
    schemaTypes,
  );

  for (
    const nestedValue of Object.values(
      record,
    )
  ) {
    collectStructuredDataTypes(
      nestedValue,
      schemaTypes,
    );
  }
}

function extractStructuredDataTypes(
  $: CheerioAPI,
): string[] {
  const schemaTypes =
    new Set<string>();

  $(
    'script[type="application/ld+json"]',
  ).each(
    (
      _,
      element,
    ) => {
      const rawJson =
        $(element)
          .html()
          ?.trim();

      if (!rawJson) {
        return;
      }

      try {
        const parsedJson:
          unknown =
          JSON.parse(
            rawJson,
          );

        collectStructuredDataTypes(
          parsedJson,
          schemaTypes,
        );
      } catch {
        // Invalid JSON-LD should not stop the entire audit.
      }
    },
  );

  return [
    ...schemaTypes,
  ].sort(
    (
      a,
      b,
    ) =>
      a.localeCompare(
        b,
      ),
  );
}

function classifyLinks(
  $: CheerioAPI,
  pageUrl: URL,
): {
  internalLinkCount: number;
  externalLinkCount: number;
} {
  let internalLinkCount =
    0;

  let externalLinkCount =
    0;

  $("a[href]").each(
    (
      _,
      element,
    ) => {
      const rawHref =
        $(element)
          .attr("href")
          ?.trim();

      if (
        !rawHref ||
        rawHref.startsWith(
          "#",
        ) ||
        rawHref.startsWith(
          "mailto:",
        ) ||
        rawHref.startsWith(
          "tel:",
        ) ||
        rawHref.startsWith(
          "javascript:",
        )
      ) {
        return;
      }

      try {
        const linkUrl =
          new URL(
            rawHref,
            pageUrl,
          );

        if (
          linkUrl.protocol !==
            "http:" &&
          linkUrl.protocol !==
            "https:"
        ) {
          return;
        }

        if (
          linkUrl.hostname ===
          pageUrl.hostname
        ) {
          internalLinkCount +=
            1;
        } else {
          externalLinkCount +=
            1;
        }
      } catch {
        // Ignore malformed links while continuing the audit.
      }
    },
  );

  return {
    internalLinkCount,
    externalLinkCount,
  };
}

function hasPhysicalAddressSignals(
  visibleText: string,
): boolean {
  if (
    STREET_ADDRESS_PATTERN.test(
      visibleText,
    )
  ) {
    return true;
  }

  return /\b[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(
    visibleText,
  );
}

function hasLocalTextSignals(
  visibleText: string,
): boolean {
  const normalizedText =
    visibleText.toLowerCase();

  return LOCAL_TEXT_SIGNALS.some(
    (signal) =>
      normalizedText.includes(
        signal,
      ),
  );
}

function hasLocalBusinessSchema(
  structuredDataTypes: string[],
): boolean {
  return structuredDataTypes.some(
    (type) =>
      LOCAL_BUSINESS_SCHEMA_TYPES.has(
        type,
      ),
  );
}

export type AnalyzedHtmlPage = Omit<
  AuditPageData,
  "robots"
> & {
  robotsMetaRaw: string | null;
};

export function analyzeHtml(
  html: string,
  finalUrl: string,
): AnalyzedHtmlPage {
  const $ =
    load(html);

  const pageUrl =
    new URL(
      finalUrl,
    );

  const title =
    buildTextFieldData(
      collectNormalizedTexts(
        $,
        "title",
      ),
    );

  const metaDescription =
    buildMetaDescriptionData(
      collectMetaDescriptionValues(
        $,
      ),
    );

  const canonical =
    buildCanonicalData(
      collectCanonicalHrefs(
        $,
      ),
      finalUrl,
    );

  const viewport =
    getTrimmedAttribute(
      $,
      'meta[name="viewport"]',
      "content",
    );

  const robotsMetaRaw =
    getTrimmedAttribute(
      $,
      'meta[name="robots"]',
      "content",
    );

  const h1Values =
    collectNormalizedTexts(
      $,
      "h1",
    );

  const h1Count =
    h1Values.length;

  const h2Count =
    $("h2").length;

  const h3Count =
    $("h3").length;

  const imageCount =
    $("img").length;

  let imagesWithoutAlt =
    0;

  $("img").each(
    (
      _,
      element,
    ) => {
      const alt =
        $(element).attr(
          "alt",
        );

      if (
        alt ===
          undefined ||
        alt.trim() ===
          ""
      ) {
        imagesWithoutAlt +=
          1;
      }
    },
  );

  const {
    internalLinkCount,
    externalLinkCount,
  } =
    classifyLinks(
      $,
      pageUrl,
    );

  const structuredDataTypes =
    extractStructuredDataTypes(
      $,
    );

  const visibleText =
    normalizeVisibleText(
      $,
    );

  const hasPhoneNumber =
    PHONE_PATTERN.test(
      visibleText,
    ) ||
    $(
      'a[href^="tel:"]',
    ).length >
      0;

  const hasEmailAddress =
    EMAIL_PATTERN.test(
      visibleText,
    ) ||
    $(
      'a[href^="mailto:"]',
    ).length >
      0;

  const physicalAddressDetected =
    hasPhysicalAddressSignals(
      visibleText,
    );

  const localBusinessSchemaDetected =
    hasLocalBusinessSchema(
      structuredDataTypes,
    );

  const localTextDetected =
    hasLocalTextSignals(
      visibleText,
    );

  return {
    title,
    metaDescription,
    canonical,
    viewport,

    robotsMetaRaw,

    h1Count,
    h1Values,
    h2Count,
    h3Count,

    imageCount,
    imagesWithoutAlt,

    internalLinkCount,
    externalLinkCount,

    hasOpenGraphTitle:
      $(
        'meta[property="og:title"][content]',
      ).length >
      0,

    hasOpenGraphDescription:
      $(
        'meta[property="og:description"][content]',
      ).length >
      0,

    hasOpenGraphImage:
      $(
        'meta[property="og:image"][content]',
      ).length >
      0,

    hasStructuredData:
      $(
        'script[type="application/ld+json"]',
      ).length >
      0,

    structuredDataTypes,

    hasPhoneNumber,
    hasEmailAddress,

    hasPhysicalAddressSignals:
      physicalAddressDetected,

    hasLocalBusinessSignals:
      localBusinessSchemaDetected ||
      physicalAddressDetected ||
      localTextDetected,
  };
}