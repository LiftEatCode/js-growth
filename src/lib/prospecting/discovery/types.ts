export interface DiscoveredBusiness {
  provider: "GOOGLE_PLACES";
  providerBusinessId: string;
  businessName: string;
  website: string | null;
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface BusinessDiscoveryRequest {
  query: string;
  pageSize: number;
  pageToken?: string;
}

export interface BusinessDiscoveryPage {
  businesses: DiscoveredBusiness[];
  nextPageToken: string | null;
}

export interface BusinessDiscoveryProvider {
  readonly id: string;
  search(request: BusinessDiscoveryRequest): Promise<BusinessDiscoveryPage>;
}

export type DiscoveryCandidateStatusValue =
  | "ELIGIBLE"
  | "NO_WEBSITE"
  | "INVALID_WEBSITE"
  | "DUPLICATE_PLACE"
  | "DUPLICATE_HOSTNAME"
  | "EXISTING_PROSPECT"
  | "ALREADY_IN_CAMPAIGN"
  | "EXISTING_LEAD"
  | "SUPPRESSED";

export interface ClassifiedDiscoveryCandidate {
  business: DiscoveredBusiness;
  hostname: string | null;
  website: string | null;
  status: DiscoveryCandidateStatusValue;
  exclusionReason: string | null;
}

export interface DiscoveryDedupContext {
  campaignProspectHostnames: Set<string>;
  campaignProspectPlaceIds: Set<string>;
  prospectHostnames: Map<string, string>;
  prospectPlaceIds: Map<string, string>;
  leadHostnames: Set<string>;
  suppressedHostnames: Set<string>;
}

export class DiscoveryProviderError extends Error {
  readonly code:
    | "missing-key"
    | "unauthorized"
    | "quota"
    | "invalid-request"
    | "timeout"
    | "unavailable"
    | "invalid-response";

  constructor(
    code: DiscoveryProviderError["code"],
    message: string,
  ) {
    super(message);
    this.name = "DiscoveryProviderError";
    this.code = code;
  }
}

export function safeDiscoveryErrorMessage(
  error: unknown,
): string {
  if (error instanceof DiscoveryProviderError) {
    switch (error.code) {
      case "missing-key":
        return "Business discovery is not configured.";
      case "unauthorized":
        return "Google Places rejected the credentials for this request.";
      case "quota":
        return "Google Places quota was exceeded. Try again later.";
      case "invalid-request":
        return "Google Places rejected the discovery request.";
      case "timeout":
        return "Google Places took too long to respond.";
      case "invalid-response":
        return "Google Places returned an unusable response.";
      default:
        return "Google Places is temporarily unavailable.";
    }
  }

  return "Business discovery could not be completed.";
}
