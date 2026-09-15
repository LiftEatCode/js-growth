import { createGbpFinding } from "../engine";
import type { GbpAuditRule } from "../types";
import {
  hasText,
  hostnameFromUrl,
  namesLookConsistent,
  phonesLookConsistent,
} from "../utils";

export const localWebsiteRule: GbpAuditRule = {
  id: "local_seo.website",
  category: "local_seo",
  title: "Website URL for local discovery",
  evaluate({ profile }) {
    const url = profile.identity.websiteUrl;
    if (url === null) {
      return createGbpFinding({
        id: "local_seo.website",
        category: "local_seo",
        title: "Website URL for local discovery",
        status: "insufficient_data",
        summary: "Website URL was not observed.",
        whyItMatters:
          "The profile website is a local discovery path. Unknown is not scored as missing.",
        recommendation: "Refresh profile data.",
        evidence: { websiteUrl: null },
      });
    }

    if (!hasText(url)) {
      return createGbpFinding({
        id: "local_seo.website",
        category: "local_seo",
        title: "Website URL for local discovery",
        status: "fail",
        summary: "No website URL is on the profile.",
        whyItMatters:
          "Without a site, customers cannot confirm services, NAP, or landing pages. This overlaps with Profile Optimization on purpose: here it is a local-discovery path, there it is completeness.",
        recommendation: "Add the website customers should use from Maps and search.",
        evidence: { websiteUrl: "" },
      });
    }

    return createGbpFinding({
      id: "local_seo.website",
      category: "local_seo",
      title: "Website URL for local discovery",
      status: "pass",
      summary: "A website URL is present on the profile.",
      whyItMatters: "Customers can leave Maps for fuller service information.",
      recommendation: "Point the URL at a relevant, working page.",
      evidence: { websiteUrl: url.trim(), hostname: hostnameFromUrl(url) },
    });
  },
};

export const nameConsistencyRule: GbpAuditRule = {
  id: "local_seo.name_consistency",
  category: "local_seo",
  title: "Name consistency with website context",
  evaluate({ profile }) {
    const context = profile.localSeoContext;
    if (!context) {
      return createGbpFinding({
        id: "local_seo.name_consistency",
        category: "local_seo",
        title: "Name consistency with website context",
        status: "insufficient_data",
        summary: "No website/NAP context was supplied.",
        whyItMatters:
          "Name matching needs an external website or operator snapshot. GBP-only audits cannot invent website NAP.",
        recommendation:
          "Supply website name from a Website Growth Audit or operator input to enable this check.",
        evidence: { localSeoContext: false },
      });
    }

    if (!hasText(context.websiteName)) {
      return createGbpFinding({
        id: "local_seo.name_consistency",
        category: "local_seo",
        title: "Name consistency with website context",
        status: "insufficient_data",
        summary: "Website context is present, but no website business name was supplied.",
        whyItMatters: "Cannot compare names without both sides.",
        recommendation: "Capture the homepage or local page business name.",
        evidence: { websiteName: context.websiteName },
      });
    }

    const profileName = profile.identity.name;
    const match = namesLookConsistent(profileName, context.websiteName);
    if (!match) {
      return createGbpFinding({
        id: "local_seo.name_consistency",
        category: "local_seo",
        title: "Name consistency with website context",
        status: "warning",
        summary: `Profile name “${profileName}” does not closely match website name “${context.websiteName}”.`,
        whyItMatters:
          "Large name mismatches can confuse customers. DBA vs legal names are sometimes legitimate; this is a consistency warning, not a ranking claim.",
        recommendation:
          "Align the public-facing name across the profile and website unless you have a documented DBA reason.",
        evidence: {
          profileName,
          websiteName: context.websiteName,
        },
      });
    }

    return createGbpFinding({
      id: "local_seo.name_consistency",
      category: "local_seo",
      title: "Name consistency with website context",
      status: "pass",
      summary: "Profile name is consistent with the supplied website name.",
      whyItMatters: "Customers see the same business identity on the site and the profile.",
      recommendation: "Re-check after rebrands.",
      evidence: { profileName, websiteName: context.websiteName },
    });
  },
};

