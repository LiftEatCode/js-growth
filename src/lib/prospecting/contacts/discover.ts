import "server-only";

import { prisma } from "@/lib/prisma";
import { loadQualificationBlockers } from "@/lib/prospecting/qualification/audit-prospect";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import type { Prisma } from "@/generated/prisma/client";

import { CONTACT_TTL_MS } from "./constants";
import { isReusableContactDiscovery } from "./limit";
import { selectPrimaryContact } from "./select";
import { createWebsiteContactDiscoveryProvider } from "./website-provider";
import type {
  ContactDiscoveryOutcomeCode,
  NormalizedContactCandidate,
  ProspectContactDiscoveryProvider,
} from "./types";
import {
  canContactProspect,
} from "@/lib/prospecting/suppression/can-contact";
import { loadContactSuppressionContext } from "@/lib/prospecting/suppression/load";

export interface DiscoverProspectContactsResult {
  outcome: ContactDiscoveryOutcomeCode;
  reused: boolean;
  contactCount: number;
  primaryEmail: string | null;
  message: string;
}

function isUsableContactStatus(status: string): boolean {
  return status === "DISCOVERED" || status === "SELECTED";
}

export async function discoverProspectContacts(options: {
  prospectId: string;
  websiteUrl: string;
  force?: boolean;
  provider?: ProspectContactDiscoveryProvider;
}): Promise<DiscoverProspectContactsResult> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: options.prospectId },
    include: {
      contacts: true,
    },
  });

  if (!prospect) {
    return {
      outcome: "CONTACT_DISCOVERY_FAILED",
      reused: false,
      contactCount: 0,
      primaryEmail: null,
      message: "The prospect could not be found.",
    };
  }

  const usableContacts = prospect.contacts.filter((contact) =>
    isUsableContactStatus(contact.status),
  );
  const hasUsableContact = usableContacts.some((contact) => {
    const verifiedAt = contact.lastVerifiedAt ?? contact.discoveredAt;
    return Date.now() - verifiedAt.getTime() < CONTACT_TTL_MS;
  });

  if (
    !options.force &&
    isReusableContactDiscovery({
      lastContactDiscoveryAt: prospect.lastContactDiscoveryAt,
      outreachStatus: prospect.outreachStatus,
      hasUsableContact,
    })
  ) {
    const primary =
      usableContacts.find((contact) => contact.isPrimary) ?? usableContacts[0] ?? null;

    return {
      outcome: hasUsableContact
        ? "REUSED"
        : prospect.outreachStatus === "SUPPRESSED"
          ? "SUPPRESSED"
          : "NO_PUBLIC_EMAIL_FOUND",
      reused: true,
      contactCount: usableContacts.length,
      primaryEmail: primary?.email ?? null,
      message: hasUsableContact
        ? "Recently discovered contacts were reused."
        : "A recent search already found no public email.",
    };
  }

  const provider =
    options.provider ?? createWebsiteContactDiscoveryProvider();
  const discovered = await provider.discoverProspectContacts({
    websiteUrl: options.websiteUrl,
  });

  if (discovered.failed) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        outreachStatus: "CONTACT_DISCOVERY_FAILED",
        lastContactDiscoveryAt: new Date(),
      },
    });

    return {
      outcome: "CONTACT_DISCOVERY_FAILED",
      reused: false,
      contactCount: usableContacts.length,
      primaryEmail: null,
      message:
        discovered.failureMessage ??
        "The website could not be checked for contact information.",
    };
  }

  const now = new Date();
  const hostname = prospect.hostname ?? tryNormalizeProspectHostname(prospect.website);

  await persistDiscoveredContacts({
    prospectId: prospect.id,
    candidates: discovered.candidates,
    now,
  });

  const stored = await prisma.prospectContact.findMany({
    where: { prospectId: prospect.id },
  });

  const suppression = await loadContactSuppressionContext({
    hostname,
    emails: stored.map((contact) => contact.normalizedEmail),
  });
  const blockers = await loadQualificationBlockers({ hostname });

  const selectable = stored.filter((contact) => contact.status !== "REJECTED");

  for (const contact of selectable) {
    const decision = canContactProspect({
      hostname,
      email: contact.normalizedEmail,
      suppressedHostnames: suppression.suppressedHostnames,
      suppressedEmails: suppression.suppressedEmails,
      customerHostnames: suppression.customerHostnames,
      existingLead: blockers.existingLead,
      contactStatus: contact.status,
    });

    if (
      !decision.allowed &&
      (decision.reasons.includes("EMAIL_SUPPRESSED") ||
        decision.reasons.includes("HOSTNAME_SUPPRESSED") ||
        decision.reasons.includes("CUSTOMER"))
    ) {
      await prisma.prospectContact.update({
        where: { id: contact.id },
        data: {
          status: "SUPPRESSED",
          isPrimary: false,
        },
      });
    }
  }

  const refreshed = await prisma.prospectContact.findMany({
    where: { id: { in: stored.map((contact) => contact.id) } },
  });

  const live = refreshed.filter(
    (contact) =>
      contact.status === "DISCOVERED" || contact.status === "SELECTED",
  );

  const primary = selectPrimaryContact(
    live.map((contact) => ({
      email: contact.email,
      normalizedEmail: contact.normalizedEmail,
      name: contact.name,
      role: contact.role,
      sourceUrl: contact.sourceUrl ?? "",
      sourceType: contact.sourceType,
      confidence: contact.confidence,
      confidenceReason: "",
    })),
  );

  if (live.length === 0) {
    const suppressed = refreshed.some((contact) => contact.status === "SUPPRESSED");
    const status = suppressed ? "SUPPRESSED" : "NO_CONTACT";

    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        outreachStatus:
          prospect.outreachStatus === "DRAFT_READY" ||
          prospect.outreachStatus === "APPROVED"
            ? prospect.outreachStatus
            : status === "SUPPRESSED"
              ? "SUPPRESSED"
              : "NO_CONTACT",
        lastContactDiscoveryAt: now,
      },
    });

    return {
      outcome: suppressed ? "SUPPRESSED" : "NO_PUBLIC_EMAIL_FOUND",
      reused: false,
      contactCount: 0,
      primaryEmail: null,
      message: suppressed
        ? "A published email was found but it is suppressed."
        : "NO_PUBLIC_EMAIL_FOUND",
    };
  }

  await prisma.$transaction([
    prisma.prospectContact.updateMany({
      where: { prospectId: prospect.id, isPrimary: true },
      data: { isPrimary: false },
    }),
    ...live.map((contact) =>
      prisma.prospectContact.update({
        where: { id: contact.id },
        data: {
          isPrimary: contact.normalizedEmail === primary?.normalizedEmail,
          status:
            contact.normalizedEmail === primary?.normalizedEmail
              ? "SELECTED"
              : "DISCOVERED",
        },
      }),
    ),
    prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        outreachStatus:
          prospect.outreachStatus === "DRAFT_READY" ||
          prospect.outreachStatus === "APPROVED"
            ? prospect.outreachStatus
            : "CONTACT_FOUND",
        lastContactDiscoveryAt: now,
      },
    }),
  ]);

  return {
    outcome: "CONTACTS_FOUND",
    reused: false,
    contactCount: live.length,
    primaryEmail: primary?.email ?? null,
    message: `Found ${live.length} public contact${live.length === 1 ? "" : "s"}.`,
  };
}

