const CITY_STATE_PATTERN =
  /,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?(?:,|\s*$)/;

export function parseUsCityState(formattedAddress: string | null | undefined): {
  city: string | null;
  state: string | null;
} {
  if (!formattedAddress) {
    return { city: null, state: null };
  }

  const match = formattedAddress.match(CITY_STATE_PATTERN);

  if (!match) {
    return { city: null, state: null };
  }

  return {
    city: match[1]?.trim() || null,
    state: match[2]?.trim() || null,
  };
}
