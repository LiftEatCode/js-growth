import {
  fetchWebsitePage,
  type FetchWebsiteResult,
  type FetchedWebsitePage,
} from "@/lib/website-audit/audit-url";

export const CONTACT_DISCOVERY_FETCH_TIMEOUT_MS = 20_000;

export function buildWebsiteFetchCandidates(websiteUrl: string): string[] {
  const candidates: string[] = [];

  try {
    const parsed = new URL(websiteUrl);
    candidates.push(parsed.toString());

    const host = parsed.hostname.toLowerCase();
    const alt = host.startsWith("www.")
      ? host.slice(4)
      : `www.${host}`;

    if (alt !== host) {
      const alternate = new URL(parsed.toString());
      alternate.hostname = alt;
      candidates.push(alternate.toString());
    }
  } catch {
    candidates.push(websiteUrl);
  }

  return [...new Set(candidates)];
}

export function isGoogleAccountsLoginUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "accounts.google.com";
  } catch {
    return false;
  }
}

export function extractGoogleSitesContinueUrl(loginUrl: string): string | null {
  try {
    const parsed = new URL(loginUrl);
    const continueUrl = parsed.searchParams.get("continue");

    if (!continueUrl) {
      return null;
    }

    const target = new URL(continueUrl);

    if (target.hostname !== "sites.google.com") {
      return null;
    }

    return target.toString();
  } catch {
    return null;
  }
}

export async function fetchContactDiscoveryPage(
  websiteUrl: string,
): Promise<FetchWebsiteResult> {
  const candidates = buildWebsiteFetchCandidates(websiteUrl);
  let lastError: FetchWebsiteResult | null = null;

  for (const candidate of candidates) {
    const result = await fetchWebsitePage(candidate, {
      timeoutMs: CONTACT_DISCOVERY_FETCH_TIMEOUT_MS,
    });

    if (!result.success) {
      lastError = result;
      continue;
    }

    if (isGoogleAccountsLoginUrl(result.data.finalUrl)) {
      const continueUrl = extractGoogleSitesContinueUrl(result.data.finalUrl);

      if (continueUrl) {
        const direct = await fetchWebsitePage(continueUrl, {
          timeoutMs: CONTACT_DISCOVERY_FETCH_TIMEOUT_MS,
        });

        if (direct.success && !isGoogleAccountsLoginUrl(direct.data.finalUrl)) {
          return direct;
        }
      }

      lastError = {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message:
            "Google Sites content requires browser sign-in and cannot be fetched statically.",
        },
      };
      continue;
    }

    return result;
  }

  return (
    lastError ?? {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "The website could not be reached. Verify the URL and try again.",
      },
    }
  );
}

export type { FetchedWebsitePage };
