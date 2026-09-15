import type { GbpAuditRule } from "../types";
import { activityRules } from "./activity";
import { conversionRules } from "./conversion";
import { localSeoRules } from "./local-seo";
import { profileRules } from "./profile";
import { reviewRules } from "./reviews";
import { trustRules } from "./trust";

export const gbpAuditRules: GbpAuditRule[] = [
  ...profileRules,
  ...reviewRules,
  ...activityRules,
  ...localSeoRules,
  ...trustRules,
  ...conversionRules,
];