export const phoneConsistencyRule: GbpAuditRule = {
  id: "local_seo.phone_consistency",
  category: "local_seo",
  title: "Phone consistency with website context",
  evaluate({ profile }) {
    const context = profile.localSeoContext;
    if (!context) {
      return createGbpFinding({
        id: "local_seo.phone_consistency",
        category: "local_seo",
        title: "Phone consistency with website context",
        status: "insufficient_data",
        summary: "No website/NAP context was supplied.",
        whyItMatters:
          "Phone matching requires website evidence from another JS Growth system or an operator.",
        recommendation: "Supply website phone to enable this check.",
        evidence: { localSeoContext: false },
      });
    }

    if (!hasText(context.websitePhone) || !hasText(profile.identity.phone)) {
      return createGbpFinding({
        id: "local_seo.phone_consistency",
        category: "local_seo",
        title: "Phone consistency with website context",
        status: "insufficient_data",
        summary: "One or both phone numbers are missing, so they cannot be compared.",
        whyItMatters: "A missing number is handled by completeness rules, not this match.",
        recommendation: "Add the missing phone, then re-run the audit.",
        evidence: {
          profilePhone: profile.identity.phone,
          websitePhone: context.websitePhone,
        },
      });
    }

    const match = phonesLookConsistent(
      profile.identity.phone,
      context.websitePhone,
    );
    if (!match) {
      return createGbpFinding({
        id: "local_seo.phone_consistency",
        category: "local_seo",
        title: "Phone consistency with website context",
        status: "fail",
        summary: "Profile phone does not match the supplied website phone.",
        whyItMatters:
          "Conflicting numbers create failed calls and mixed citations. This is a consistency issue, not a guaranteed local-pack lever.",
        recommendation:
          "Pick one customer-facing number and use it on the profile and the website.",
        evidence: {
          profilePhone: profile.identity.phone,
          websitePhone: context.websitePhone,
        },
      });
    }

    return createGbpFinding({
      id: "local_seo.phone_consistency",
      category: "local_seo",
      title: "Phone consistency with website context",
      status: "pass",
      summary: "Profile phone matches the supplied website phone.",
      whyItMatters: "Customers can call the same number from either surface.",
      recommendation: "Update both places together if the number changes.",
      evidence: {
        profilePhone: profile.identity.phone,
        websitePhone: context.websitePhone,
      },
    });
  },
};

export const landingPageRule: GbpAuditRule = {
  id: "local_seo.landing_page",
  category: "local_seo",
  title: "Local landing page context",
  evaluate({ profile }) {
    const context = profile.localSeoContext;
    if (!context) {
      return createGbpFinding({
        id: "local_seo.landing_page",
        category: "local_seo",
        title: "Local landing page context",
        status: "insufficient_data",
        summary: "No website landing-page context was supplied.",
        whyItMatters:
          "v0.1 does not crawl the website from this engine. Landing-page relevance is an external input.",
        recommendation:
          "Pass a local landing page URL from the Website Growth Audit or operator notes.",
        evidence: { localSeoContext: false },
      });
    }

    if (!hasText(context.localLandingPageUrl)) {
      return createGbpFinding({
        id: "local_seo.landing_page",
        category: "local_seo",
        title: "Local landing page context",
        status: "insufficient_data",
        summary: "Website context exists, but no local landing page URL was supplied.",
        whyItMatters: "Cannot judge a landing page that was not provided.",
        recommendation: "Supply the URL the GBP website field should match, if you have one.",
        evidence: { localLandingPageUrl: context.localLandingPageUrl },
      });
    }

    if (context.localLandingPageRelevant === false) {
      return createGbpFinding({
        id: "local_seo.landing_page",
        category: "local_seo",
        title: "Local landing page context",
        status: "warning",
        summary: `Landing page ${context.localLandingPageUrl} was marked not relevant.`,
        whyItMatters:
          "A generic homepage or unrelated URL wastes the click from Maps. Relevance here is operator/audit judgement, not a Google-reported factor.",
        recommendation:
          "Point the profile at a page that names the service and area customers expect.",
        evidence: {
          localLandingPageUrl: context.localLandingPageUrl,
          localLandingPageRelevant: false,
        },
      });
    }

    if (context.localLandingPageRelevant === null) {
      return createGbpFinding({
        id: "local_seo.landing_page",
        category: "local_seo",
        title: "Local landing page context",
        status: "insufficient_data",
        summary: "A landing page URL was supplied without a relevance judgement.",
        whyItMatters: "URL presence alone is not enough to claim the page is locally relevant.",
        recommendation: "Mark whether the page is a relevant local/service URL.",
        evidence: {
          localLandingPageUrl: context.localLandingPageUrl,
          localLandingPageRelevant: null,
        },
      });
    }

    return createGbpFinding({
      id: "local_seo.landing_page",
      category: "local_seo",
      title: "Local landing page context",
      status: "pass",
      summary: "A relevant local landing page was supplied.",
      whyItMatters: "The profile click has a sensible destination.",
      recommendation: "Keep that page accurate as services change.",
      evidence: {
        localLandingPageUrl: context.localLandingPageUrl,
        localLandingPageRelevant: true,
      },
    });
  },
};

export const localSeoRules: GbpAuditRule[] = [
  localWebsiteRule,
  nameConsistencyRule,
  phoneConsistencyRule,
  landingPageRule,
];