async function persistDiscoveredContacts(options: {
  prospectId: string;
  candidates: NormalizedContactCandidate[];
  now: Date;
}): Promise<void> {
  const operations: Prisma.PrismaPromise<unknown>[] = options.candidates.map(
    (candidate) =>
      prisma.prospectContact.upsert({
        where: {
          prospectId_normalizedEmail: {
            prospectId: options.prospectId,
            normalizedEmail: candidate.normalizedEmail,
          },
        },
        create: {
          prospectId: options.prospectId,
          email: candidate.email,
          normalizedEmail: candidate.normalizedEmail,
          name: candidate.name,
          role: candidate.role,
          sourceType: candidate.sourceType,
          sourceUrl: candidate.sourceUrl,
          confidence: candidate.confidence,
          status: "DISCOVERED",
          discoveredAt: options.now,
          lastVerifiedAt: options.now,
        },
        update: {
          email: candidate.email,
          name: candidate.name ?? undefined,
          role: candidate.role ?? undefined,
          sourceType: candidate.sourceType,
          sourceUrl: candidate.sourceUrl,
          confidence: candidate.confidence,
          lastVerifiedAt: options.now,
        },
      }),
  );

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  const existing = await prisma.prospectContact.findMany({
    where: { prospectId: options.prospectId },
  });

  const discovered = new Set(
    options.candidates.map((candidate) => candidate.normalizedEmail),
  );

  const stale = existing.filter(
    (contact) =>
      !discovered.has(contact.normalizedEmail) &&
      contact.status !== "REJECTED" &&
      contact.sourceType !== "MANUAL",
  );

  if (stale.length > 0) {
    await prisma.prospectContact.updateMany({
      where: {
        id: { in: stale.map((contact) => contact.id) },
      },
      data: {
        status: "STALE",
        isPrimary: false,
      },
    });
  }
}
