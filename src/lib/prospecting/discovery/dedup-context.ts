import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

import type { DiscoveryDedupContext } from "./types";

export async function loadDiscoveryDedupContext(options: {
  campaignId: string;
  hostnames: string[];
  placeIds: string[];
}): Promise<DiscoveryDedupContext> {
  const hostnames = [...new Set(options.hostnames.filter(Boolean))];
  const placeIds = [...new Set(options.placeIds.filter(Boolean))];

  const campaignProspects = await prisma.campaignProspect.findMany({
    where: { campaignId: options.campaignId },
    select: {
      prospect: {
        select: {
          hostname: true,
          sourceRef: true,
        },
      },
    },
  });

  const campaignProspectHostnames = new Set<string>();
  const campaignProspectPlaceIds = new Set<string>();

  for (const row of campaignProspects) {
    if (row.prospect.hostname) {
      campaignProspectHostnames.add(row.prospect.hostname);
    }
    if (row.prospect.sourceRef) {
      campaignProspectPlaceIds.add(row.prospect.sourceRef);
    }
  }

  const orFilters = [
    hostnames.length > 0 ? { hostname: { in: hostnames } } : undefined,
    placeIds.length > 0 ? { sourceRef: { in: placeIds } } : undefined,
  ].filter(Boolean) as Array<{ hostname?: { in: string[] }; sourceRef?: { in: string[] } }>;

  const [prospects, leads, suppressions] = await Promise.all([
    orFilters.length > 0
      ? prisma.prospect.findMany({
          where: { OR: orFilters },
          select: {
            id: true,
            hostname: true,
            sourceRef: true,
          },
        })
      : Promise.resolve([]),
    hostnames.length > 0
      ? prisma.lead.findMany({
          where: {
            OR: hostnames.map((hostname) => ({
              website: {
                contains: hostname,
                mode: "insensitive" as const,
              },
            })),
          },
          select: { website: true },
          take: 50,
        })
      : Promise.resolve([]),
    hostnames.length > 0
      ? prisma.suppressionEntry.findMany({
          where: {
            type: "HOSTNAME",
            value: { in: hostnames },
          },
          select: { value: true },
        })
      : Promise.resolve([]),
  ]);

  const prospectHostnames = new Map<string, string>();
  const prospectPlaceIds = new Map<string, string>();

  for (const prospect of prospects) {
    if (prospect.hostname) {
      prospectHostnames.set(prospect.hostname, prospect.id);
    }
    if (prospect.sourceRef) {
      prospectPlaceIds.set(prospect.sourceRef, prospect.id);
    }
  }

  const leadHostnames = new Set<string>();

  for (const lead of leads) {
    const hostname = tryNormalizeProspectHostname(lead.website);
    if (hostname && hostnames.includes(hostname)) {
      leadHostnames.add(hostname);
    }
  }

  return {
    campaignProspectHostnames,
    campaignProspectPlaceIds,
    prospectHostnames,
    prospectPlaceIds,
    leadHostnames,
    suppressedHostnames: new Set(suppressions.map((entry) => entry.value)),
  };
}
