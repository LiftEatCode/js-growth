import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { COMPETITOR_PROVIDER_GOOGLE_PLACES } from "./constants";
import type { ValidatedCompetitorCandidate } from "./types";

function humanStatus(
  status: string,
): status is "SELECTED" | "REJECTED" {
  return status === "SELECTED" || status === "REJECTED";
}

export async function persistDiscoveredCompetitors(options: {
  prospectId: string;
  candidates: ValidatedCompetitorCandidate[];
  now?: Date;
}): Promise<{
  created: number;
  updated: number;
  stale: number;
}> {
  const now = options.now ?? new Date();
  let created = 0;
  let updated = 0;

  const existing = await prisma.prospectCompetitor.findMany({
    where: { prospectId: options.prospectId },
  });

  const seenIds = new Set<string>();

  for (const candidate of options.candidates) {
    const match =
      existing.find(
        (row) =>
          row.provider === candidate.provider &&
          row.providerBusinessId === candidate.providerBusinessId,
      ) ??
      existing.find(
        (row) =>
          Boolean(row.normalizedHostname) &&
          row.normalizedHostname === candidate.normalizedHostname,
      );

    const nextStatus = humanStatus(match?.status ?? "")
      ? match!.status
      : candidate.status;

    const data = {
      competitorProspectId: candidate.competitorProspectId,
      businessName: candidate.businessName,
      website: candidate.website,
      normalizedHostname: candidate.normalizedHostname,
      formattedAddress: candidate.formattedAddress,
      city: candidate.city,
      state: candidate.state,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      primaryType: candidate.primaryType,
      normalizedVerticalsJson: candidate.normalizedVerticals,
      distanceMiles: candidate.distanceMiles,
      validationScore: candidate.validationScore,
      validationLabel: candidate.validationLabel,
      evidenceJson: candidate.evidence as unknown as Prisma.InputJsonValue,
      status: nextStatus,
      isRecommended: candidate.isRecommended,
      lastValidatedAt: now,
    };

    if (match) {
      await prisma.prospectCompetitor.update({
        where: { id: match.id },
        data,
      });
      seenIds.add(match.id);
      updated += 1;
      continue;
    }

    const createdRow = await prisma.prospectCompetitor.create({
      data: {
        prospectId: options.prospectId,
        provider: COMPETITOR_PROVIDER_GOOGLE_PLACES,
        providerBusinessId: candidate.providerBusinessId,
        discoveredAt: now,
        ...data,
      },
    });
    seenIds.add(createdRow.id);
    created += 1;
  }

  const staleRows = existing.filter(
    (row) => !seenIds.has(row.id) && !humanStatus(row.status),
  );

  if (staleRows.length > 0) {
    await prisma.prospectCompetitor.updateMany({
      where: { id: { in: staleRows.map((row) => row.id) } },
      data: {
        status: "STALE",
        isRecommended: false,
      },
    });
  }

  await prisma.prospect.update({
    where: { id: options.prospectId },
    data: { lastCompetitorDiscoveryAt: now },
  });

  return {
    created,
    updated,
    stale: staleRows.length,
  };
}

export async function loadExistingProspectIdentities(options: {
  hostnames: Array<string | null>;
  placeIds: string[];
}): Promise<
  Array<{
    id: string;
    hostname: string | null;
    sourceRef: string | null;
    businessName: string;
    city: string | null;
    state: string | null;
  }>
> {
  const hostnames = [
    ...new Set(
      options.hostnames.filter((value): value is string => Boolean(value)),
    ),
  ];
  const placeIds = [...new Set(options.placeIds.filter(Boolean))];

  if (hostnames.length === 0 && placeIds.length === 0) {
    return [];
  }

  return prisma.prospect.findMany({
    where: {
      OR: [
        hostnames.length > 0 ? { hostname: { in: hostnames } } : undefined,
        placeIds.length > 0 ? { sourceRef: { in: placeIds } } : undefined,
      ].filter(Boolean) as Prisma.ProspectWhereInput[],
    },
    select: {
      id: true,
      hostname: true,
      sourceRef: true,
      businessName: true,
      city: true,
      state: true,
    },
  });
}
