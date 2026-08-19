"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import { classifyDiscoveredBusinesses, countClassifications } from "@/lib/prospecting/discovery/classify";
import { collectDiscoveryBusinesses } from "@/lib/prospecting/discovery/collect";
import {
  DISCOVERY_PROVIDER_GOOGLE_PLACES,
  MAX_DISCOVERY_CANDIDATES_PER_RUN,
  STALE_DISCOVERY_RUN_MS,
} from "@/lib/prospecting/discovery/constants";
import { loadDiscoveryDedupContext } from "@/lib/prospecting/discovery/dedup-context";
import {
  createGooglePlacesBusinessDiscoveryProvider,
  getGooglePlacesApiKey,
} from "@/lib/prospecting/discovery/google-places-provider";
import { buildImportedProspectData } from "@/lib/prospecting/discovery/import-data";
import { safeDiscoveryErrorMessage } from "@/lib/prospecting/discovery/types";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

export interface DiscoveryActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  runId?: string;
  importedCount?: number;
}

async function failRun(runId: string, message: string): Promise<void> {
  await prisma.prospectDiscoveryRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      errorMessage: message,
      completedAt: new Date(),
    },
  });
}

export async function startCampaignDiscovery(
  campaignId: string,
): Promise<DiscoveryActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to run discovery.",
    };
  }

  if (!campaignId) {
    return {
      success: false,
      message: "A campaign is required.",
    };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      locationLabel: true,
      city: true,
      state: true,
      radiusMiles: true,
      industries: true,
    },
  });

  if (!campaign) {
    return {
      success: false,
      message: "The campaign could not be found.",
    };
  }

  const locationLabel =
    campaign.locationLabel.trim() ||
    [campaign.city, campaign.state].filter(Boolean).join(", ");

  if (!locationLabel) {
    return {
      success: false,
      message: "Add a campaign location before discovering businesses.",
    };
  }

  if (campaign.industries.length === 0) {
    return {
      success: false,
      message: "Add at least one industry before discovering businesses.",
    };
  }

  if (!getGooglePlacesApiKey()) {
    return {
      success: false,
      message: "Business discovery is not configured.",
    };
  }

  const run = await prisma.$transaction(async (transaction) => {
    const staleBefore = new Date(Date.now() - STALE_DISCOVERY_RUN_MS);

    await transaction.prospectDiscoveryRun.updateMany({
      where: {
        campaignId,
        status: "RUNNING",
        startedAt: { lt: staleBefore },
      },
      data: {
        status: "FAILED",
        errorMessage: "The previous discovery run timed out.",
        completedAt: new Date(),
      },
    });

    const activeRun = await transaction.prospectDiscoveryRun.findFirst({
      where: {
        campaignId,
        status: "RUNNING",
      },
      select: { id: true },
    });

    if (activeRun) {
      return { concurrent: true as const, id: activeRun.id };
    }

    const created = await transaction.prospectDiscoveryRun.create({
      data: {
        campaignId,
        provider: DISCOVERY_PROVIDER_GOOGLE_PLACES,
        status: "RUNNING",
        requestedIndustries: campaign.industries,
        requestedLocation: locationLabel,
        radiusMiles: campaign.radiusMiles,
        requestedLimit: MAX_DISCOVERY_CANDIDATES_PER_RUN,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    return { concurrent: false as const, id: created.id };
  });

  if (run.concurrent) {
    return {
      success: false,
      message: "A discovery run is already in progress for this campaign.",
      campaignId,
      runId: run.id,
    };
  }

  try {
    const collected = await collectDiscoveryBusinesses({
      provider: createGooglePlacesBusinessDiscoveryProvider({
        apiKey: getGooglePlacesApiKey(),
      }),
      industries: campaign.industries,
      locationLabel,
      radiusMiles: campaign.radiusMiles,
      requestedLimit: MAX_DISCOVERY_CANDIDATES_PER_RUN,
    });

    const context = await loadDiscoveryDedupContext({
      campaignId,
      hostnames: collected.businesses
        .map((business) => tryNormalizeProspectHostname(business.website))
        .filter((value): value is string => Boolean(value)),
      placeIds: collected.businesses.map(
        (business) => business.providerBusinessId,
      ),
    });

    const classified = classifyDiscoveredBusinesses(
      collected.businesses,
      context,
    );
    const counts = countClassifications(classified);

    await prisma.$transaction(async (transaction) => {
      if (classified.length > 0) {
        const seenPlaceIds = new Set<string>();
        const rows = [];

        for (const candidate of classified) {
          const placeId = candidate.business.providerBusinessId;
          if (!placeId || seenPlaceIds.has(placeId)) {
            continue;
          }

          seenPlaceIds.add(placeId);
          rows.push({
            discoveryRunId: run.id,
            providerBusinessId: placeId,
            businessName: candidate.business.businessName,
            website: candidate.website,
            hostname: candidate.hostname,
            formattedAddress: candidate.business.formattedAddress,
            city: candidate.business.city,
            state: candidate.business.state,
            phone: candidate.business.phone,
            category: candidate.business.category,
            latitude: candidate.business.latitude,
            longitude: candidate.business.longitude,
            status: candidate.status,
            exclusionReason: candidate.exclusionReason,
          });
        }

        if (rows.length > 0) {
          await transaction.prospectDiscoveryCandidate.createMany({
            data: rows,
          });
        }
      }

      await transaction.prospectDiscoveryRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          providerRequestCount: collected.providerRequestCount,
          returnedCount: counts.returnedCount,
          eligibleCount: counts.eligibleCount,
          skippedDuplicateCount: counts.skippedDuplicateCount,
          skippedSuppressedCount: counts.skippedSuppressedCount,
          skippedNoWebsiteCount: counts.skippedNoWebsiteCount,
          completedAt: new Date(),
          errorMessage:
            counts.returnedCount === 0
              ? "No businesses were found for this campaign targeting."
              : counts.eligibleCount === 0
                ? "Businesses were found, but none were eligible to import."
                : null,
        },
      });
    });

    revalidatePath(`/reports/prospecting/${campaignId}`);

    return {
      success: true,
      campaignId,
      runId: run.id,
      message: "Discovery completed.",
    };
  } catch (error) {
    const message = safeDiscoveryErrorMessage(error);
    await failRun(run.id, message);
    console.error("Prospecting discovery failed:", {
      campaignId,
      runId: run.id,
      message,
    });

    return {
      success: false,
      campaignId,
      runId: run.id,
      message,
    };
  }
}

