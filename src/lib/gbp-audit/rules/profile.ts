import { THRESHOLDS } from "../constants";
import { createGbpFinding } from "../engine";
import type { GbpAuditFinding, GbpAuditRule, GbpRuleContext } from "../types";
import { hasOpenHours, hasText } from "../utils";

const WHY_CATEGORY =
  "A clear primary category helps customers understand what the business does. It is a profile completeness signal, not a promised ranking factor.";

export const primaryCategoryRule: GbpAuditRule = {
  id: "profile.primary_category",
  category: "profile_optimization",
  title: "Primary category",
  evaluate({ profile }: GbpRuleContext): GbpAuditFinding {
    const value = profile.identity.primaryCategory;
    if (value === null) {
      return createGbpFinding({
        id: "profile.primary_category",
        category: "profile_optimization",
        title: "Primary category",
        status: "insufficient_data",
        summary: "Primary category was not observed in this snapshot.",
        whyItMatters: WHY_CATEGORY,
        recommendation:
          "Reconnect or refresh profile data so the primary category can be checked.",
        evidence: { primaryCategory: null },
      });
    }

    if (!hasText(value)) {
      return createGbpFinding({
        id: "profile.primary_category",
        category: "profile_optimization",
        title: "Primary category",
        status: "fail",
        summary: "No primary category is set.",
        whyItMatters: WHY_CATEGORY,
        recommendation:
          "Choose the most accurate primary category for the main service customers search for.",
        evidence: { primaryCategory: "" },
      });
    }

    return createGbpFinding({
      id: "profile.primary_category",
      category: "profile_optimization",
      title: "Primary category",
      status: "pass",
      summary: `Primary category is “${value.trim()}”.`,
      whyItMatters: WHY_CATEGORY,
      recommendation: "Keep the primary category aligned with the main service.",
      evidence: { primaryCategory: value.trim() },
    });
  },
};

export const additionalCategoriesRule: GbpAuditRule = {
  id: "profile.additional_categories",
  category: "profile_optimization",
  title: "Additional categories",
  evaluate({ profile }: GbpRuleContext): GbpAuditFinding {
    const extra = profile.identity.additionalCategories.filter((item) =>
      hasText(item),
    );
    if (extra.length > 0) {
      return createGbpFinding({
        id: "profile.additional_categories",
        category: "profile_optimization",
        title: "Additional categories",
        status: "pass",
        summary: `${extra.length} additional categor${extra.length === 1 ? "y is" : "ies are"} listed.`,
        whyItMatters:
          "Extra categories can describe real secondary services. They are optional; not every business needs them.",
        recommendation: "Only add categories that accurately describe the business.",
        evidence: { additionalCategoryCount: extra.length },
      });
    }

    return createGbpFinding({
      id: "profile.additional_categories",
      category: "profile_optimization",
      title: "Additional categories",
      status: "warning",
      severity: "low",
      summary: "No additional categories are listed.",
      whyItMatters:
        "Some businesses only need a primary category. Additional categories help when you offer distinct services that customers search for separately.",
      recommendation:
        "Add extra categories only if they match real services. Skipping them is fine when one category covers the business.",
      evidence: { additionalCategoryCount: 0 },
    });
  },
};

export const descriptionPresentRule: GbpAuditRule = {
  id: "profile.description_present",
  category: "profile_optimization",
  title: "Business description",
  evaluate({ profile }: GbpRuleContext): GbpAuditFinding {
    const description = profile.identity.description;
    if (description === null) {
      return createGbpFinding({
        id: "profile.description_present",
        category: "profile_optimization",
        title: "Business description",
        status: "insufficient_data",
        summary: "Description was not observed in this snapshot.",
        whyItMatters:
          "A description tells customers what you do. Missing data is not the same as a blank profile.",
        recommendation: "Refresh profile data so the description can be evaluated.",
        evidence: { description: null },
      });
    }

    if (!hasText(description)) {
      return createGbpFinding({
        id: "profile.description_present",
        category: "profile_optimization",
        title: "Business description",
        status: "fail",
        summary: "The profile has no business description.",
        whyItMatters:
          "Customers use the description to confirm they found the right business. An empty description is a completeness gap, not a ranking guarantee.",
        recommendation:
          "Write a clear description of services, service area, and what makes the business a fit.",
        evidence: { descriptionLength: 0 },
      });
    }

    return createGbpFinding({
      id: "profile.description_present",
      category: "profile_optimization",
      title: "Business description",
      status: "pass",
      summary: "A business description is present.",
      whyItMatters:
        "A filled description helps customers understand the offer before they call or visit.",
      recommendation: "Keep the description accurate as services change.",
      evidence: { descriptionLength: description.trim().length },
    });
  },
};

