import { siteHostKey } from "@/lib/website-audit/site/urls";

import { CONSUMER_MAILBOX_DOMAINS } from "./constants";
import type {
  ContactConfidence,
  ExtractedEmailCandidate,
  NormalizedContactCandidate,
} from "./types";

export function emailDomain(email: string): string | null {
  const domain = email.split("@")[1];
  return domain ? siteHostKey(domain) : null;
}

export function emailMatchesProspectHostname(
  email: string,
  prospectHostname: string | null,
): boolean {
  if (!prospectHostname) {
    return false;
  }

  const domain = emailDomain(email);

  if (!domain) {
    return false;
  }

  const host = siteHostKey(prospectHostname);

  return domain === host || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
}

export function isConsumerMailbox(email: string): boolean {
  const domain = emailDomain(email);
  return domain ? CONSUMER_MAILBOX_DOMAINS.has(domain) : false;
}

export function scoreContactConfidence(options: {
  email: string;
  prospectHostname: string | null;
  firstParty: boolean;
}): { confidence: ContactConfidence; reason: string } {
  if (!options.firstParty) {
    return {
      confidence: "LOW",
      reason: "Email did not come from a first-party page.",
    };
  }

  if (emailMatchesProspectHostname(options.email, options.prospectHostname)) {
    return {
      confidence: "HIGH",
      reason: "Email domain matches the business website.",
    };
  }

  if (isConsumerMailbox(options.email)) {
    return {
      confidence: "MEDIUM",
      reason: "Consumer mailbox published on the business website.",
    };
  }

  return {
    confidence: "MEDIUM",
    reason: "Published on the business website with a different domain.",
  };
}

export function normalizeContactCandidates(
  extracted: ExtractedEmailCandidate[],
  prospectHostname: string | null,
): NormalizedContactCandidate[] {
  return extracted.map((candidate) => {
    const scored = scoreContactConfidence({
      email: candidate.normalizedEmail,
      prospectHostname,
      firstParty: true,
    });

    return {
      email: candidate.email,
      normalizedEmail: candidate.normalizedEmail,
      name: candidate.name,
      role: candidate.role,
      sourceUrl: candidate.sourceUrl,
      sourceType: candidate.sourceType,
      confidence: scored.confidence,
      confidenceReason: scored.reason,
    };
  });
}
