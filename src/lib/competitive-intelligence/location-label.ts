const US_STATE_NAME_TO_ABBREV: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

export function normalizeUsState(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return US_STATE_NAME_TO_ABBREV[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

export function normalizeCityToken(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Parse labels such as "Spring, TX", "Magnolia, Texas", or "Spring, TX, USA".
 */
export function parseLocationLabel(label: string | null | undefined): {
  city: string | null;
  state: string | null;
} {
  const trimmed = label?.trim();

  if (!trimmed) {
    return { city: null, state: null };
  }

  const match = trimmed.match(
    /^([^,]+),\s*([A-Za-z]{2,})(?:\s+\d{5}(?:-\d{4})?)?(?:,\s*USA)?\s*$/i,
  );

  if (!match) {
    return { city: null, state: null };
  }

  return {
    city: match[1]?.trim() || null,
    state: normalizeUsState(match[2]),
  };
}

export function resolveTargetLocation(input: {
  prospectCity: string | null;
  prospectState: string | null;
  prospectAddress: string | null;
  campaignCity: string | null;
  campaignState: string | null;
  campaignLocationLabel: string;
  discoveryCity?: string | null;
  discoveryState?: string | null;
}): { city: string | null; state: string | null } {
  const fromProspect =
    input.prospectCity && input.prospectState
      ? {
          city: input.prospectCity.trim(),
          state: normalizeUsState(input.prospectState),
        }
      : null;

  if (fromProspect?.city && fromProspect.state) {
    return fromProspect;
  }

  const fromAddress = parseLocationLabel(input.prospectAddress);

  if (fromAddress.city && fromAddress.state) {
    return fromAddress;
  }

  const fromCampaign =
    input.campaignCity && input.campaignState
      ? {
          city: input.campaignCity.trim(),
          state: normalizeUsState(input.campaignState),
        }
      : null;

  if (fromCampaign?.city && fromCampaign.state) {
    return fromCampaign;
  }

  const fromDiscovery =
    input.discoveryCity && input.discoveryState
      ? {
          city: input.discoveryCity.trim(),
          state: normalizeUsState(input.discoveryState),
        }
      : null;

  if (fromDiscovery?.city && fromDiscovery.state) {
    return fromDiscovery;
  }

  const fromLabel = parseLocationLabel(input.campaignLocationLabel);

  if (fromLabel.city && fromLabel.state) {
    return fromLabel;
  }

  return {
    city:
      input.prospectCity?.trim() ||
      input.campaignCity?.trim() ||
      input.discoveryCity?.trim() ||
      fromLabel.city,
    state:
      normalizeUsState(input.prospectState) ||
      normalizeUsState(input.campaignState) ||
      normalizeUsState(input.discoveryState) ||
      fromLabel.state,
  };
}

export function citiesMatch(
  leftCity: string | null | undefined,
  rightCity: string | null | undefined,
): boolean {
  const left = normalizeCityToken(leftCity);
  const right = normalizeCityToken(rightCity);

  return Boolean(left && right && left === right);
}

export function statesMatch(
  leftState: string | null | undefined,
  rightState: string | null | undefined,
): boolean {
  const left = normalizeUsState(leftState);
  const right = normalizeUsState(rightState);

  return Boolean(left && right && left === right);
}

export function resolveComparableLocation(input: {
  city?: string | null;
  state?: string | null;
  locationLabel?: string | null;
  formattedAddress?: string | null;
}): { city: string | null; state: string | null } {
  const fromFields =
    input.city && input.state
      ? { city: input.city.trim(), state: normalizeUsState(input.state) }
      : null;

  if (fromFields?.city && fromFields.state) {
    return fromFields;
  }

  const fromLabel = parseLocationLabel(input.locationLabel);
  const fromAddress = parseLocationLabel(input.formattedAddress);

  return {
    city:
      input.city?.trim() ||
      fromLabel.city ||
      fromAddress.city,
    state:
      normalizeUsState(input.state) ||
      fromLabel.state ||
      fromAddress.state,
  };
}
