import { interpretPublicWebsiteUrl } from "@/lib/website-audit/schema";
import { siteHostKey } from "@/lib/website-audit/site/urls";

export type NormalizedProspectWebsite =
  | {
      success: true;
      website: string;
      hostname: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Normalize a public website to a comparable hostname.
 *
 * `https://www.example.com/about` and `http://example.com` both become
 * `example.com`. Localhost and private network addresses are rejected.
 */
export function normalizeProspectWebsite(
  input: string,
): NormalizedProspectWebsite {
  const parsed = interpretPublicWebsiteUrl(input);

  if (!parsed.success) {
    return parsed;
  }

  const url = new URL(parsed.url);

  return {
    success: true,
    website: parsed.url,
    hostname: siteHostKey(url.hostname),
  };
}

export function tryNormalizeProspectHostname(
  input: string | null | undefined,
): string | null {
  if (!input || !input.trim()) {
    return null;
  }

  const normalized = normalizeProspectWebsite(input);

  return normalized.success ? normalized.hostname : null;
}
