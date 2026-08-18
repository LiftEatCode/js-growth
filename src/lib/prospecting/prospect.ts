import {
  MAX_ADDRESS_LENGTH,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_CITY_LENGTH,
  MAX_INDUSTRY_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_SKIP_REASON_LENGTH,
  MAX_STATE_LENGTH,
  MIN_SKIP_REASON_LENGTH,
} from "./constants";
import { normalizeProspectWebsite } from "./hostname";

export interface ParsedProspectInput {
  businessName: string;
  website: string | null;
  hostname: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  notes: string | null;
}

export type ProspectParseResult =
  | {
      success: true;
      data: ParsedProspectInput;
    }
  | {
      success: false;
      error: string;
    };

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseProspectInput(input: {
  businessName: string;
  website: string;
  industry: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  notes: string;
}): ProspectParseResult {
  const businessName = input.businessName.trim();

  if (!businessName) {
    return {
      success: false,
      error: "Business name is required.",
    };
  }

  if (businessName.length > MAX_BUSINESS_NAME_LENGTH) {
    return {
      success: false,
      error: `Business name must be ${MAX_BUSINESS_NAME_LENGTH} characters or fewer.`,
    };
  }

  const websiteRaw = input.website.trim();
  let website: string | null = null;
  let hostname: string | null = null;

  if (websiteRaw) {
    const normalized = normalizeProspectWebsite(websiteRaw);

    if (!normalized.success) {
      return {
        success: false,
        error: normalized.error,
      };
    }

    website = normalized.website;
    hostname = normalized.hostname;
  }

  const industry = trimToNull(input.industry);
  const city = trimToNull(input.city);
  const state = trimToNull(input.state);
  const address = trimToNull(input.address);
  const phone = trimToNull(input.phone);
  const notes = trimToNull(input.notes);

  if (industry && industry.length > MAX_INDUSTRY_LENGTH) {
    return {
      success: false,
      error: `Industry must be ${MAX_INDUSTRY_LENGTH} characters or fewer.`,
    };
  }

  if (city && city.length > MAX_CITY_LENGTH) {
    return {
      success: false,
      error: `City must be ${MAX_CITY_LENGTH} characters or fewer.`,
    };
  }

  if (state && state.length > MAX_STATE_LENGTH) {
    return {
      success: false,
      error: `State must be ${MAX_STATE_LENGTH} characters or fewer.`,
    };
  }

  if (address && address.length > MAX_ADDRESS_LENGTH) {
    return {
      success: false,
      error: `Address must be ${MAX_ADDRESS_LENGTH} characters or fewer.`,
    };
  }

  if (phone && phone.length > MAX_PHONE_LENGTH) {
    return {
      success: false,
      error: `Phone must be ${MAX_PHONE_LENGTH} characters or fewer.`,
    };
  }

  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return {
      success: false,
      error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
    };
  }

  return {
    success: true,
    data: {
      businessName,
      website,
      hostname,
      industry,
      city,
      state,
      address,
      phone,
      notes,
    },
  };
}

export function parseSkipReason(
  value: string,
):
  | {
      success: true;
      reason: string;
    }
  | {
      success: false;
      error: string;
    } {
  const reason = value.trim();

  if (reason.length < MIN_SKIP_REASON_LENGTH) {
    return {
      success: false,
      error: "Enter a skip reason so later reviews know why this business was excluded.",
    };
  }

  if (reason.length > MAX_SKIP_REASON_LENGTH) {
    return {
      success: false,
      error: `Skip reason must be ${MAX_SKIP_REASON_LENGTH} characters or fewer.`,
    };
  }

  return {
    success: true,
    reason,
  };
}

export function isProspectAttachedToCampaign(
  existingPairs: Array<{ campaignId: string; prospectId: string }>,
  campaignId: string,
  prospectId: string,
): boolean {
  return existingPairs.some(
    (pair) => pair.campaignId === campaignId && pair.prospectId === prospectId,
  );
}