export const descriptionSubstanceRule: GbpAuditRule = {
  id: "profile.description_substance",
  category: "profile_optimization",
  title: "Description substance",
  evaluate({ profile }: GbpRuleContext): GbpAuditFinding {
    const description = profile.identity.description;
    if (description === null) {
      return createGbpFinding({
        id: "profile.description_substance",
        category: "profile_optimization",
        title: "Description substance",
        status: "insufficient_data",
        summary: "Description was not observed, so substance cannot be scored.",
        whyItMatters: "Thin copy is only a problem when we can see the copy.",
        recommendation: "Refresh profile data, then expand a thin description if needed.",
        evidence: { description: null },
      });
    }

    if (!hasText(description)) {
      return createGbpFinding({
        id: "profile.description_substance",
        category: "profile_optimization",
        title: "Description substance",
        status: "not_applicable",
        summary: "No description to evaluate for substance.",
        whyItMatters: "Substance is scored separately from presence to avoid double-counting a blank field as two failures in the denominator.",
        recommendation: "Add a description first.",
        evidence: { descriptionLength: 0 },
      });
    }

    const length = description.trim().length;
    if (length < THRESHOLDS.descriptionMinChars) {
      return createGbpFinding({
        id: "profile.description_substance",
        category: "profile_optimization",
        title: "Description substance",
        status: "fail",
        summary: `Description is only ${length} characters.`,
        whyItMatters:
          "Extremely short descriptions rarely explain services or who the business helps.",
        recommendation:
          `Expand the description to at least ${THRESHOLDS.descriptionMinChars} characters with real services and service area. Aim nearer ${THRESHOLDS.descriptionRecommendedChars} when there is more to say.`,
        evidence: { descriptionLength: length },
      });
    }

    if (length < THRESHOLDS.descriptionRecommendedChars) {
      return createGbpFinding({
        id: "profile.description_substance",
        category: "profile_optimization",
        title: "Description substance",
        status: "warning",
        severity: "low",
        summary: `Description is ${length} characters — usable but thin.`,
        whyItMatters:
          "A slightly longer description can answer basic customer questions without stuffing keywords.",
        recommendation:
          `Add services, area served, and practical details until the description is closer to ${THRESHOLDS.descriptionRecommendedChars} characters.`,
        evidence: { descriptionLength: length },
      });
    }

    return createGbpFinding({
      id: "profile.description_substance",
      category: "profile_optimization",
      title: "Description substance",
      status: "pass",
      summary: `Description is ${length} characters.`,
      whyItMatters: "Enough detail for a customer to understand the offer.",
      recommendation: "Update the description when services change.",
      evidence: { descriptionLength: length },
    });
  },
};

function presenceRule(
  id: "profile.phone" | "profile.website",
  title: string,
  value: string | null,
  emptySummary: string,
  why: string,
  recommendation: string,
): GbpAuditFinding {
  if (value === null) {
    return createGbpFinding({
      id,
      category: "profile_optimization",
      title,
      status: "insufficient_data",
      summary: `${title} was not observed in this snapshot.`,
      whyItMatters: why,
      recommendation: "Refresh profile data so this field can be checked.",
      evidence: { value: null },
    });
  }

  if (!hasText(value)) {
    return createGbpFinding({
      id,
      category: "profile_optimization",
      title,
      status: "fail",
      summary: emptySummary,
      whyItMatters: why,
      recommendation,
      evidence: { value: "" },
    });
  }

  return createGbpFinding({
    id,
    category: "profile_optimization",
    title,
    status: "pass",
    summary: `${title} is set.`,
    whyItMatters: why,
    recommendation: "Keep this information current.",
    evidence: { value: value.trim() },
  });
}

