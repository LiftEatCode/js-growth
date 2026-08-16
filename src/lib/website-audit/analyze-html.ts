import {
  load,
  type CheerioAPI,
} from "cheerio";

import type {
  AuditPageData,
  AuditPerformanceDocumentContext,
} from "./types";
import {
  buildCanonicalData,
  buildMetaDescriptionData,
  buildTextFieldData,
  normalizeWhitespace,
} from "./page-metadata";
import {
  extractContentData,
  extractHeadingData,
  extractImageData,
  extractLinkData,
  extractVisibleText,
} from "./content-extract";
import { extractConversionData } from "./conversion-extract";
import {
  extractStructuredDataTypes,
  parseJsonLdDocuments,
} from "./json-ld";
import { extractLocalData } from "./local-extract";
import { extractPerformanceData } from "./performance-extract";

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

export type AnalyzedHtmlPage = Omit<
  AuditPageData,
  "robots"
> & {
  robotsMetaRaw: string | null;
};

export function analyzeHtml(
  html: string,
  finalUrl: string,
  document?: AuditPerformanceDocumentContext,
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

  const headings =
    extractHeadingData(
      $,
    );

  const images =
    extractImageData(
      $,
    );

  const {
    externalLinkCount,
    ...links
  } =
    extractLinkData(
      $,
      pageUrl,
    );

  const content =
    extractContentData(
      $,
    );

  const jsonLdDocuments =
    parseJsonLdDocuments(
      $,
    );

  const structuredDataTypes =
    extractStructuredDataTypes(
      jsonLdDocuments,
    );

  const visibleText =
    extractVisibleText(
      $,
    );

  const conversion =
    extractConversionData($, {
      pageUrl,
      title,
      headings,
      content,
      structuredDataTypes,
      visibleText,
    });

  const local =
    extractLocalData($, {
      pageUrl,
      title,
      headings,
      content,
      visibleText,
      jsonLdDocuments,
      conversion,
    });

  const performance = extractPerformanceData(
    $,
    pageUrl,
    html,
    document,
  );

  const hasPhoneNumber =
    conversion.phone.visiblePhonePresent ||
    conversion.phone.telLinkCount > 0;

  const hasEmailAddress =
    conversion.email.visibleEmailPresent ||
    conversion.email.mailtoLinkCount > 0;

  return {
    title,
    metaDescription,
    canonical,
    viewport,

    robotsMetaRaw,

    content,
    headings,
    links,
    images,
    conversion,
    local,
    performance,

    h1Count:
      headings.h1Count,
    h1Values:
      headings.h1Values,
    h2Count:
      headings.h2Count,
    h3Count:
      headings.h3Count,

    imageCount:
      images.total,
    imagesWithoutAlt:
      images.missingAltAttribute,

    internalLinkCount:
      links.internalLinkCount,
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
      local.nap.hasAddressSignal,

    hasLocalBusinessSignals:
      local.likelihood.likelyLocalBusiness ||
      local.schema.hasLocalBusinessSchema ||
      local.nap.hasAddressSignal,
  };
}