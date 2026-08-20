import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { readCoordinates } from "./geography";
import { googlePlaceIdVariants } from "./place-id";

export interface ProspectGeography {
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  source:
    | "prospect_record"
    | "imported_discovery"
    | "place_id"
    | "hostname"
    | "none";
}

type DiscoveryGeoRow = {
  category: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

function pickBestDiscoveryRow(rows: DiscoveryGeoRow[]): DiscoveryGeoRow | null {
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
  const discoverySelect = {
    category: true,
    city: true,
    state: true,
    latitude: true,
    longitude: true,
  } as const;

  const importedRows = await prisma.prospectDiscoveryCandidate.findMany({
    where: { importedProspectId: options.prospectId },
    orderBy: { createdAt: "desc" },
    select: discoverySelect,
  });

  const imported = pickBestDiscoveryRow(importedRows);

  let placeMatch: DiscoveryGeoRow | null = null;
  const placeVariants = googlePlaceIdVariants(options.sourceRef);

  if (placeVariants.length > 0) {
    const byPlace = await prisma.prospectDiscoveryCandidate.findMany({
      where: {
        providerBusinessId: { in: placeVariants },
      },
      orderBy: { createdAt: "desc" },
      select: discoverySelect,
    });
    placeMatch = pickBestDiscoveryRow(byPlace);
  }

  let hostMatch: DiscoveryGeoRow | null = null;

  if (options.hostname) {
    const byHost = await prisma.prospectDiscoveryCandidate.findMany({
      where: { hostname: options.hostname },
      orderBy: { createdAt: "desc" },
      select: discoverySelect,
    });
    hostMatch = pickBestDiscoveryRow(byHost);
  }

  const discovery = imported ?? placeMatch ?? hostMatch;
  const prospectCoords = readCoordinates(
    options.prospectLatitude,
    options.prospectLongitude,
  );
  const discoveryCoords = discovery
    ? readCoordinates(discovery.latitude, discovery.longitude)
    : null;

  const latitude = prospectCoords?.latitude ?? discoveryCoords?.latitude ?? null;
  const longitude =
    prospectCoords?.longitude ?? discoveryCoords?.longitude ?? null;

  return {
    category: discovery?.category ?? null,
    latitude,
    longitude,
    city: discovery?.city ?? null,
    state: discovery?.state ?? null,
    source: prospectCoords
      ? "prospect_record"
      : imported && discoveryCoords
        ? "imported_discovery"
        : placeMatch && discoveryCoords
          ? "place_id"
          : hostMatch && discoveryCoords
            ? "hostname"
            : "none",
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