export const phoneRule: GbpAuditRule = {
  id: "profile.phone",
  category: "profile_optimization",
  title: "Phone number",
  evaluate({ profile }) {
    return presenceRule(
      "profile.phone",
      "Phone number",
      profile.identity.phone,
      "No phone number is set on the profile.",
      "A phone number is a basic way customers reach the business from search and Maps.",
      "Add the main customer-facing phone number to the profile.",
    );
  },
};

export const websiteRule: GbpAuditRule = {
  id: "profile.website",
  category: "profile_optimization",
  title: "Website URL",
  evaluate({ profile }) {
    return presenceRule(
      "profile.website",
      "Website URL",
      profile.identity.websiteUrl,
      "No website URL is set on the profile.",
      "A website gives customers more detail than the profile card. This is a completeness check, not a ranking promise.",
      "Add the canonical website URL customers should visit.",
    );
  },
};

export const regularHoursRule: GbpAuditRule = {
  id: "profile.regular_hours",
  category: "profile_optimization",
  title: "Regular hours",
  evaluate({ profile }) {
    const hours = profile.configuration.regularHours;
    if (hours === null) {
      return createGbpFinding({
        id: "profile.regular_hours",
        category: "profile_optimization",
        title: "Regular hours",
        status: "insufficient_data",
        summary: "Regular hours were not observed in this snapshot.",
        whyItMatters:
          "Published hours reduce wasted trips and calls. Unknown data is not scored as a failure.",
        recommendation: "Refresh profile data so hours can be checked.",
        evidence: { regularHours: null },
      });
    }

    if (!hasOpenHours(hours)) {
      return createGbpFinding({
        id: "profile.regular_hours",
        category: "profile_optimization",
        title: "Regular hours",
        status: "fail",
        summary: "No open regular hours are configured.",
        whyItMatters:
          "Customers use hours to decide when to call or visit. Appointment-only businesses should still say so in hours or the description.",
        recommendation:
          "Add regular hours, or mark days closed and explain appointment-only service in the description.",
        evidence: { openDayCount: 0 },
      });
    }

    const openDays = hours.filter((day) => !day.closed && day.openTime).length;
    return createGbpFinding({
      id: "profile.regular_hours",
      category: "profile_optimization",
      title: "Regular hours",
      status: "pass",
      summary: `Regular hours are published for ${openDays} day(s).`,
      whyItMatters: "Published hours help customers plan contact and visits.",
      recommendation: "Keep hours updated for holidays using special hours when needed.",
      evidence: { openDayCount: openDays },
    });
  },
};

export const serviceAreasRule: GbpAuditRule = {
  id: "profile.service_areas",
  category: "profile_optimization",
  title: "Service areas",
  evaluate({ profile }) {
    const type = profile.configuration.locationType;
    if (type === "STOREFRONT") {
      return createGbpFinding({
        id: "profile.service_areas",
        category: "profile_optimization",
        title: "Service areas",
        status: "not_applicable",
        summary: "Storefront businesses are not required to list service areas.",
        whyItMatters:
          "Service-area configuration applies to businesses that go to the customer. Penalizing a shop for skipping it would be the wrong model.",
        recommendation: "No change required for a public storefront.",
        evidence: { locationType: type },
      });
    }

    const areas = profile.configuration.serviceAreas.filter((item) => hasText(item));
    if (areas.length === 0) {
      return createGbpFinding({
        id: "profile.service_areas",
        category: "profile_optimization",
        title: "Service areas",
        status: "fail",
        summary: "This service-area or hybrid profile has no service areas listed.",
        whyItMatters:
          "Customers and Maps need to know where you actually serve when there is no public storefront.",
        recommendation:
          "Add the cities, ZIP codes, or regions you serve. Do not list areas you do not cover.",
        evidence: { locationType: type, serviceAreaCount: 0 },
      });
    }

    return createGbpFinding({
      id: "profile.service_areas",
      category: "profile_optimization",
      title: "Service areas",
      status: "pass",
      summary: `${areas.length} service area(s) are configured.`,
      whyItMatters: "Defined service areas describe where a mobile or at-home business works.",
      recommendation: "Review areas when coverage changes.",
      evidence: { locationType: type, serviceAreaCount: areas.length },
    });
  },
};

