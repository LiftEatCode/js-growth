import type { AuditRule } from "../engine/types";

import { canonicalRule } from "./canonical-rule";
import { contactSignalsRule } from "./contact-signals-rule";
import { contentDepthRule } from "./content-depth-rule";
import { contentStructureRule } from "./content-structure-rule";
import { conversionContactRule } from "./conversion-contact-rule";
import { conversionPathRule } from "./conversion-path-rule";
import { headingsRule } from "./headings-rule";
import { imagesRule } from "./images-rule";
import { internalLinksRule } from "./internal-links-rule";
import { leadFormRule } from "./lead-form-rule";
import { localGeographicRelevanceRule } from "./local-geographic-relevance-rule";
import { localHoursRule } from "./local-hours-rule";
import { localLocationPageRule } from "./local-location-page-rule";
import { localNapRule } from "./local-nap-rule";
import { localSchemaRule } from "./local-schema-rule";
import { localSignalsRule } from "./local-signals-rule";
import { metaDescriptionRule } from "./meta-description-rule";
import { openGraphRule } from "./open-graph-rule";
import { performanceRule } from "./performance-rule";
import { robotsCrawlabilityRule } from "./robots-crawlability-rule";
import { robotsIndexabilityRule } from "./robots-indexability-rule";
import { robotsTxtRule } from "./robots-txt-rule";
import { sitemapRule } from "./sitemap-rule";
import { structuredDataRule } from "./structured-data-rule";
import { titleH1AlignmentRule } from "./title-h1-alignment-rule";
import { titleRule } from "./title-rule";
import { trustSignalsRule } from "./trust-signals-rule";
import { viewportRule } from "./viewport-rule";

export const coreAuditRules: AuditRule[] =
  [
    robotsIndexabilityRule,
    robotsCrawlabilityRule,
    robotsTxtRule,
    sitemapRule,

    titleRule,
    metaDescriptionRule,
    canonicalRule,
    viewportRule,

    headingsRule,
    titleH1AlignmentRule,
    contentDepthRule,
    contentStructureRule,
    imagesRule,
    internalLinksRule,

    openGraphRule,
    structuredDataRule,

    contactSignalsRule,
    localSchemaRule,
    localNapRule,
    localGeographicRelevanceRule,
    localHoursRule,
    localLocationPageRule,
    localSignalsRule,

    conversionPathRule,
    conversionContactRule,
    leadFormRule,
    trustSignalsRule,

    performanceRule,
  ];