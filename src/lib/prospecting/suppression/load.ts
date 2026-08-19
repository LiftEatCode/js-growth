import "server-only";

import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

export async function loadContactSuppressionContext(options: {
  hostname: string | null;
  emails: string[];
}): Promise<{
  suppressedHostnames: Set<string>;
  suppressedEmails: Set<string>;
  customerHostnames: Set<string>;
}> {
  const emails = [...new Set(options.emails.map((email) => email.toLowerCase()))];
  const hostname = options.hostname?.toLowerCase() ?? null;

  if (!hostname && emails.length === 0) {
    return {
      suppressedHostnames: new Set<string>(),
      suppressedEmails: new Set<string>(),
      customerHostnames: new Set<string>(),
    };
  }

  const hostnameFilter = hostname
    ? ({ type: "HOSTNAME" as const, value: hostname })
    : null;
  const emailFilter =
    emails.length > 0
      ? ({ type: "EMAIL" as const, value: { in: emails } })
      : null;

  const entries = await prisma.suppressionEntry.findMany({
    where: {
      OR: [hostnameFilter, emailFilter].filter(
        (clause): clause is NonNullable<typeof clause> => Boolean(clause),
      ),
    },
    select: {
      type: true,
      value: true,
      reason: true,
    },
  });

  const suppressedHostnames = new Set<string>();
  const suppressedEmails = new Set<string>();
  const customerHostnames = new Set<string>();

  for (const entry of entries) {
    const value = entry.value.toLowerCase();

    if (entry.type === "HOSTNAME") {
      suppressedHostnames.add(value);

      if (entry.reason === "CUSTOMER") {
        customerHostnames.add(value);
      }
    }

    if (entry.type === "EMAIL") {
      suppressedEmails.add(value);
    }
  }

  if (hostname) {
    const extraHost = tryNormalizeProspectHostname(hostname);

    if (extraHost && extraHost !== hostname) {
      const extra = await prisma.suppressionEntry.findMany({
        where: { type: "HOSTNAME", value: extraHost },
        select: { value: true, reason: true },
      });

      for (const entry of extra) {
        suppressedHostnames.add(entry.value.toLowerCase());

        if (entry.reason === "CUSTOMER") {
          customerHostnames.add(entry.value.toLowerCase());
        }
      }
    }
  }

  return {
    suppressedHostnames,
    suppressedEmails,
    customerHostnames,
  };
}