export async function importDiscoveryCandidates(
  campaignId: string,
  runId: string,
  formData: FormData,
): Promise<DiscoveryActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to import prospects.",
    };
  }

  if (!campaignId || !runId) {
    return {
      success: false,
      message: "A campaign and discovery run are required.",
    };
  }

  const selectedIds = formData
    .getAll("candidateId")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (selectedIds.length === 0) {
    return {
      success: false,
      message: "Select at least one eligible business to import.",
    };
  }

  const run = await prisma.prospectDiscoveryRun.findFirst({
    where: {
      id: runId,
      campaignId,
    },
    select: { id: true, status: true },
  });

  if (!run) {
    return {
      success: false,
      message: "The discovery run could not be found.",
    };
  }

  const candidates = await prisma.prospectDiscoveryCandidate.findMany({
    where: {
      id: { in: selectedIds },
      discoveryRunId: runId,
      status: "ELIGIBLE",
      importedProspectId: null,
    },
  });

  if (candidates.length === 0) {
    return {
      success: false,
      message: "None of the selected businesses are eligible to import.",
    };
  }

  let importedCount = 0;

  try {
    await prisma.$transaction(async (transaction) => {
      for (const candidate of candidates) {
        if (!candidate.website || !candidate.hostname) {
          continue;
        }

        const classified = {
          business: {
            provider: "GOOGLE_PLACES" as const,
            providerBusinessId: candidate.providerBusinessId,
            businessName: candidate.businessName,
            website: candidate.website,
            formattedAddress: candidate.formattedAddress,
            city: candidate.city,
            state: candidate.state,
            phone: candidate.phone,
            category: candidate.category,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
          },
          hostname: candidate.hostname,
          website: candidate.website,
          status: "ELIGIBLE" as const,
          exclusionReason: null,
        };

        const data = buildImportedProspectData(classified);

        const existing = await transaction.prospect.findFirst({
          where: {
            OR: [
              { hostname: data.hostname },
              { sourceRef: data.sourceRef },
            ],
          },
          select: { id: true },
        });

        const prospectId = existing
          ? existing.id
          : (
              await transaction.prospect.create({
                data: {
                  businessName: data.businessName,
                  website: data.website,
                  hostname: data.hostname,
                  industry: data.industry,
                  city: data.city,
                  state: data.state,
                  address: data.address,
                  phone: data.phone,
                  sourceType: "GOOGLE_PLACES",
                  sourceRef: data.sourceRef,
                  qualificationStatus: "DISCOVERED",
                  outreachStatus: "NOT_READY",
                },
                select: { id: true },
              })
            ).id;

        const membership = await transaction.campaignProspect.findUnique({
          where: {
            campaignId_prospectId: {
              campaignId,
              prospectId,
            },
          },
          select: { id: true },
        });

        if (!membership) {
          await transaction.campaignProspect.create({
            data: {
              campaignId,
              prospectId,
            },
          });
        }

        await transaction.prospectDiscoveryCandidate.update({
          where: { id: candidate.id },
          data: { importedProspectId: prospectId },
        });

        if (!existing || !membership) {
          importedCount += 1;
        }
      }

      if (importedCount > 0) {
        await transaction.prospectDiscoveryRun.update({
          where: { id: runId },
          data: {
            importedCount: { increment: importedCount },
          },
        });
      }
    });

    revalidatePath(`/reports/prospecting/${campaignId}`);
    revalidatePath(`/reports/prospecting/${campaignId}/discovery/${runId}`);

    if (importedCount === 0) {
      return {
        success: false,
        campaignId,
        runId,
        importedCount: 0,
        message:
          "Selected businesses were already prospects and were not imported again.",
      };
    }

    return {
      success: true,
      campaignId,
      runId,
      importedCount,
      message: `Imported ${importedCount} prospect${importedCount === 1 ? "" : "s"}.`,
    };
  } catch {
    console.error("Prospecting import failed:", {
      campaignId,
      runId,
    });

    return {
      success: false,
      campaignId,
      runId,
      message: "The selected businesses could not be imported.",
    };
  }
}
