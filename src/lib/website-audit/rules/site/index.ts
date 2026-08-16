import type { AuditRule } from "../../engine/types";

import { siteBrokenLinksRule } from "./broken-links-rule";
import { siteCanonicalPatternRule } from "./canonical-pattern-rule";
import { siteContentPatternRule } from "./content-pattern-rule";
import { siteConversionCoverageRule } from "./conversion-coverage-rule";
import { siteDuplicateMetadataRule } from "./duplicate-metadata-rule";
import { siteIndexabilityPatternRule } from "./indexability-pattern-rule";
import { siteInternalLinkSupportRule } from "./internal-link-support-rule";
import { siteLocalPatternRule } from "./local-pattern-rule";

export const siteAuditRules: AuditRule[] = [
  siteIndexabilityPatternRule,
  siteCanonicalPatternRule,
  siteBrokenLinksRule,
  siteDuplicateMetadataRule,
  siteContentPatternRule,
  siteInternalLinkSupportRule,
  siteConversionCoverageRule,
  siteLocalPatternRule,
];
