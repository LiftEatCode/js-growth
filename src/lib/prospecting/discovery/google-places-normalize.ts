import { parseUsCityState } from "./address";
import { DISCOVERY_PROVIDER_GOOGLE_PLACES } from "./constants";
import type { DiscoveredBusiness } from "./types";

export interface GooglePlaceTextSearchPlace {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  primaryType?: string;
  primaryTypeDisplayName?: {
    text?: string;
  };
  location?: {
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    lng?: number | string;
  };
}

function readCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeGooglePlace(
  place: GooglePlaceTextSearchPlace,
): DiscoveredBusiness | null {
  const providerBusinessId = place.id?.trim();
  const businessName = place.displayName?.text?.trim();

  if (!providerBusinessId || !businessName) {
    return null;
  }

  const formattedAddress = place.formattedAddress?.trim() || null;
  const parsedAddress = parseUsCityState(formattedAddress);
  const category =
    place.primaryTypeDisplayName?.text?.trim() ||
    place.primaryType?.trim() ||
    null;

  return {
    provider: DISCOVERY_PROVIDER_GOOGLE_PLACES,
    providerBusinessId,
    businessName,
    website: place.websiteUri?.trim() || null,
    formattedAddress,
    city: parsedAddress.city,
    state: parsedAddress.state,
    phone: place.nationalPhoneNumber?.trim() || null,
    category,
    latitude:
      readCoordinate(place.location?.latitude ?? place.location?.lat),
    longitude:
      readCoordinate(place.location?.longitude ?? place.location?.lng),
  };
}
