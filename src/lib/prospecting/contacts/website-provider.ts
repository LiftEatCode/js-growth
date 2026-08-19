import "server-only";

import { fetchWebsitePage } from "@/lib/website-audit/audit-url";
import { extractSiteLinkCandidates } from "@/lib/website-audit/site/extract-candidates";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";
import { interpretPublicWebsiteUrl } from "@/lib/website-audit/schema";

import {
  CONTACT_PAGE_FETCH_CONCURRENCY,
  MAX_CONTACT_PAGES_PER_PROSPECT,
} from "./constants";
import {
  dedupeExtractedEmails,
  extractEmailsFromHtml,
} from "./extract";
import { normalizeContactCandidates } from "./normalize";
import { classifyContactPage, isSameHostUrl, selectContactPagesToFetch } from "./pages";
import type {
  ProspectContactDiscoveryProvider,
  WebsiteContactDiscoveryResult,
} from "./types";

function failedResult(message: string): WebsiteContactDiscoveryResult {
  return {
    pagesFetched: 0,
    pageUrls: [],
    candidates: [],
    failed: true,
    failureMessage: message,
  };
}

export function createWebsiteContactDiscoveryProvider(): ProspectContactDiscoveryProvider {
  return {
    async discoverProspectContacts(input) {
      const parsed = interpretPublicWebsiteUrl(input.websiteUrl);

      if (!parsed.success) {
        return failedResult(parsed.error);
      }

      const homepage = await fetchWebsitePage(parsed.url);

      if (!homepage.success) {
        return failedResult(homepage.error.message);
      }

      const homepageUrl = homepage.data.finalUrl;
      const linkedHrefs = extractSiteLinkCandidates(
        homepage.data.html,
        homepageUrl,
        homepageUrl,
        0,
      ).map((candidate) => candidate.normalized.href);

      const pages = selectContactPagesToFetch({
        homepageUrl,
        linkedHrefs,
        maxPages: MAX_CONTACT_PAGES_PER_PROSPECT,
      });

      const extra = pages.slice(1);
      const extraPages = await runWithConcurrency(
        extra,
        CONTACT_PAGE_FETCH_CONCURRENCY,
        async (page) => {
          const fetched = await fetchWebsitePage(page.href);

          if (!fetched.success) {
            return null;
          }

          if (!isSameHostUrl(fetched.data.finalUrl, homepageUrl)) {
            return null;
          }

          if (
            classifyContactPage(fetched.data.finalUrl, homepageUrl) ===
              "WEBSITE_OTHER" &&
            page.sourceType === "WEBSITE_OTHER"
          ) {
            return null;
          }

          return fetched.data;
        },
      );

      const fetchedPages = [
        homepage.data,
        ...extraPages.filter(
          (page): page is NonNullable<typeof page> => page !== null,
        ),
      ].slice(0, MAX_CONTACT_PAGES_PER_PROSPECT);

      const extracted = fetchedPages.flatMap((page) =>
        extractEmailsFromHtml(
          page.html,
          page.finalUrl,
          classifyContactPage(page.finalUrl, homepageUrl),
        ),
      );

      const hostname = new URL(homepageUrl).hostname;

      return {
        pagesFetched: fetchedPages.length,
        pageUrls: fetchedPages.map((page) => page.finalUrl),
        candidates: normalizeContactCandidates(
          dedupeExtractedEmails(extracted),
          hostname,
        ),
        failed: false,
        failureMessage: null,
      };
    },
  };
}
