import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "./hostname";

export async function findDuplicateHostnames(
  hostnames: string[],
): Promise<Set<string>> {
  const unique = [...new Set(hostnames.filter(Boolean))];

  if (unique.length === 0) {
    return new Set();
  }

  const [groupedProspects, leads, suppressions] = await Promise.all([
    prisma.prospect.groupBy({
      by: ["hostname"],
      where: {
        hostname: {
          in: unique,
        },
      },
      _count: {
        hostname: true,
      },
    }),
    prisma.lead.findMany({
      where: {
        OR: unique.map((hostname) => ({
          website: {
            contains: hostname,
            mode: "insensitive" as const,
          },
        })),
      },
      select: { website: true },
      take: 50,
    }),
    prisma.suppressionEntry.findMany({
      where: {
        type: "HOSTNAME",
        value: { in: unique },
      },
      select: { value: true },
    }),
  ]);

  const duplicates = new Set<string>();

  for (const group of groupedProspects) {
    if (group.hostname && group._count.hostname > 1) {
      duplicates.add(group.hostname);
    }
  }

  for (const lead of leads) {
    const hostname = tryNormalizeProspectHostname(lead.website);
    if (hostname && unique.includes(hostname)) {
      duplicates.add(hostname);
    }
  }

  for (const entry of suppressions) {
    duplicates.add(entry.value);
  }

  return duplicates;
}
