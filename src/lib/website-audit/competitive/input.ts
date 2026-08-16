import { parsePublicWebsiteUrl } from "../schema";
import { siteHostKey } from "../site/urls";
import { MAX_COMPETITORS } from "./constants";
import type {
  CompetitiveSkip,
  CompetitiveSkipReason,
  CompetitorInput,
} from "./types";

function hostnameKeyFromUrl(value: string): string | null {
  try {
    return siteHostKey(new URL(value).hostname);
  } catch {
    return null;
  }
}

function skipMessage(reason: CompetitiveSkipReason, url: string): string {
  switch (reason) {
    case "invalid-url":
      return `${url} is not a valid public website URL.`;
    case "blocked":
      return `${url} was skipped because private, local, or unsupported addresses are not allowed.`;
    case "same-site-as-customer":
      return `${url} matches the audited website and was not compared against itself.`;
    case "duplicate":
      return `${url} is the same site as another competitor URL and was not scanned twice.`;
    case "fetch-failed":
      return `${url} could not be fetched.`;
    case "timeout":
      return `${url} timed out during the competitor scan.`;
    case "time-budget":
      return `${url} was skipped because the competitive scan time budget was reached.`;
    case "redirect-duplicate":
      return `${url} redirected to a site that was already included.`;
  }
}

export function collectCompetitorRawUrls(formData: FormData): string[] {
  return [
    formData.get("competitorUrl1"),
    formData.get("competitorUrl2"),
    formData.get("competitorUrl3"),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export interface ParsedCompetitorInputs {
  attempted: boolean;
  submittedCount: number;
  accepted: CompetitorInput[];
  skipped: CompetitiveSkip[];
}

export function parseCompetitorInputs(
  rawUrls: string[],
  customerUrl: string,
): ParsedCompetitorInputs {
  const submitted = rawUrls
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPETITORS);

  const customerKey = hostnameKeyFromUrl(customerUrl);
  const seenKeys = new Set<string>();
  const accepted: CompetitorInput[] = [];
  const skipped: CompetitiveSkip[] = [];

  for (const raw of submitted) {
    const parsed = parsePublicWebsiteUrl(raw);

    if (!parsed.success) {
      const looksBlocked =
        /localhost|127\.0\.0\.1|0\.0\.0\.0|::1|private|local network|credentials|HTTP and HTTPS/i.test(
          parsed.error,
        );

      skipped.push({
        submittedUrl: raw,
        reason: looksBlocked ? "blocked" : "invalid-url",
        message: skipMessage(
          looksBlocked ? "blocked" : "invalid-url",
          raw,
        ),
      });
      continue;
    }

    const key = hostnameKeyFromUrl(parsed.url);

    if (!key) {
      skipped.push({
        submittedUrl: raw,
        reason: "invalid-url",
        message: skipMessage("invalid-url", raw),
      });
      continue;
    }

    if (customerKey && key === customerKey) {
      skipped.push({
        submittedUrl: parsed.url,
        reason: "same-site-as-customer",
        message: skipMessage("same-site-as-customer", raw),
      });
      continue;
    }

    if (seenKeys.has(key)) {
      skipped.push({
        submittedUrl: parsed.url,
        reason: "duplicate",
        message: skipMessage("duplicate", raw),
      });
      continue;
    }

    seenKeys.add(key);
    accepted.push({ submittedUrl: parsed.url });
  }

  return {
    attempted: submitted.length > 0,
    submittedCount: submitted.length,
    accepted,
    skipped,
  };
}

export function skipFor(
  submittedUrl: string,
  reason: CompetitiveSkipReason,
): CompetitiveSkip {
  return {
    submittedUrl,
    reason,
    message: skipMessage(reason, submittedUrl),
  };
}

export { skipMessage };
