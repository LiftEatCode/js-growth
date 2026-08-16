import { analyzeHtml } from "./analyze-html";
import { buildAuditRobotsData } from "./robots";
import { contactSignalsRule } from "./rules/contact-signals-rule";
import { localGeographicRelevanceRule } from "./rules/local-geographic-relevance-rule";
import { localHoursRule } from "./rules/local-hours-rule";
import { localLocationPageRule } from "./rules/local-location-page-rule";
import { localNapRule } from "./rules/local-nap-rule";
import { localSchemaRule } from "./rules/local-schema-rule";
import { localSignalsRule } from "./rules/local-signals-rule";
import type { AuditPageData } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(
    " ",
  );
}

function pageFromHtml(
  html: string,
  url = "https://example.com/",
): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url);

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

function ids(
  pageData: AuditPageData,
  rules: Array<{
    evaluate: (context: {
      pageData: AuditPageData;
      finalUrl: string;
    }) => { id: string } | Array<{ id: string }>;
  }>,
): string[] {
  return rules.flatMap((rule) => {
    const result = rule.evaluate({
      pageData,
      finalUrl: "https://example.com/",
    });
    const findings = Array.isArray(result) ? result : [result];

    return findings.map((finding) => finding.id);
  });
}

const localRules = [
  contactSignalsRule,
  localSchemaRule,
  localNapRule,
  localGeographicRelevanceRule,
  localHoursRule,
  localLocationPageRule,
  localSignalsRule,
];

const strongLocal = pageFromHtml(`
  <html>
    <head>
      <title>Auto Repair in Magnolia, TX</title>
      <script type="application/ld+json">
        ${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AutoRepair",
          name: "Tha Shop",
          telephone: "+19365551234",
          url: "https://example.com/",
          openingHours: "Mo-Fr 08:00-17:00",
          address: {
            "@type": "PostalAddress",
            streetAddress: "123 Main Street",
            addressLocality: "Magnolia",
            addressRegion: "TX",
            postalCode: "77354",
          },
        })}
      </script>
    </head>
    <body>
      <h1>Magnolia Auto Repair</h1>
      <p>123 Main Street</p>
      <p>Magnolia, TX 77354</p>
      <p>Call (936) 555-1234</p>
      <a href="https://maps.google.com/?q=Magnolia+TX">Get Directions</a>
      <h2>Customer Reviews</h2>
      <p>Great local service.</p>
    </body>
  </html>
`);

const strongIds = ids(strongLocal, localRules);
assert(
  strongLocal.local?.likelihood.likelyLocalBusiness === true &&
    strongLocal.local.nap.completenessCount >= 2 &&
    strongLocal.local.schema.hasName &&
    strongLocal.local.schema.hasTelephone &&
    strongLocal.local.schema.hasAddress &&
    strongLocal.local.hours.hasHoursSignal &&
    strongLocal.local.directions.hasDirectionsLink &&
    strongLocal.local.localIntent.geographicSignalCount > 0 &&
    strongIds.includes("local-schema-complete") &&
    !strongIds.includes("local-schema-missing") &&
    !strongIds.includes("local-service-area-unclear"),
  "CASE 1 strong local business",
);

const serviceArea = pageFromHtml(`
  <html>
    <head>
      <title>Plumbing</title>
      <script type="application/ld+json">
        ${JSON.stringify({
          "@type": "Plumber",
          name: "ABC Plumbing",
          telephone: "+19365551234",
          areaServed: ["Magnolia", "Tomball", "The Woodlands"],
        })}
      </script>
    </head>
    <body>
      <p>Serving Magnolia, Tomball, and The Woodlands</p>
      <a href="tel:+19365551234">Call (936) 555-1234</a>
    </body>
  </html>
`);
const serviceAreaIds = ids(serviceArea, localRules);
assert(
  serviceArea.local?.likelihood.likelyLocalBusiness === true &&
    serviceArea.local.serviceArea.hasServiceAreaLanguage &&
    serviceArea.local.serviceArea.hasSchemaAreaServed &&
    !serviceArea.local.nap.hasAddressSignal &&
    !serviceAreaIds.includes("address-signals-missing") &&
    !serviceAreaIds.includes("local-service-area-unclear"),
  "CASE 2 service-area business",
);

const unclear = pageFromHtml(`
  <main>
    <h1>Professional Auto Repair</h1>
    <p>We provide complete auto repair and request service by appointment.</p>
    <a href="tel:+19365551234">Call Now</a>
    <a href="/contact">Contact Us</a>
  </main>
`);
assert(
  unclear.local?.likelihood.likelyLocalBusiness === true &&
    ids(unclear, localRules).includes("local-service-area-unclear"),
  "CASE 3 local business with no location clarity",
);

