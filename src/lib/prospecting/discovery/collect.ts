import {
  MAX_DISCOVERY_CANDIDATES_PER_RUN,
  MAX_PLACES_PAGE_SIZE,
  MAX_PROVIDER_REQUESTS_PER_RUN,
} from "./constants";
import { buildPlacesTextQuery } from "./industries";
import { clampDiscoveryLimit } from "./limit";
import type {
  BusinessDiscoveryProvider,
  DiscoveredBusiness,
} from "./types";

export interface CollectDiscoveryBusinessesInput {
  provider: BusinessDiscoveryProvider;
  industries: string[];
  locationLabel: string;
  radiusMiles: number | null;
  requestedLimit?: number;
}

export interface CollectDiscoveryBusinessesResult {
  businesses: DiscoveredBusiness[];
  providerRequestCount: number;
}

export async function collectDiscoveryBusinesses(
  input: CollectDiscoveryBusinessesInput,
): Promise<CollectDiscoveryBusinessesResult> {
  const limit = clampDiscoveryLimit(input.requestedLimit);
  const businesses: DiscoveredBusiness[] = [];
  const seenPlaceIds = new Set<string>();
  let providerRequestCount = 0;

  for (const industry of input.industries) {
    if (
      businesses.length >= limit ||
      providerRequestCount >= MAX_PROVIDER_REQUESTS_PER_RUN
    ) {
      break;
    }

    let pageToken: string | undefined;

    do {
      if (
        businesses.length >= limit ||
        providerRequestCount >= MAX_PROVIDER_REQUESTS_PER_RUN
      ) {
        break;
      }

      const remaining = limit - businesses.length;
      const pageSize = Math.min(MAX_PLACES_PAGE_SIZE, remaining);
      const page = await input.provider.search({
        query: buildPlacesTextQuery({
          industry,
          locationLabel: input.locationLabel,
          radiusMiles: input.radiusMiles,
        }),
        pageSize,
        pageToken,
      });

      providerRequestCount += 1;

      for (const business of page.businesses) {
        if (businesses.length >= limit) {
          break;
        }

        if (seenPlaceIds.has(business.providerBusinessId)) {
          continue;
        }

        seenPlaceIds.add(business.providerBusinessId);
        businesses.push(business);
      }

      pageToken = page.nextPageToken ?? undefined;

      if (!pageToken || page.businesses.length === 0) {
        break;
      }
    } while (providerRequestCount < MAX_PROVIDER_REQUESTS_PER_RUN);
  }

  return {
    businesses: businesses.slice(0, MAX_DISCOVERY_CANDIDATES_PER_RUN),
    providerRequestCount,
  };
}