export const servicesRule: GbpAuditRule = {
  id: "profile.services",
  category: "profile_optimization",
  title: "Services list",
  evaluate({ profile }) {
    const services = profile.services.filter((item) => hasText(item.name));
    const products = profile.products.filter((item) => hasText(item.name));
    if (services.length > 0) {
      return createGbpFinding({
        id: "profile.services",
        category: "profile_optimization",
        title: "Services list",
        status: "pass",
        summary: `${services.length} service(s) are listed.`,
        whyItMatters:
          "A services list helps customers see what they can book or request. It is not treated as a guaranteed ranking lever.",
        recommendation: "Keep service names aligned with what you actually offer.",
        evidence: { serviceCount: services.length, productCount: products.length },
      });
    }

    if (products.length > 0) {
      return createGbpFinding({
        id: "profile.services",
        category: "profile_optimization",
        title: "Services list",
        status: "pass",
        summary: "No services list, but products are populated.",
        whyItMatters:
          "Product-led businesses may not need a services list. Missing services is not automatically a defect.",
        recommendation: "Add services only if you sell labor or appointments alongside products.",
        evidence: { serviceCount: 0, productCount: products.length },
      });
    }

    return createGbpFinding({
      id: "profile.services",
      category: "profile_optimization",
      title: "Services list",
      status: "warning",
      severity: "low",
      summary: "No services or products are listed.",
      whyItMatters:
        "Many profiles skip this section. Filling it in can still help customers scan what you do.",
      recommendation:
        "Add the main services customers ask for. This is optional completeness, not a requirement for every industry.",
      evidence: { serviceCount: 0, productCount: 0 },
    });
  },
};

function mediaFlagRule(
  id: "profile.logo" | "profile.cover",
  title: string,
  value: boolean | null,
  why: string,
): GbpAuditFinding {
  if (value === null) {
    return createGbpFinding({
      id,
      category: "profile_optimization",
      title,
      status: "insufficient_data",
      summary: `${title} could not be observed in this snapshot.`,
      whyItMatters: why,
      recommendation: "Refresh media data when the photo APIs are available.",
      evidence: { present: null },
    });
  }

  if (!value) {
    return createGbpFinding({
      id,
      category: "profile_optimization",
      title,
      status: "fail",
      summary: `${title} is missing.`,
      whyItMatters: why,
      recommendation: `Upload a clear ${title.toLowerCase()} that represents the business.`,
      evidence: { present: false },
    });
  }

  return createGbpFinding({
    id,
    category: "profile_optimization",
    title,
    status: "pass",
    summary: `${title} is present.`,
    whyItMatters: why,
    recommendation: "Replace dated artwork when branding changes.",
    evidence: { present: true },
  });
}

export const logoRule: GbpAuditRule = {
  id: "profile.logo",
  category: "profile_optimization",
  title: "Logo",
  evaluate({ profile }) {
    return mediaFlagRule(
      "profile.logo",
      "Logo",
      profile.media.logoPresent,
      "A logo makes the profile easier to recognize in search and Maps. This is a completeness check.",
    );
  },
};

export const coverRule: GbpAuditRule = {
  id: "profile.cover",
  category: "profile_optimization",
  title: "Cover photo",
  evaluate({ profile }) {
    return mediaFlagRule(
      "profile.cover",
      "Cover photo",
      profile.media.coverPhotoPresent,
      "A cover photo is often the first visual customers see on the profile.",
    );
  },
};

