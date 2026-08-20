import "server-only";

import { prisma } from "@/lib/prisma";
import { loadQualificationBlockers } from "@/lib/prospecting/qualification/audit-prospect";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import type { Prisma } from "@/generated/prisma/client";

import { CONTACT_TTL_MS } from "./constants";
import { isReusableContactDiscovery } from "./limit";
import { selectPrimaryContactForm } from "./select-form";
import { selectPrimaryContact } from "./select";
import { createWebsiteContactDiscoveryProvider } from "./website-provider";
import type {
  ContactDiscoveryOutcomeCode,
  NormalizedContactCandidate,
  ProspectContactDiscoveryProvider,
} from "./types";
import type { NormalizedContactFormCandidate } from "./form-types";
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

function isUsableFormStatus(status: string): boolean {
  return status === "DISCOVERED" || status === "SELECTED";
}

function hasFreshUsableChannel(input: {
  contacts: Array<{ status: string; isPrimary: boolean; lastVerifiedAt: Date | null; discoveredAt: Date }>;
  forms: Array<{ status: string; isPrimary: boolean; lastVerifiedAt: Date | null; discoveredAt: Date }>;
}): { hasContact: boolean; hasForm: boolean; hasAny: boolean } {
  const usableContacts = input.contacts.filter((contact) =>
    isUsableContactStatus(contact.status),
  );
  const usableForms = input.forms.filter((form) =>
    isUsableFormStatus(form.status),
  );

  const hasContact = usableContacts.some((contact) => {
    const verifiedAt = contact.lastVerifiedAt ?? contact.discoveredAt;
    return Date.now() - verifiedAt.getTime() < CONTACT_TTL_MS;
  });
  const hasForm = usableForms.some((form) => {
    const verifiedAt = form.lastVerifiedAt ?? form.discoveredAt;
    return Date.now() - verifiedAt.getTime() < CONTACT_TTL_MS;
  });

  return {
    hasContact,
    hasForm,
    hasAny: hasContact || hasForm,
  };
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
      contactForms: true,
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
  const usableForms = prospect.contactForms.filter((form) =>
    isUsableFormStatus(form.status),
  );
  const freshChannels = hasFreshUsableChannel({
    contacts: prospect.contacts,
    forms: prospect.contactForms,
  });

  if (
    !options.force &&
    isReusableContactDiscovery({
      lastContactDiscoveryAt: prospect.lastContactDiscoveryAt,
      outreachStatus: prospect.outreachStatus,
      hasUsableContact: freshChannels.hasContact,
      hasUsableForm: freshChannels.hasForm,
    })
  ) {
    const primary =
      usableContacts.find((contact) => contact.isPrimary) ?? usableContacts[0] ?? null;

    return {
      outcome: freshChannels.hasAny
        ? "REUSED"
        : prospect.outreachStatus === "SUPPRESSED"
          ? "SUPPRESSED"
          : "NO_PUBLIC_EMAIL_FOUND",
      reused: true,
      contactCount: usableContacts.length + usableForms.length,
      primaryEmail: primary?.email ?? null,
      message: freshChannels.hasAny
        ? primary
          ? "Recently discovered contacts were reused."
          : "Recently discovered contact form was reused."
        : "A recent search already found no public outreach channel.",
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

  await persistDiscoveredContactForms({
    prospectId: prospect.id,
    forms: discovered.forms,
    now,
  });

  const stored = await prisma.prospectContact.findMany({
    where: { prospectId: prospect.id },
  });
  const storedForms = await prisma.prospectContactForm.findMany({
    where: { prospectId: prospect.id },
  });

  const suppression = await loadContactSuppressionContext({
    hostname,
    emails: stored.map((contact) => contact.normalizedEmail),
  });
  const blockers = await loadQualificationBlockers({ hostname });

  const hostnameBlocked =
    blockers.suppressed ||
    blockers.customerSuppressed ||
    blockers.existingLead;

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

  if (hostnameBlocked) {
    await prisma.prospectContactForm.updateMany({
      where: {
        prospectId: prospect.id,
        status: { in: ["DISCOVERED", "SELECTED"] },
      },
      data: {
        status: "SUPPRESSED",
        isPrimary: false,
      },
    });
  }

  const refreshed = await prisma.prospectContact.findMany({
    where: { id: { in: stored.map((contact) => contact.id) } },
  });
  const refreshedForms = await prisma.prospectContactForm.findMany({
    where: { id: { in: storedForms.map((form) => form.id) } },
  });

  const live = refreshed.filter(
    (contact) =>
      contact.status === "DISCOVERED" || contact.status === "SELECTED",
  );

  const liveForms = refreshedForms.filter(
    (form) => form.status === "DISCOVERED" || form.status === "SELECTED",
  );

  const primaryEmail = selectPrimaryContact(
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

  const primaryForm = selectPrimaryContactForm(
    liveForms.map((form) => ({
      url: form.url,
      normalizedUrl: form.normalizedUrl,
      sourcePageUrl: form.sourcePageUrl,
      formMethod: form.formMethod,
      formAction: form.formAction,
      detectedFields:
        (form.detectedFieldsJson as unknown as NormalizedContactFormCandidate["detectedFields"]) ??
        {
          hasName: false,
          hasEmail: false,
          hasPhone: false,
          hasSubject: false,
          hasMessage: false,
        },
      confidence: form.confidence,
      confidenceReason: "",
    })),
  );

  if (live.length === 0 && liveForms.length === 0) {
    const suppressed =
      refreshed.some((contact) => contact.status === "SUPPRESSED") ||
      refreshedForms.some((form) => form.status === "SUPPRESSED");
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
        ? "Published contact options were found but are suppressed."
        : "NO_PUBLIC_EMAIL_FOUND",
    };
  }

  await prisma.$transaction([
    prisma.prospectContact.updateMany({
      where: { prospectId: prospect.id, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.prospectContactForm.updateMany({
      where: { prospectId: prospect.id, isPrimary: true },
      data: { isPrimary: false },
    }),
    ...live.map((contact) =>
      prisma.prospectContact.update({
        where: { id: contact.id },
        data: {
          isPrimary:
            primaryEmail !== null &&
            contact.normalizedEmail === primaryEmail.normalizedEmail,
          status:
            primaryEmail &&
            contact.normalizedEmail === primaryEmail.normalizedEmail
              ? "SELECTED"
              : "DISCOVERED",
        },
      }),
    ),
    ...liveForms.map((form) =>
      prisma.prospectContactForm.update({
        where: { id: form.id },
        data: {
          isPrimary:
            primaryEmail === null &&
            primaryForm !== null &&
            form.normalizedUrl === primaryForm.normalizedUrl,
          status:
            !primaryEmail &&
            primaryForm &&
            form.normalizedUrl === primaryForm.normalizedUrl
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

  const channelCount = live.length + liveForms.length;
  const message =
    live.length > 0 && liveForms.length > 0
      ? `Found ${live.length} public email${live.length === 1 ? "" : "s"} and ${liveForms.length} contact form${liveForms.length === 1 ? "" : "s"}.`
      : live.length > 0
        ? `Found ${live.length} public contact${live.length === 1 ? "" : "s"}.`
        : `Found ${liveForms.length} public contact form${liveForms.length === 1 ? "" : "s"}.`;

  return {
    outcome: "CONTACTS_FOUND",
    reused: false,
    contactCount: channelCount,
    primaryEmail: primaryEmail?.email ?? null,
    message,
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

async function persistDiscoveredContactForms(options: {
  prospectId: string;
  forms: import("./form-types").NormalizedContactFormCandidate[];
  now: Date;
}): Promise<void> {
  const operations: Prisma.PrismaPromise<unknown>[] = options.forms.map(
    (form) =>
      prisma.prospectContactForm.upsert({
        where: {
          prospectId_normalizedUrl: {
            prospectId: options.prospectId,
            normalizedUrl: form.normalizedUrl,
          },
        },
        create: {
          prospectId: options.prospectId,
          url: form.url,
          normalizedUrl: form.normalizedUrl,
          sourcePageUrl: form.sourcePageUrl,
          formMethod: form.formMethod,
          formAction: form.formAction,
          detectedFieldsJson: form.detectedFields as unknown as Prisma.InputJsonValue,
          confidence: form.confidence,
          status: "DISCOVERED",
          discoveredAt: options.now,
          lastVerifiedAt: options.now,
        },
        update: {
          url: form.url,
          sourcePageUrl: form.sourcePageUrl,
          formMethod: form.formMethod,
          formAction: form.formAction,
          detectedFieldsJson: form.detectedFields as unknown as Prisma.InputJsonValue,
          confidence: form.confidence,
          lastVerifiedAt: options.now,
        },
      }),
  );

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  const existing = await prisma.prospectContactForm.findMany({
    where: { prospectId: options.prospectId },
  });

  const discovered = new Set(options.forms.map((form) => form.normalizedUrl));

  const stale = existing.filter(
    (form) => !discovered.has(form.normalizedUrl) && form.status !== "REJECTED",
  );

  if (stale.length > 0) {
    await prisma.prospectContactForm.updateMany({
      where: {
        id: { in: stale.map((form) => form.id) },
      },
      data: {
        status: "STALE",
        isPrimary: false,
      },
    });
  }
}
