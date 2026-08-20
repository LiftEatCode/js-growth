import { normalizeUsState } from "@/lib/competitive-intelligence/location-label";

const STREET_CITY_STATE_PATTERN =
  /,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?(?:,|\s*$)/i;

const SHORT_CITY_STATE_PATTERN =
  /^([^,]+),\s*([A-Za-z]{2,})(?:\s+\d{5}(?:-\d{4})?)?(?:,\s*USA)?\s*$/i;

export function parseUsCityState(formattedAddress: string | null | undefined): {
  city: string | null;
  state: string | null;
} {
  if (!formattedAddress) {
    return { city: null, state: null };
  }

  const streetMatch = formattedAddress.match(STREET_CITY_STATE_PATTERN);

  if (streetMatch) {
    return {
      city: streetMatch[1]?.trim() || null,
      state: normalizeUsState(streetMatch[2]),
    };
  }

  const shortMatch = formattedAddress.trim().match(SHORT_CITY_STATE_PATTERN);

  if (!shortMatch) {
    return { city: null, state: null };
  }

  return {
    city: shortMatch[1]?.trim() || null,
    state: normalizeUsState(shortMatch[2]),
  };
}