export const photosRule: GbpAuditRule = {
  id: "profile.photos",
  category: "profile_optimization",
  title: "Photo count",
  evaluate({ profile }) {
    const count = profile.media.photoCount;
    if (count === null) {
      return createGbpFinding({
        id: "profile.photos",
        category: "profile_optimization",
        title: "Photo count",
        status: "insufficient_data",
        summary: "Photo count was not observed in this snapshot.",
        whyItMatters:
          "Photos help customers judge the business. Unknown media is not scored as zero photos.",
        recommendation: "Sync photos when media APIs are available.",
        evidence: { photoCount: null },
      });
    }

    if (count < THRESHOLDS.photoCountWarning) {
      return createGbpFinding({
        id: "profile.photos",
        category: "profile_optimization",
        title: "Photo count",
        status: "fail",
        summary: `Only ${count} photo(s) are on the profile.`,
        whyItMatters:
          "Very few photos give customers little to go on. Counts here are a completeness heuristic, not a ranking formula.",
        recommendation: `Add real photos of the work, team, or location. A practical starting range is ${THRESHOLDS.photoCountAdequate}+ photos.`,
        evidence: { photoCount: count },
      });
    }

    if (count < THRESHOLDS.photoCountAdequate) {
      return createGbpFinding({
        id: "profile.photos",
        category: "profile_optimization",
        title: "Photo count",
        status: "warning",
        summary: `${count} photos — below the adequacy threshold of ${THRESHOLDS.photoCountAdequate}.`,
        whyItMatters: "A larger, current photo set usually looks more complete to customers.",
        recommendation: `Upload additional owner photos until you have at least ${THRESHOLDS.photoCountAdequate}.`,
        evidence: { photoCount: count },
      });
    }

    return createGbpFinding({
      id: "profile.photos",
      category: "profile_optimization",
      title: "Photo count",
      status: "pass",
      summary: `${count} photos are on the profile.`,
      whyItMatters: "There is enough media for a customer to scan the business.",
      recommendation: "Keep adding recent work photos over time.",
      evidence: { photoCount: count },
    });
  },
};

export const storefrontAddressRule: GbpAuditRule = {
  id: "profile.storefront_address",
  category: "profile_optimization",
  title: "Public storefront address",
  evaluate({ profile }) {
    const type = profile.configuration.locationType;
    if (type === "SERVICE_AREA") {
      return createGbpFinding({
        id: "profile.storefront_address",
        category: "profile_optimization",
        title: "Public storefront address",
        status: "not_applicable",
        summary: "Service-area businesses are not required to publish a customer-facing storefront.",
        whyItMatters:
          "Hiding a home or dispatch address can be the correct setup. This rule is skipped so SAB profiles are not penalized.",
        recommendation: "Keep the address private unless you have a public location customers should visit.",
        evidence: {
          locationType: type,
          hasPublicAddress: profile.configuration.hasPublicAddress,
        },
      });
    }

    const flag = profile.configuration.hasPublicAddress;
    if (flag === null) {
      return createGbpFinding({
        id: "profile.storefront_address",
        category: "profile_optimization",
        title: "Public storefront address",
        status: "insufficient_data",
        summary: "Storefront address visibility was not observed.",
        whyItMatters: "Unknown address visibility is not treated as a missing storefront.",
        recommendation: "Refresh profile data so address publication can be checked.",
        evidence: { locationType: type, hasPublicAddress: null },
      });
    }

    if (!flag) {
      return createGbpFinding({
        id: "profile.storefront_address",
        category: "profile_optimization",
        title: "Public storefront address",
        status: "warning",
        severity: "low",
        summary: "This storefront or hybrid profile does not publish a public address.",
        whyItMatters:
          "Customers expecting to visit may not find a pin. Some hybrid businesses still hide the address on purpose.",
        recommendation:
          "Publish the address if customers should walk in. Leave it hidden if you only meet clients on site.",
        evidence: { locationType: type, hasPublicAddress: false },
      });
    }

    return createGbpFinding({
      id: "profile.storefront_address",
      category: "profile_optimization",
      title: "Public storefront address",
      status: "pass",
      summary: "A public storefront address is published.",
      whyItMatters: "Visit-in-person businesses usually need a findable address.",
      recommendation: "Confirm the address matches the door customers use.",
      evidence: { locationType: type, hasPublicAddress: true },
    });
  },
};

export const profileRules: GbpAuditRule[] = [
  primaryCategoryRule,
  additionalCategoriesRule,
  descriptionPresentRule,
  descriptionSubstanceRule,
  phoneRule,
  websiteRule,
  regularHoursRule,
  serviceAreasRule,
  servicesRule,
  logoRule,
  coverRule,
  photosRule,
  storefrontAddressRule,
];
