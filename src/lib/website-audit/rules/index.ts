import type { AuditRule } from "../engine/types";

import { canonicalRule } from "./canonical-rule";
import { contactSignalsRule } from "./contact-signals-rule";
import { headingsRule } from "./headings-rule";
import { imagesRule } from "./images-rule";
import { internalLinksRule } from "./internal-links-rule";
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
    imagesRule,
    internalLinksRule,

    openGraphRule,
    structuredDataRule,

    contactSignalsRule,
    localSignalsRule,

    performanceRule,
  ];