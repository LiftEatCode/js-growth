import "server-only";

import {
  DISCOVERY_PROVIDER_GOOGLE_PLACES,
  DISCOVERY_REQUEST_TIMEOUT_MS,
  GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
  GOOGLE_PLACES_TEXT_SEARCH_URL,
  MAX_PLACES_PAGE_SIZE,
} from "./constants";
import { normalizeGooglePlace } from "./google-places-normalize";
import type {
  BusinessDiscoveryPage,
  BusinessDiscoveryProvider,
  BusinessDiscoveryRequest,
} from "./types";
import { DiscoveryProviderError } from "./types";

interface GoogleTextSearchResponse {
  places?: unknown[];
  nextPageToken?: string;
  error?: {
    code?: number;
    status?: string;
    message?: string;
  };
}

export function getGooglePlacesApiKey(): string | null {
  const value = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return value ? value : null;
}

function mapGoogleStatus(
  status: string | undefined,
  httpStatus: number,
): DiscoveryProviderError["code"] {
  if (status === "UNAUTHENTICATED" || httpStatus === 401 || httpStatus === 403) {
    return "unauthorized";
  }

  if (status === "RESOURCE_EXHAUSTED" || httpStatus === 429) {
    return "quota";
  }

  if (
    status === "INVALID_ARGUMENT" ||
    status === "FAILED_PRECONDITION" ||
    httpStatus === 400
  ) {
    return "invalid-request";
  }

  if (httpStatus >= 500 || status === "UNAVAILABLE" || status === "INTERNAL") {
    return "unavailable";
  }

  return "unavailable";
}

async function searchTextOnce(
  apiKey: string,
  request: BusinessDiscoveryRequest,
): Promise<BusinessDiscoveryPage> {
  const pageSize = Math.min(
    MAX_PLACES_PAGE_SIZE,
    Math.max(1, request.pageSize),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCOVERY_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: request.query,
        pageSize,
        languageCode: "en",
        regionCode: "US",
        ...(request.pageToken ? { pageToken: request.pageToken } : {}),
      }),
      signal: controller.signal,
    });

    let payload: GoogleTextSearchResponse | null = null;

    try {
      payload = (await response.json()) as GoogleTextSearchResponse;
    } catch {
      throw new DiscoveryProviderError(
        "invalid-response",
        "Google Places returned a non-JSON response.",
      );
    }

    if (!response.ok) {
      throw new DiscoveryProviderError(
        mapGoogleStatus(payload.error?.status, response.status),
        "Google Places request failed.",
      );
    }

    const businesses = (payload.places ?? [])
      .map((place) =>
        normalizeGooglePlace(place as Parameters<typeof normalizeGooglePlace>[0]),
      )
      .filter((place): place is NonNullable<typeof place> => place !== null);

    return {
      businesses,
      nextPageToken: payload.nextPageToken?.trim() || null,
    };
  } catch (error) {
    if (error instanceof DiscoveryProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new DiscoveryProviderError(
        "timeout",
        "Google Places request timed out.",
      );
    }

    throw new DiscoveryProviderError(
      "unavailable",
      "Google Places request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function isTransient(error: unknown): boolean {
  return (
    error instanceof DiscoveryProviderError &&
    (error.code === "timeout" || error.code === "unavailable")
  );
}

export function createGooglePlacesBusinessDiscoveryProvider(options: {
  apiKey: string | null;
}): BusinessDiscoveryProvider {
  return {
    id: DISCOVERY_PROVIDER_GOOGLE_PLACES,
    async search(request): Promise<BusinessDiscoveryPage> {
      if (!options.apiKey) {
        throw new DiscoveryProviderError(
          "missing-key",
          "GOOGLE_PLACES_API_KEY is not configured.",
        );
      }

      try {
        return await searchTextOnce(options.apiKey, request);
      } catch (error) {
        if (!isTransient(error)) {
          throw error;
        }

        return searchTextOnce(options.apiKey, request);
      }
    },
  };
}
