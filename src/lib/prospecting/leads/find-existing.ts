import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

export interface ExistingLeadMatch {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  website: string;
}

export async function findExistingLeadByHostname(
  hostname: string | null,
): Promise<ExistingLeadMatch | null> {
  if (!hostname) {
    return null;
  }

  const leads = await prisma.lead.findMany({
    where: {
      website: {
        contains: hostname,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      company: true,
      website: true,
    },
    take: 20,
  });

  for (const lead of leads) {
    const leadHostname = tryNormalizeProspectHostname(lead.website);

    if (leadHostname === hostname) {
      return lead;
    }
  }

  return null;
}
