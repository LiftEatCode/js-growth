import type { CheerioAPI } from "cheerio";

import {
  asJsonList,
  asJsonRecord,
  collectJsonLdNodes,
  plainSchemaString,
  schemaTypesOf,
} from "./json-ld";
import { isAuditTitleData, normalizeWhitespace } from "./page-metadata";
import {
  LOCAL_BUSINESS_EVIDENCE_THRESHOLD,
  LOCAL_BUSINESS_SCHEMA_TYPES,
  MAX_SERVICE_AREA_LOCATIONS,
  boundLocalEvidence,
  boundLocalitySignals,
  collectCityStateSignals,
  collectServiceAreaMentions,
  collectStreetAddresses,
  hasServiceAreaLanguage,
  hasTwentyFourSevenSignal,
  hasVisibleHoursSignal,
  isLocationPath,
  isServiceAreaPath,
  looksLikeSaasMarketing,
  textContainsPhrase,
  uniqueLocalValues,
} from "./page-local";
import type {
  AuditContentData,
  AuditConversionData,
  AuditHeadingData,
  AuditHoursData,
  AuditLocalBusinessLikelihood,
  AuditLocalData,
  AuditLocalPageType,
  AuditLocalSchemaData,
  AuditLocalitySignal,
  AuditNapData,
  AuditServiceAreaData,
  AuditTitleData,
} from "./types";

interface LocalExtractInput {
  pageUrl: URL;
  title: AuditTitleData | string;
  headings: AuditHeadingData;
  content: AuditContentData;
  visibleText: string;
  jsonLdDocuments: unknown[];
  conversion: AuditConversionData;
}

function nodeIsLocalBusiness(node: Record<string, unknown>): boolean {
  return schemaTypesOf(node).some((type) =>
    LOCAL_BUSINESS_SCHEMA_TYPES.has(type),
  );
}

function nodeIsOrganization(node: Record<string, unknown>): boolean {
  return schemaTypesOf(node).includes("Organization");
}

function addressRecord(
  value: unknown,
): Record<string, unknown> | null {
  const record = asJsonRecord(value);

  if (record) {
    return record;
  }

  for (const item of asJsonList(value)) {
    const nested = asJsonRecord(item);

    if (nested) {
      return nested;
    }
  }

  return null;
}

function schemaHasAddressValue(value: unknown): boolean {
  if (plainSchemaString(value)) {
    return true;
  }

  const record = addressRecord(value);

  if (!record) {
    return false;
  }

  return Boolean(
    plainSchemaString(record.streetAddress) ||
      plainSchemaString(record.addressLocality) ||
      plainSchemaString(record.addressRegion) ||
      plainSchemaString(record.postalCode),
  );
}

function looksLikeMapUrl(href: string): boolean {
  const lowered = href.toLowerCase();

  return (
    lowered.includes("maps.google.") ||
    lowered.includes("google.com/maps") ||
    lowered.includes("maps.apple.com") ||
    lowered.includes("goo.gl/maps")
  );
}

