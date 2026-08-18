import {
  DEFAULT_DESIRED_QUALIFIED_COUNT,
  MAX_CAMPAIGN_NAME_LENGTH,
  MAX_CITY_LENGTH,
  MAX_DESIRED_QUALIFIED_COUNT,
  MAX_INDUSTRY_LENGTH,
  MAX_LOCATION_LABEL_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_RADIUS_MILES,
  MAX_STATE_LENGTH,
  MIN_DESIRED_QUALIFIED_COUNT,
} from "./constants";

export interface ParsedCampaignInput {
  name: string;
  locationLabel: string;
  city: string | null;
  state: string | null;
  radiusMiles: number | null;
  industries: string[];
  desiredQualifiedCount: number;
  notes: string | null;
}

export type CampaignParseResult =
  | {
      success: true;
      data: ParsedCampaignInput;
    }
  | {
      success: false;
      error: string;
    };

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseIndustries(values: string[]): string[] {
  const seen = new Set<string>();
  const industries: string[] = [];

  for (const value of values) {
    const pieces = value
      .split(",")
      .map((piece) => piece.trim())
      .filter(Boolean);

    for (const piece of pieces) {
      const key = piece.toLowerCase();
      if (seen.has(key) || piece.length > MAX_INDUSTRY_LENGTH) {
        continue;
      }
      seen.add(key);
      industries.push(piece);
    }
  }

  return industries;
}

export function parseDesiredQualifiedCount(
  value: string | null | undefined,
): number {
  if (value === null || value === undefined || value.trim() === "") {
    return DEFAULT_DESIRED_QUALIFIED_COUNT;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export function parseCampaignInput(input: {
  name: string;
  locationLabel: string;
  city: string;
  state: string;
  radiusMiles: string;
  industries: string[];
  desiredQualifiedCount: string;
  notes: string;
}): CampaignParseResult {
  const name = input.name.trim();

  if (!name) {
    return {
      success: false,
      error: "Campaign name is required.",
    };
  }

  if (name.length > MAX_CAMPAIGN_NAME_LENGTH) {
    return {
      success: false,
      error: `Campaign name must be ${MAX_CAMPAIGN_NAME_LENGTH} characters or fewer.`,
    };
  }

  const city = trimToNull(input.city);
  const state = trimToNull(input.state);
  let locationLabel = input.locationLabel.trim();

  if (!locationLabel && city && state) {
    locationLabel = `${city}, ${state}`;
  }

  if (!locationLabel) {
    return {
      success: false,
      error: "Enter a location label or city and state.",
    };
  }

  if (locationLabel.length > MAX_LOCATION_LABEL_LENGTH) {
    return {
      success: false,
      error: `Location must be ${MAX_LOCATION_LABEL_LENGTH} characters or fewer.`,
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

  const industries = parseIndustries(input.industries);

  if (industries.length === 0) {
    return {
      success: false,
      error: "Select or enter at least one industry.",
    };
  }

  const desiredQualifiedCount = parseDesiredQualifiedCount(
    input.desiredQualifiedCount,
  );

  if (
    !Number.isInteger(desiredQualifiedCount) ||
    desiredQualifiedCount < MIN_DESIRED_QUALIFIED_COUNT ||
    desiredQualifiedCount > MAX_DESIRED_QUALIFIED_COUNT
  ) {
    return {
      success: false,
      error: `Desired qualified prospects must be between ${MIN_DESIRED_QUALIFIED_COUNT} and ${MAX_DESIRED_QUALIFIED_COUNT}.`,
    };
  }

  const radiusRaw = input.radiusMiles.trim();
  let radiusMiles: number | null = null;

  if (radiusRaw) {
    const parsedRadius = Number.parseInt(radiusRaw, 10);

    if (
      !Number.isInteger(parsedRadius) ||
      parsedRadius < 1 ||
      parsedRadius > MAX_RADIUS_MILES
    ) {
      return {
        success: false,
        error: `Radius must be between 1 and ${MAX_RADIUS_MILES} miles.`,
      };
    }

    radiusMiles = parsedRadius;
  }

  const notes = trimToNull(input.notes);

  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return {
      success: false,
      error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
    };
  }

  return {
    success: true,
    data: {
      name,
      locationLabel,
      city,
      state,
      radiusMiles,
      industries,
      desiredQualifiedCount,
      notes,
    },
  };
}
