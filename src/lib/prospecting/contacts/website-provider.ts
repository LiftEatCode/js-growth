import "server-only";

import { interpretPublicWebsiteUrl } from "@/lib/website-audit/schema";
import { extractSiteLinkCandidates } from "@/lib/website-audit/site/extract-candidates";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

import {
  CONTACT_PAGE_FETCH_CONCURRENCY,
  MAX_CONTACT_PAGES_PER_PROSPECT,
} from "./constants";
import {
  dedupeExtractedContactForms,
  extractContactFormsFromHtml,
  summarizeContactFormExtraction,
} from "./extract-forms";
import {
  dedupeExtractedEmails,
  extractEmailsFromHtml,
} from "./extract";
import { fetchContactDiscoveryPage } from "./fetch-page";
import type { NormalizedContactFormCandidate } from "./form-types";
import { normalizeContactCandidates } from "./normalize";
import { classifyContactPage, isSameHostUrl, selectContactPagesToFetch } from "./pages";
import type {
  ProspectContactDiscoveryProvider,
  WebsiteContactDiscoveryResult,
} from "./types";

export interface ContactDiscoveryDiagnostics {
  pagesSelected: number;
  rawFormsSeen: number;
  formsAccepted: number;
  emailsFound: number;
  fetchFailures: number;
}

function failedResult(
  message: string,
  diagnostics?: ContactDiscoveryDiagnostics,
): WebsiteContactDiscoveryResult {
  return {
    pagesFetched: 0,
    pageUrls: [],
    candidates: [],
    forms: [],
    failed: true,
    failureMessage: message,
    diagnostics: diagnostics ?? {
      pagesSelected: 0,
      rawFormsSeen: 0,
      formsAccepted: 0,
      emailsFound: 0,
      fetchFailures: 1,
    },
  };
}

export function createWebsiteContactDiscoveryProvider(): ProspectContactDiscoveryProvider {
  return {
    async discoverProspectContacts(input) {
      const parsed = interpretPublicWebsiteUrl(input.websiteUrl);

      if (!parsed.success) {
        return failedResult(parsed.error);
      }

      const homepage = await fetchContactDiscoveryPage(parsed.url);

      if (!homepage.success) {
        return failedResult(homepage.error.message);
      }

      const homepageUrl = homepage.data.finalUrl;
      const linkCandidates = extractSiteLinkCandidates(
        homepage.data.html,
        homepageUrl,
        homepageUrl,
        0,
      );

      const pages = selectContactPagesToFetch({
        homepageUrl,
        linkedHrefs: linkCandidates.map((candidate) => candidate.normalized.href),
        linkedCandidates: linkCandidates.map((candidate) => ({
          href: candidate.normalized.href,
          anchorText: candidate.anchorText,
        })),
        maxPages: MAX_CONTACT_PAGES_PER_PROSPECT,
      });

      const extra = pages.slice(1);
      const extraPages = await runWithConcurrency(
        extra,
        CONTACT_PAGE_FETCH_CONCURRENCY,
        async (page) => {
          const fetched = await fetchContactDiscoveryPage(page.href);

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

      let rawFormsSeen = 0;

      const extracted = fetchedPages.flatMap((page) => {
        const sourceType = classifyContactPage(page.finalUrl, homepageUrl);
        const stats = summarizeContactFormExtraction(
          page.html,
          page.finalUrl,
          sourceType,
        );
        rawFormsSeen += stats.rawForms;

        return extractEmailsFromHtml(page.html, page.finalUrl, sourceType);
      });

      const extractedForms = fetchedPages.flatMap((page) =>
        extractContactFormsFromHtml(
          page.html,
          page.finalUrl,
          classifyContactPage(page.finalUrl, homepageUrl),
        ),
      );

      const hostname = new URL(homepageUrl).hostname;

      const forms: NormalizedContactFormCandidate[] = dedupeExtractedContactForms(
        extractedForms,
      ).map((form) => ({
        url: form.url,
        normalizedUrl: form.normalizedUrl,
        sourcePageUrl: form.sourcePageUrl,
        formMethod: form.formMethod,
        formAction: form.formAction,
        detectedFields: form.detectedFields,
        confidence: form.confidence,
        confidenceReason: form.confidenceReason,
      }));

      const normalizedCandidates = normalizeContactCandidates(
        dedupeExtractedEmails(extracted),
        hostname,
      );

      return {
        pagesFetched: fetchedPages.length,
        pageUrls: fetchedPages.map((page) => page.finalUrl),
        candidates: normalizedCandidates,
        forms,
        failed: false,
        failureMessage: null,
        diagnostics: {
          pagesSelected: pages.length,
          rawFormsSeen,
          formsAccepted: forms.length,
          emailsFound: normalizedCandidates.length,
          fetchFailures: pages.length - fetchedPages.length,
        },
      };
    },
  };
}
