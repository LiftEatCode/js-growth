import type { AuditRule } from "../engine/types";

import { canonicalRule } from "./canonical-rule";
import { contactSignalsRule } from "./contact-signals-rule";
import { headingsRule } from "./headings-rule";
import { imagesRule } from "./images-rule";
import { internalLinksRule } from "./internal-links-rule";
import { metaDescriptionRule } from "./meta-description-rule";
import { openGraphRule } from "./open-graph-rule";
import { structuredDataRule } from "./structured-data-rule";
import { titleRule } from "./title-rule";
import { viewportRule } from "./viewport-rule";
import { localSignalsRule } from "./local-signals-rule";
import { performanceRule } from "./performance-rule";

export const coreAuditRules: AuditRule[] = [
  titleRule,
  metaDescriptionRule,
  canonicalRule,
  viewportRule,
  headingsRule,
  imagesRule,
  internalLinksRule,
  openGraphRule,
  structuredDataRule,
  contactSignalsRule,
  localSignalsRule,
  performanceRule,
];
