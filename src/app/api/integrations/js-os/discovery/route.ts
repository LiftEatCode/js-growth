import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const digest = (value: string) => createHash("sha256").update(value).digest();
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const secret = process.env.JS_OS_DISCOVERY_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || !timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const runId = new URL(request.url).searchParams.get("run");
  if (runId && !/^[a-z0-9_-]{1,100}$/i.test(runId)) {
    return Response.json({ error: "Invalid run" }, { status: 400, headers });
  }

  const runFields = {
    id: true,
    requestedLocation: true,
    requestedIndustries: true,
    radiusMiles: true,
    requestedLimit: true,
    returnedCount: true,
    completedAt: true,
    campaign: { select: { name: true } },
  } as const;

  const runs = await prisma.prospectDiscoveryRun.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ completedAt: "desc" }, { id: "desc" }],
    take: 30,
    select: runFields,
  });
  const selected = runId
    ? runs.find((run) => run.id === runId) ?? await prisma.prospectDiscoveryRun.findFirst({
        where: { id: runId, status: "COMPLETED" },
        select: runFields,
      })
    : runs[0];
  if (runId && !selected) {
    return Response.json({ error: "Discovery run not found" }, { status: 404, headers });
  }

  const candidates = selected ? await prisma.prospectDiscoveryCandidate.findMany({
    where: { discoveryRunId: selected.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true, providerBusinessId: true, businessName: true, category: true,
      website: true, hostname: true, formattedAddress: true, city: true, state: true,
      status: true, importedProspectId: true,
    },
  }) : [];

  const hostnames = candidates.flatMap((row) => row.hostname ? [row.hostname] : []);
  const prospectIds = candidates.flatMap((row) => row.importedProspectId ? [row.importedProspectId] : []);
  const placeIds = candidates.map((row) => row.providerBusinessId);
  const prospects = await prisma.prospect.findMany({
    where: { OR: [
      { id: { in: prospectIds } },
      { hostname: { in: hostnames } },
      { sourceType: "GOOGLE_PLACES", sourceRef: { in: placeIds } },
    ] },
    select: {
      id: true, hostname: true, sourceType: true, sourceRef: true,
      client: { select: { id: true } },
      outreachMessages: { where: { sentAt: { not: null } }, select: { id: true }, take: 1 },
      outreachOutcomes: { select: { id: true }, take: 1 },
    },
  });
  const clients = await prisma.client.findMany({
    where: { hostname: { in: hostnames } },
    select: { hostname: true },
  });
  const clientHosts = new Set(clients.map(({ hostname }) => hostname));

  return Response.json({
    runs: selected && !runs.some(({ id }) => id === selected.id) ? [selected, ...runs] : runs,
    selectedRunId: selected?.id ?? null,
    businesses: candidates.map((row) => {
      const matches = prospects.filter((prospect) =>
        prospect.id === row.importedProspectId ||
        (row.hostname !== null && row.hostname === prospect.hostname) ||
        (prospect.sourceType === "GOOGLE_PLACES" && prospect.sourceRef === row.providerBusinessId),
      );
      return {
        id: row.id,
        name: row.businessName,
        category: row.category,
        location: row.formattedAddress ?? ([row.city, row.state].filter(Boolean).join(", ") || null),
        website: row.status === "INVALID_WEBSITE" || !row.hostname ? null : row.website,
        listingUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.businessName)}&query_place_id=${encodeURIComponent(row.providerBusinessId)}`,
        status: row.status,
        existingClient: clientHosts.has(row.hostname) || matches.some(({ client }) => client !== null),
        priorOutreach: matches.some(({ outreachMessages, outreachOutcomes }) =>
          outreachMessages.length > 0 || outreachOutcomes.length > 0,
        ),
      };
    }),
  }, { headers });
}