function extractLocalSchema(
  documents: unknown[],
): {
  schema: AuditLocalSchemaData;
  schemaName: string | null;
  schemaLocalities: string[];
  schemaAreaServed: string[];
} {
  const nodes = documents.flatMap((document) => collectJsonLdNodes(document));
  const localNodes = nodes.filter(nodeIsLocalBusiness);
  const organizationNodes = nodes.filter(nodeIsOrganization);
  const detectedTypes = uniqueLocalValues(
    localNodes.flatMap((node) =>
      schemaTypesOf(node).filter((type) =>
        LOCAL_BUSINESS_SCHEMA_TYPES.has(type),
      ),
    ),
  );
  const primary = localNodes[0] ?? null;
  const nameSource = primary ?? organizationNodes[0] ?? null;
  const schemaName = nameSource
    ? plainSchemaString(nameSource.name)
    : null;
  const addressRecords = localNodes
    .map((node) => addressRecord(node.address))
    .filter((record): record is Record<string, unknown> => record !== null);
  const schemaAreaServed = uniqueLocalValues(
    localNodes.flatMap((node) =>
      asJsonList(node.areaServed)
        .map((item) => plainSchemaString(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).slice(0, MAX_SERVICE_AREA_LOCATIONS);
  const schemaLocalities = uniqueLocalValues([
    ...addressRecords.map((address) =>
      plainSchemaString(address.addressLocality),
    ),
    ...addressRecords.map((address) =>
      plainSchemaString(address.addressRegion),
    ),
    ...schemaAreaServed,
  ].filter((item): item is string => Boolean(item)));

  const schema: AuditLocalSchemaData = {
    hasLocalBusinessSchema: localNodes.length > 0,
    detectedTypes: detectedTypes.slice(0, MAX_SERVICE_AREA_LOCATIONS),
    hasName: localNodes.some((node) => Boolean(plainSchemaString(node.name))),
    hasTelephone: localNodes.some((node) =>
      Boolean(plainSchemaString(node.telephone)),
    ),
    hasAddress: localNodes.some((node) => schemaHasAddressValue(node.address)),
    hasPostalCode: addressRecords.some((address) =>
      Boolean(plainSchemaString(address.postalCode)),
    ),
    hasAddressLocality: addressRecords.some((address) =>
      Boolean(plainSchemaString(address.addressLocality)),
    ),
    hasAddressRegion: addressRecords.some((address) =>
      Boolean(plainSchemaString(address.addressRegion)),
    ),
    hasOpeningHours: localNodes.some(
      (node) =>
        Boolean(plainSchemaString(node.openingHours)) ||
        asJsonList(node.openingHoursSpecification).length > 0 ||
        asJsonList(node.openingHours).length > 0,
    ),
    hasGeo: localNodes.some((node) => Boolean(asJsonRecord(node.geo))),
    hasUrl: localNodes.some((node) => Boolean(plainSchemaString(node.url))),
    hasSameAs: localNodes.some((node) => asJsonList(node.sameAs).length > 0),
    hasAggregateRating:
      localNodes.some((node) => Boolean(asJsonRecord(node.aggregateRating))) ||
      nodes.some((node) => schemaTypesOf(node).includes("AggregateRating")),
    hasAreaServed: schemaAreaServed.length > 0,
    completenessCount: 0,
  };

  schema.completenessCount = [
    schema.hasName,
    schema.hasTelephone,
    schema.hasAddress,
    schema.hasPostalCode,
    schema.hasAddressLocality,
    schema.hasAddressRegion,
    schema.hasOpeningHours,
    schema.hasGeo,
    schema.hasUrl,
    schema.hasSameAs,
    schema.hasAggregateRating,
    schema.hasAreaServed,
  ].filter(Boolean).length;

  return {
    schema,
    schemaName,
    schemaLocalities,
    schemaAreaServed,
  };
}

function extractDirections($: CheerioAPI): AuditLocalData["directions"] {
  let hasDirectionsLink = false;
  let hasMapLink = false;
  let hasEmbeddedMap = false;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim() ?? "";
    const text = normalizeWhitespace($(element).text()).toLowerCase();

    if (
      textContainsPhrase(text, "get directions") ||
      textContainsPhrase(text, "directions") ||
      textContainsPhrase(text, "find us") ||
      textContainsPhrase(text, "visit us")
    ) {
      hasDirectionsLink = true;
    }

    if (looksLikeMapUrl(href)) {
      hasMapLink = true;
      hasDirectionsLink = true;
    }
  });

  $("iframe[src]").each((_, element) => {
    const src = $(element).attr("src")?.trim() ?? "";

    if (looksLikeMapUrl(src) || src.toLowerCase().includes("google.com/maps")) {
      hasEmbeddedMap = true;
      hasMapLink = true;
    }
  });

  return {
    hasDirectionsLink,
    hasMapLink,
    hasEmbeddedMap,
  };
}

function buildLikelihood(options: {
  schema: AuditLocalSchemaData;
  nap: AuditNapData;
  serviceArea: AuditServiceAreaData;
  hours: AuditHoursData;
  directions: AuditLocalData["directions"];
  hasServiceOrBookingCta: boolean;
  visibleText: string;
}): AuditLocalBusinessLikelihood {
  const evidence: string[] = [];

  if (options.schema.hasLocalBusinessSchema) {
    evidence.push("LocalBusiness schema");
  }

  if (options.nap.hasAddressSignal) {
    evidence.push("physical address");
  }

  if (options.nap.hasPhoneSignal) {
    evidence.push("phone");
  }

  if (options.serviceArea.hasServiceAreaLanguage || options.serviceArea.hasSchemaAreaServed) {
    evidence.push("service area");
  }

  if (
    options.directions.hasDirectionsLink ||
    options.directions.hasMapLink ||
    options.directions.hasEmbeddedMap
  ) {
    evidence.push("directions or map");
  }

  if (options.hasServiceOrBookingCta) {
    evidence.push("service/booking CTA");
  }

  if (options.hours.hasHoursSignal) {
    evidence.push("hours");
  }

  const saasLike =
    looksLikeSaasMarketing(options.visibleText) &&
    !options.schema.hasLocalBusinessSchema &&
    !options.nap.hasAddressSignal &&
    !options.serviceArea.hasServiceAreaLanguage;

  const likelyLocalBusiness =
    !saasLike &&
    (options.schema.hasLocalBusinessSchema ||
      evidence.length >= LOCAL_BUSINESS_EVIDENCE_THRESHOLD);

  return {
    likelyLocalBusiness,
    evidenceCount: evidence.length,
    evidence: evidence.slice(0, MAX_SERVICE_AREA_LOCATIONS),
  };
}

function classifyPageType(
  pathname: string,
  locationPage: AuditLocalData["locationPage"],
  serviceArea: AuditServiceAreaData,
  likelyLocalBusiness: boolean,
): AuditLocalPageType {
  if (locationPage.likelyLocationPage) {
    return "location-page";
  }

  if (isServiceAreaPath(pathname) || (serviceArea.hasServiceAreaLanguage && isServiceAreaPath(pathname))) {
    return "service-area-page";
  }

  if (
    likelyLocalBusiness &&
    (pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/index.html")
  ) {
    return "local-business-homepage";
  }

  return "other";
}

export function extractLocalData(
  $: CheerioAPI,
  input: LocalExtractInput,
): AuditLocalData {
  const titleValue = isAuditTitleData(input.title)
    ? input.title.value ?? ""
    : input.title;
  const headingTexts = input.headings.items.map((item) => item.text);
  const { schema, schemaName, schemaLocalities, schemaAreaServed } =
    extractLocalSchema(input.jsonLdDocuments);
  const streetAddresses = collectStreetAddresses(input.visibleText);
  const visibleLocalities = collectCityStateSignals(input.visibleText);
  const headingLocalities = headingTexts.flatMap((text) =>
    collectCityStateSignals(text),
  );
  const titleLocalities = collectCityStateSignals(titleValue);
  const localityItems: AuditLocalitySignal[] = [];

  for (const value of titleLocalities) {
    localityItems.push({ value, source: "title" });
  }

  for (const value of headingLocalities) {
    localityItems.push({ value, source: "heading" });
  }

  for (const value of visibleLocalities) {
    localityItems.push({ value, source: "visible-text" });
  }

  for (const value of schemaLocalities) {
    localityItems.push({ value, source: "schema" });
  }

  const boundedLocalities = boundLocalitySignals(localityItems);
  const uniqueLocalities = uniqueLocalValues(
    localityItems.map((item) => item.value),
  );
  const serviceLanguage = hasServiceAreaLanguage(input.visibleText);
  const headingServiceLanguage = headingTexts.some((text) =>
    hasServiceAreaLanguage(text),
  );
  const mentionedLocations = uniqueLocalValues([
    ...schemaAreaServed,
    ...collectServiceAreaMentions(input.visibleText),
  ]).slice(0, MAX_SERVICE_AREA_LOCATIONS);
  const serviceEvidence = boundLocalEvidence(
    uniqueLocalValues([
      ...(headingServiceLanguage
        ? headingTexts.filter((text) => hasServiceAreaLanguage(text))
        : []),
      ...(serviceLanguage ? collectServiceAreaMentions(input.visibleText) : []),
      ...schemaAreaServed,
    ]),
  );
  const serviceArea: AuditServiceAreaData = {
    hasServiceAreaLanguage: serviceLanguage || headingServiceLanguage,
    hasSchemaAreaServed: schema.hasAreaServed,
    mentionedLocations,
    evidenceCount:
      Number(serviceLanguage || headingServiceLanguage) +
      Number(schema.hasAreaServed) +
      mentionedLocations.length,
    evidence: serviceEvidence.items,
    detailsTruncated: serviceEvidence.detailsTruncated,
  };
  const hours: AuditHoursData = {
    hasSchemaHours: schema.hasOpeningHours,
    visibleHoursSignal: hasVisibleHoursSignal(input.visibleText),
    hasTwentyFourSevenSignal: hasTwentyFourSevenSignal(input.visibleText),
    hasHoursSignal: false,
  };
  hours.hasHoursSignal =
    hours.hasSchemaHours ||
    hours.visibleHoursSignal ||
    hours.hasTwentyFourSevenSignal;

  const addressEvidence = boundLocalEvidence(streetAddresses);
  const phoneSignal =
    input.conversion.phone.visiblePhonePresent ||
    input.conversion.phone.telLinkCount > 0 ||
    schema.hasTelephone;
  const nap: AuditNapData = {
    hasBusinessNameSignal: Boolean(schemaName),
    hasAddressSignal: streetAddresses.length > 0 || schema.hasAddress,
    hasPhoneSignal: phoneSignal,
    completenessCount: 0,
    schemaNamePresent: schema.hasName,
    schemaAddressPresent: schema.hasAddress,
    schemaPhonePresent: schema.hasTelephone,
    addressEvidenceCount: streetAddresses.length,
    addressEvidence: addressEvidence.items,
    detailsTruncated: addressEvidence.detailsTruncated,
  };
  nap.completenessCount = [
    nap.hasBusinessNameSignal,
    nap.hasAddressSignal,
    nap.hasPhoneSignal,
  ].filter(Boolean).length;

  const directions = extractDirections($);
  const hasServiceOrBookingCta =
    input.conversion.path.hasBookingCta ||
    input.conversion.ctas.uniqueTypes.includes("service") ||
    input.conversion.intent.types.includes("service") ||
    input.conversion.intent.types.includes("booking");
  const likelihood = buildLikelihood({
    schema,
    nap,
    serviceArea,
    hours,
    directions,
    hasServiceOrBookingCta,
    visibleText: input.visibleText,
  });
  const locationInTitle = titleLocalities.length > 0;
  const locationInH1 = input.headings.h1Values.some(
    (value) => collectCityStateSignals(value).length > 0,
  );
  const locationInHeadings = headingLocalities.length > 0;
  const locationInMainContent = visibleLocalities.length > 0;
  const localIntent = {
    locationInTitle,
    locationInH1,
    locationInHeadings,
    locationInMainContent,
    serviceAreaLanguagePresent: serviceArea.hasServiceAreaLanguage,
    geographicSignalCount: [
      locationInTitle,
      locationInH1,
      locationInHeadings,
      locationInMainContent,
      serviceArea.hasServiceAreaLanguage || schema.hasAreaServed,
      schema.hasAddressLocality,
    ].filter(Boolean).length,
  };
  const locationPathSignal = isLocationPath(input.pageUrl.pathname);
  const locationHeadingSignal = locationInH1 || locationInTitle;
  const locationPage = {
    likelyLocationPage:
      locationPathSignal ||
      (locationHeadingSignal &&
        /\/(locations?|service-areas?)\//i.test(input.pageUrl.pathname)),
    locationPathSignal,
    locationHeadingSignal,
  };
  const reputation = {
    hasReviewSignal:
      input.conversion.trust.reviewSignals > 0 || schema.hasAggregateRating,
    hasAggregateRatingSchema: schema.hasAggregateRating,
    hasTestimonialSignal: input.conversion.trust.testimonialSignals > 0,
  };
  const pageType = classifyPageType(
    input.pageUrl.pathname,
    locationPage,
    serviceArea,
    likelihood.likelyLocalBusiness,
  );

  return {
    nap,
    location: {
      items: boundedLocalities.items,
      uniqueValues: uniqueLocalities.slice(0, MAX_SERVICE_AREA_LOCATIONS),
      detailsTruncated: boundedLocalities.detailsTruncated,
    },
    hours,
    schema,
    serviceArea,
    directions,
    localIntent,
    locationPage,
    reputation,
    likelihood,
    pageType,
  };
}
