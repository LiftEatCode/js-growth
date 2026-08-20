import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { googlePlaceIdVariants } from "./place-id";

export interface ProspectGeography {
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  source:
    | "prospect_record"
    | "imported_discovery"
    | "place_id"
    | "hostname"
    | "none";
}

function readCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { latitude: number; longitude: number } | null {
  if (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  ) {
    return { latitude, longitude };
  }

  return null;
}

function pickBestDiscoveryRow(
  rows: Array<{
    category: string | null;
    latitude: number | null;
    longitude: number | null;
  }>,
): { category: string | null; latitude: number | null; longitude: number | null } | null {
  if (rows.length === 0) {
    return null;
  }

  const withCoords = rows.find(
    (row) => readCoordinates(row.latitude, row.longitude) !== null,
  );

  return withCoords ?? rows[0] ?? null;
}

export async function loadProspectGeography(options: {
  prospectId: string;
  sourceRef: string | null;
  hostname: string | null;
  prospectLatitude?: number | null;
  prospectLongitude?: number | null;
}): Promise<ProspectGeography> {
  const prospectCoords = readCoordinates(
    options.prospectLatitude,
    options.prospectLongitude,
  );

  if (prospectCoords) {
    return {
      category: null,
      latitude: prospectCoords.latitude,
      longitude: prospectCoords.longitude,
      source: "prospect_record",
    };
  }

  const importedRows = await prisma.prospectDiscoveryCandidate.findMany({
    where: { importedProspectId: options.prospectId },
    orderBy: { createdAt: "desc" },
    select: {
      category: true,
      latitude: true,
      longitude: true,
    },
  });

  const imported = pickBestDiscoveryRow(importedRows);

  if (imported && readCoordinates(imported.latitude, imported.longitude)) {
    return {
      category: imported.category,
      latitude: imported.latitude,
      longitude: imported.longitude,
      source: "imported_discovery",
    };
  }

  const placeVariants = googlePlaceIdVariants(options.sourceRef);

  if (placeVariants.length > 0) {
    const byPlace = await prisma.prospectDiscoveryCandidate.findMany({
      where: {
        providerBusinessId: { in: placeVariants },
      },
      orderBy: { createdAt: "desc" },
      select: {
        category: true,
        latitude: true,
        longitude: true,
      },
    });

    const placeMatch = pickBestDiscoveryRow(byPlace);

    if (placeMatch && readCoordinates(placeMatch.latitude, placeMatch.longitude)) {
      return {
        category: placeMatch.category,
        latitude: placeMatch.latitude,
        longitude: placeMatch.longitude,
        source: "place_id",
      };
    }
  }

  if (options.hostname) {
    const byHost = await prisma.prospectDiscoveryCandidate.findMany({
      where: { hostname: options.hostname },
      orderBy: { createdAt: "desc" },
      select: {
        category: true,
        latitude: true,
        longitude: true,
      },
    });

    const hostMatch = pickBestDiscoveryRow(byHost);

    if (hostMatch && readCoordinates(hostMatch.latitude, hostMatch.longitude)) {
      return {
        category: hostMatch.category,
        latitude: hostMatch.latitude,
        longitude: hostMatch.longitude,
        source: "hostname",
      };
    }
  }

  return {
    category: imported?.category ?? null,
    latitude: null,
    longitude: null,
    source: "none",
  };
}

export function prospectGeographyWhereForPlaceId(
  sourceRef: string | null,
): Prisma.ProspectDiscoveryCandidateWhereInput | null {
  const variants = googlePlaceIdVariants(sourceRef);

  if (variants.length === 0) {
    return null;
  }

  return {
    providerBusinessId: { in: variants },
  };
}