const saas = pageFromHtml(`
  <main>
    <h1>Project software for teams</h1>
    <p>Pricing starts free. Sign up and start a free trial of our SaaS dashboard.</p>
    <a href="/signup">Get Started</a>
  </main>
`);
const saasIds = ids(saas, localRules);
assert(
  saas.local?.likelihood.likelyLocalBusiness === false &&
    !saasIds.includes("local-schema-missing") &&
    !saasIds.includes("local-service-area-unclear") &&
    !saasIds.includes("local-hours-missing") &&
    !saasIds.includes("address-signals-missing"),
  "CASE 4 SaaS / non-local site",
);

const missingSchema = pageFromHtml(`
  <main>
    <h1>Auto Repair in Magnolia TX</h1>
    <p>123 Main Street</p>
    <p>Magnolia, TX 77354</p>
    <p>Serving Magnolia and nearby communities. Call (936) 555-1234.</p>
    <a href="tel:+19365551234">Call Now</a>
  </main>
`);
assert(
  ids(missingSchema, [localSchemaRule]).includes("local-schema-missing"),
  "CASE 5 LocalBusiness schema missing",
);

const incompleteSchema = pageFromHtml(`
  <script type="application/ld+json">
    ${JSON.stringify({
      "@type": "LocalBusiness",
      name: "ABC Plumbing",
    })}
  </script>
  <p>Call (936) 555-1234</p>
  <p>123 Main Street Magnolia, TX</p>
`);
const incompleteIds = ids(incompleteSchema, [localSchemaRule]);
assert(
  incompleteIds.includes("local-schema-incomplete") &&
    incompleteIds.length === 1,
  "CASE 6 incomplete schema is a single finding",
);

const storefront = pageFromHtml(`
  <p>123 Main St</p>
  <p>Magnolia, TX</p>
  <a href="https://maps.google.com/maps?q=Magnolia">Get Directions</a>
`);
assert(
  storefront.local?.nap.hasAddressSignal === true &&
    storefront.local.location.uniqueValues.some((value) =>
      value.toLowerCase().includes("magnolia"),
    ) &&
    storefront.local.directions.hasDirectionsLink &&
    storefront.local.directions.hasMapLink,
  "CASE 7 storefront with directions",
);

const hoursPage = pageFromHtml(`<p>Monday-Friday 8am-5pm</p>`);
assert(
  hoursPage.local?.hours.visibleHoursSignal === true,
  "CASE 8 visible hours",
);

const alwaysOpen = pageFromHtml(`<p>Emergency Service 24/7</p>`);
assert(
  alwaysOpen.local?.hours.hasTwentyFourSevenSignal === true,
  "CASE 9 24/7 hours signal",
);

const geoStrong = pageFromHtml(`
  <html>
    <head><title>Auto Repair in Magnolia TX | Tha Shop</title></head>
    <body>
      <h1>Magnolia Auto Repair</h1>
      <p>Serving Magnolia and nearby communities. Call (936) 555-1234.</p>
      <a href="tel:+19365551234">Call Now</a>
    </body>
  </html>
`);
assert(
  geoStrong.local?.localIntent.locationInTitle === true &&
    geoStrong.local.localIntent.serviceAreaLanguagePresent === true &&
    geoStrong.local.localIntent.geographicSignalCount >= 2 &&
    !ids(geoStrong, [localGeographicRelevanceRule]).includes(
      "local-geographic-relevance-weak",
    ),
  "CASE 10 geographic relevance",
);

const geoWeak = pageFromHtml(`
  <html>
    <head><title>Professional Auto Repair</title></head>
    <body>
      <h1>Complete Auto Repair</h1>
      <p>123 Main Street. Call (936) 555-1234 for complete auto repair.</p>
      <a href="tel:+19365551234">Call Now</a>
    </body>
  </html>
`);
assert(
  geoWeak.local?.likelihood.likelyLocalBusiness === true &&
    ids(geoWeak, [localGeographicRelevanceRule]).includes(
      "local-geographic-relevance-weak",
    ),
  "CASE 11 weak geographic relevance",
);

const locationPage = pageFromHtml(
  `
  <html>
    <head><title>Auto Repair in Magnolia TX</title></head>
    <body>
      <h1>Magnolia Auto Repair</h1>
      <p>${words(50)}</p>
    </body>
  </html>
`,
  "https://example.com/locations/magnolia-tx",
);
assert(
  locationPage.local?.locationPage.likelyLocationPage === true &&
    ids(locationPage, [localLocationPageRule]).includes(
      "location-page-thin-detail",
    ),
  "CASE 12 location page",
);

const rating = pageFromHtml(`
  <script type="application/ld+json">
    ${JSON.stringify({
      "@type": "LocalBusiness",
      name: "Tha Shop",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "22",
      },
    })}
  </script>
`);
assert(
  rating.local?.reputation.hasAggregateRatingSchema === true &&
    rating.local.reputation.hasReviewSignal === true,
  "CASE 13 AggregateRating schema",
);

assert(
  pageFromHtml(`
    <script type="application/ld+json">{ not-json</script>
    <p>Magnolia, TX</p>
  `).local !== undefined,
  "CASE 14 malformed JSON-LD does not crash",
);

console.log("local seo verification passed");
