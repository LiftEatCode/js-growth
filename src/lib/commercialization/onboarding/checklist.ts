import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";

import type { ChecklistTemplateItem } from "./types";

const ALWAYS: ChecklistTemplateItem[] = [
  {
    key: "CLIENT_CONTACT_CONFIRMED",
    label: "Client contact confirmed",
    description: "Confirm primary contact name and email for project coordination.",
    required: true,
    sortOrder: 10,
  },
  {
    key: "AGREEMENT_ACCEPTED",
    label: "Agreement accepted",
    description: "Accepted Agreement is on file (auto-satisfied at conversion).",
    required: true,
    sortOrder: 20,
  },
  {
    key: "INITIAL_PAYMENT_CONFIRMED",
    label: "Initial payment confirmed",
    description:
      "Deposit or full payment required to start is confirmed in CommercialPayment records.",
    required: true,
    sortOrder: 30,
  },
  {
    key: "PROJECT_KICKOFF_SCHEDULED",
    label: "Project kickoff scheduled",
    description: "Schedule kickoff with the client.",
    required: true,
    sortOrder: 140,
  },
  {
    key: "PROJECT_KICKOFF_COMPLETED",
    label: "Project kickoff completed",
    description: "Kickoff meeting held; delivery can begin.",
    required: true,
    sortOrder: 150,
  },
];

/**
 * Deterministic capability-aware onboarding checklist.
 * Never asks for passwords — track access status only.
 */
export function buildOnboardingChecklistTemplate(options: {
  capabilities: ServiceCapabilityId[];
}): ChecklistTemplateItem[] {
  const caps = new Set(options.capabilities);
  const items: ChecklistTemplateItem[] = [...ALWAYS];

  if (
    caps.has("WEBSITE_DEVELOPMENT") ||
    caps.has("SEO") ||
    caps.has("CONTENT") ||
    caps.has("CONVERSION_OPTIMIZATION")
  ) {
    items.push(
      {
        key: "WEBSITE_ACCESS_REQUESTED",
        label: "Website / CMS access requested",
        description:
          "Request CMS collaborator access via platform invitation — never store passwords.",
        required: true,
        sortOrder: 40,
      },
      {
        key: "WEBSITE_ACCESS_RECEIVED",
        label: "Website / CMS access received",
        description: "Confirm delegated CMS/user access is available.",
        required: true,
        sortOrder: 50,
      },
      {
        key: "HOSTING_ACCESS_REQUESTED",
        label: "Hosting access requested",
        description: "Request hosting/team invitation when needed for deployment.",
        required: false,
        sortOrder: 60,
      },
      {
        key: "HOSTING_ACCESS_RECEIVED",
        label: "Hosting access received",
        description: "Hosting collaborator access confirmed or marked not required.",
        required: false,
        sortOrder: 70,
      },
      {
        key: "DOMAIN_DNS_ACCESS_IF_REQUIRED",
        label: "Domain / DNS access",
        description: "Track DNS access only if required for this engagement.",
        required: false,
        sortOrder: 80,
      },
    );
  }

  if (caps.has("SEO") || caps.has("LOCAL_SEO") || caps.has("CONTENT")) {
    items.push(
      {
        key: "GOOGLE_ANALYTICS_ACCESS_IF_REQUIRED",
        label: "Google Analytics access",
        description: "Invite to Analytics property — do not collect login passwords.",
        required: false,
        sortOrder: 90,
      },
      {
        key: "SEARCH_CONSOLE_ACCESS_IF_REQUIRED",
        label: "Search Console access",
        description: "Invite to Search Console property when SEO work is included.",
        required: caps.has("SEO"),
        sortOrder: 100,
      },
    );
  }

  if (caps.has("LOCAL_SEO")) {
    items.push({
      key: "GOOGLE_BUSINESS_PROFILE_ACCESS_IF_REQUIRED",
      label: "Google Business Profile access",
      description: "Request GBP manager invitation for Local SEO work.",
      required: true,
      sortOrder: 110,
    });
  }

  if (caps.has("CONTENT") || caps.has("WEBSITE_DEVELOPMENT")) {
    items.push(
      {
        key: "CONTENT_ASSETS_REQUESTED",
        label: "Content / business details requested",
        description: "Request service details, copy inputs, or content assets as needed.",
        required: caps.has("CONTENT"),
        sortOrder: 120,
      },
      {
        key: "BRAND_ASSETS_REQUESTED",
        label: "Brand assets requested",
        description: "Logos, style guidance, and brand materials when relevant.",
        required: false,
        sortOrder: 130,
      },
    );
  }

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isOnboardingItemSatisfied(status: string): boolean {
  return (
    status === "COMPLETED" ||
    status === "RECEIVED" ||
    status === "NOT_REQUIRED"
  );
}
