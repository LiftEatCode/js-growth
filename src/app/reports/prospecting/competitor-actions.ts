"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import {
  COMPETITOR_DISCOVERY_CONCURRENCY,
  MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN,
  MAX_SELECTED_COMPETITORS_PER_PROSPECT,
  STALE_COMPETITOR_DISCOVERY_RUN_MS,
} from "@/lib/competitive-intelligence/constants";
import { discoverCompetitorCandidates } from "@/lib/competitive-intelligence/discover";
import { isReusableCompetitorDiscovery } from "@/lib/competitive-intelligence/limit";
import {
  loadExistingProspectIdentities,
  persistDiscoveredCompetitors,
} from "@/lib/competitive-intelligence/persist";
import { loadProspectGeography } from "@/lib/competitive-intelligence/resolve-target-geography";
import { buildCompetitiveProfile } from "@/lib/competitive-intelligence/profile";
import { prisma } from "@/lib/prisma";
import {
  createGooglePlacesBusinessDiscoveryProvider,
  getGooglePlacesApiKey,
} from "@/lib/prospecting/discovery/google-places-provider";
import { safeDiscoveryErrorMessage } from "@/lib/prospecting/discovery/types";
import { campaignProspectEffectiveOutreachWhere } from "@/lib/prospecting/selection/outreach-selection";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

export interface CompetitorActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  runId?: string;
}

function revalidateCompetitorPages(campaignId: string, prospectId?: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);

  if (prospectId) {
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );
  }
}

async function discoverForProspect(options: {
  prospectId: string;
  campaign: {
    locationLabel: string;
    city: string | null;
    state: string | null;
    radiusMiles: number | null;
    industries: string[];
  };
  force: boolean;
}): Promise<{
  reused: boolean;
  failed: boolean;
  providerRequests: number;
  candidatesReturned: number;
  validatedCount: number;
  rejectedCount: number;
  recommendedCount: number;
  selectedCount: number;
}> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: options.prospectId },
    include: {
      competitors: {
        select: { id: true, status: true },
      },
    },
  });

  if (!prospect) {
    return {
      reused: false,
      failed: true,
      providerRequests: 0,
      candidatesReturned: 0,
      validatedCount: 0,
      rejectedCount: 0,
      recommendedCount: 0,
      selectedCount: 0,
    };
  }

  if (
    !options.force &&
    isReusableCompetitorDiscovery({
      lastCompetitorDiscoveryAt: prospect.lastCompetitorDiscoveryAt,
      hasStoredCompetitors: prospect.competitors.length > 0,
    })
  ) {
    return {
      reused: true,
      failed: false,
      providerRequests: 0,
      candidatesReturned: prospect.competitors.length,
      validatedCount: prospect.competitors.filter(
        (row) => row.status === "VALIDATED" || row.status === "SELECTED",
      ).length,
      rejectedCount: prospect.competitors.filter(
        (row) => row.status === "REJECTED",
      ).length,
      recommendedCount: 0,
      selectedCount: prospect.competitors.filter(
        (row) => row.status === "SELECTED",
      ).length,
    };
  }

  const places = await loadProspectGeography({
    prospectId: prospect.id,
    sourceRef: prospect.sourceRef,
    hostname: prospect.hostname,
    prospectLatitude: prospect.latitude,
    prospectLongitude: prospect.longitude,
  });
  const profile = buildCompetitiveProfile({
    prospectId: prospect.id,
    businessName: prospect.businessName,
    website: prospect.website,
    hostname: prospect.hostname,
    industry: prospect.industry,
    city: prospect.city,
    state: prospect.state,
    address: prospect.address,
    sourceRef: prospect.sourceRef,
    campaignLocationLabel: options.campaign.locationLabel,
    campaignCity: options.campaign.city,
    campaignState: options.campaign.state,
    campaignRadiusMiles: options.campaign.radiusMiles,
    campaignIndustries: options.campaign.industries,
    placesCategory: places.category,
    latitude: places.latitude,
    longitude: places.longitude,
    discoveryCity: places.city,
    discoveryState: places.state,
  });

  if (
    (places.latitude !== null && places.longitude !== null) ||
    profile.city ||
    profile.state
  ) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        ...(places.latitude !== null && places.longitude !== null
          ? {
              latitude: prospect.latitude ?? places.latitude,
              longitude: prospect.longitude ?? places.longitude,
            }
          : {}),
        ...(profile.city && !prospect.city ? { city: profile.city } : {}),
        ...(profile.state && !prospect.state ? { state: profile.state } : {}),
      },
    });
  }

  const discovered = await discoverCompetitorCandidates({
    profile,
    provider: createGooglePlacesBusinessDiscoveryProvider({
      apiKey: getGooglePlacesApiKey(),
    }),
  });

  const existingProspects = await loadExistingProspectIdentities({
    hostnames: discovered.candidates.map((row) => row.normalizedHostname),
    placeIds: discovered.candidates.map((row) => row.providerBusinessId),
  });

  const linked = discovered.candidates.map((candidate) => {
    const match =
      existingProspects.find(
        (row) => row.sourceRef === candidate.providerBusinessId,
      ) ??
      existingProspects.find(
        (row) =>
          row.hostname && row.hostname === candidate.normalizedHostname,
      );

    return {
      ...candidate,
      competitorProspectId: match?.id ?? candidate.competitorProspectId,
    };
  });

  await persistDiscoveredCompetitors({
    prospectId: prospect.id,
    candidates: linked,
  });

  return {
    reused: false,
    failed: false,
    providerRequests: discovered.providerRequests,
    candidatesReturned: linked.length,
    validatedCount: linked.filter((row) => row.status === "VALIDATED").length,
    rejectedCount: linked.filter((row) => row.status === "REJECTED").length,
    recommendedCount: linked.filter((row) => row.isRecommended).length,
    selectedCount: prospect.competitors.filter((row) => row.status === "SELECTED")
      .length,
  };
}

export async function startProspectCompetitorDiscovery(
  campaignId: string,
  prospectId: string,
  force = false,
): Promise<CompetitorActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to discover competitors.",
    };
  }

  if (!getGooglePlacesApiKey()) {
    return {
      success: false,
      message: "Business discovery is not configured.",
    };
  }

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    include: {
      campaign: {
        select: {
          id: true,
          locationLabel: true,
          city: true,
          state: true,
          radiusMiles: true,
          industries: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      success: false,
      message: "The prospect is not in this campaign.",
    };
  }

  const run = await prisma.competitorDiscoveryRun.create({
    data: {
      campaignId,
      prospectId,
      status: "RUNNING",
      requestedProspects: 1,
      createdByEmail: session.email,
    },
  });

  const startedAt = Date.now();

  try {
    const result = await discoverForProspect({
      prospectId,
      campaign: membership.campaign,
      force,
    });

    await prisma.competitorDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processedProspects: 1,
        providerRequests: result.providerRequests,
        candidatesReturned: result.candidatesReturned,
        validatedCount: result.validatedCount,
        rejectedCount: result.rejectedCount,
        recommendedCount: result.recommendedCount,
        selectedCount: result.selectedCount,
        reusedCount: result.reused ? 1 : 0,
        failedCount: result.failed ? 1 : 0,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    revalidateCompetitorPages(campaignId, prospectId);

    return {
      success: true,
      campaignId,
      prospectId,
      runId: run.id,
      message: result.reused
        ? "Recent competitor discovery was reused."
        : `Found ${result.candidatesReturned} competitor candidate${result.candidatesReturned === 1 ? "" : "s"}. No websites were audited.`,
    };
  } catch (error) {
    await prisma.competitorDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: safeDiscoveryErrorMessage(error),
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
        failedCount: 1,
      },
    });

    return {
      success: false,
      campaignId,
      prospectId,
      runId: run.id,
      message: safeDiscoveryErrorMessage(error),
    };
  }
}

export async function startCampaignCompetitorDiscovery(
  campaignId: string,
): Promise<CompetitorActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to discover competitors.",
    };
  }

  if (!getGooglePlacesApiKey()) {
    return {
      success: false,
      message: "Business discovery is not configured.",
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

  const staleBefore = new Date(Date.now() - STALE_COMPETITOR_DISCOVERY_RUN_MS);

  const run = await prisma.$transaction(async (transaction) => {
    await transaction.competitorDiscoveryRun.updateMany({
      where: {
        campaignId,
        prospectId: null,
        status: "RUNNING",
        startedAt: { lt: staleBefore },
      },
      data: {
        status: "FAILED",
        errorMessage: "The previous competitor discovery run timed out.",
        completedAt: new Date(),
      },
    });

    const active = await transaction.competitorDiscoveryRun.findFirst({
      where: {
        campaignId,
        prospectId: null,
        status: "RUNNING",
      },
      select: { id: true },
    });

    if (active) {
      return { concurrent: true as const, id: active.id };
    }

    const created = await transaction.competitorDiscoveryRun.create({
      data: {
        campaignId,
        status: "RUNNING",
        requestedProspects: 0,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    return { concurrent: false as const, id: created.id };
  });

  if (run.concurrent) {
    return {
      success: false,
      message: "Competitor discovery is already running for this campaign.",
      runId: run.id,
    };
  }

  const startedAt = Date.now();

  try {
    const memberships = await prisma.campaignProspect.findMany({
      where: {
        campaignId,
        ...campaignProspectEffectiveOutreachWhere(),
        prospect: {
          qualificationStatus: "QUALIFIED",
        },
      },
      select: { prospectId: true },
      orderBy: { qualificationRank: { sort: "asc", nulls: "last" } },
      take: MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN,
    });

    await prisma.competitorDiscoveryRun.update({
      where: { id: run.id },
      data: { requestedProspects: memberships.length },
    });

    if (memberships.length === 0) {
      await prisma.competitorDiscoveryRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      });

      revalidateCompetitorPages(campaignId);

      return {
        success: true,
        campaignId,
        runId: run.id,
        message: "No selected qualified prospects need competitor discovery.",
      };
    }

    const results = await runWithConcurrency(
      memberships,
      COMPETITOR_DISCOVERY_CONCURRENCY,
      async (row) =>
        discoverForProspect({
          prospectId: row.prospectId,
          campaign,
          force: false,
        }),
    );

    const totals = results.reduce(
      (acc, row) => ({
        processed: acc.processed + 1,
        providerRequests: acc.providerRequests + row.providerRequests,
        candidatesReturned: acc.candidatesReturned + row.candidatesReturned,
        validatedCount: acc.validatedCount + row.validatedCount,
        rejectedCount: acc.rejectedCount + row.rejectedCount,
        recommendedCount: acc.recommendedCount + row.recommendedCount,
        reusedCount: acc.reusedCount + (row.reused ? 1 : 0),
        failedCount: acc.failedCount + (row.failed ? 1 : 0),
      }),
      {
        processed: 0,
        providerRequests: 0,
        candidatesReturned: 0,
        validatedCount: 0,
        rejectedCount: 0,
        recommendedCount: 0,
        reusedCount: 0,
        failedCount: 0,
      },
    );

    await prisma.competitorDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processedProspects: totals.processed,
        providerRequests: totals.providerRequests,
        candidatesReturned: totals.candidatesReturned,
        validatedCount: totals.validatedCount,
        rejectedCount: totals.rejectedCount,
        recommendedCount: totals.recommendedCount,
        reusedCount: totals.reusedCount,
        failedCount: totals.failedCount,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    revalidateCompetitorPages(campaignId);

    return {
      success: true,
      campaignId,
      runId: run.id,
      message: `Checked ${totals.processed} prospect${totals.processed === 1 ? "" : "s"} (max ${MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN}). ${totals.candidatesReturned} candidates. No competitor websites were audited.`,
    };
  } catch (error) {
    await prisma.competitorDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: safeDiscoveryErrorMessage(error),
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      campaignId,
      runId: run.id,
      message: safeDiscoveryErrorMessage(error),
    };
  }
}

export async function setProspectCompetitorSelection(
  campaignId: string,
  prospectId: string,
  competitorId: string,
  selected: boolean,
): Promise<CompetitorActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to change competitor selection.",
    };
  }

  const competitor = await prisma.prospectCompetitor.findUnique({
    where: { id: competitorId },
  });

  if (!competitor || competitor.prospectId !== prospectId) {
    return {
      success: false,
      message: "The competitor could not be found.",
    };
  }

  if (selected) {
    const selectedCount = await prisma.prospectCompetitor.count({
      where: {
        prospectId,
        status: "SELECTED",
        id: { not: competitorId },
      },
    });

    if (selectedCount >= MAX_SELECTED_COMPETITORS_PER_PROSPECT) {
      return {
        success: false,
        message: `You can select at most ${MAX_SELECTED_COMPETITORS_PER_PROSPECT} competitors.`,
      };
    }

    if (competitor.validationLabel === "REJECTED") {
      return {
        success: false,
        message: "Rejected candidates cannot be selected as competitors.",
      };
    }

    await prisma.prospectCompetitor.update({
      where: { id: competitorId },
      data: { status: "SELECTED" },
    });
  } else {
    await prisma.prospectCompetitor.update({
      where: { id: competitorId },
      data: {
        status:
          competitor.validationLabel === "REJECTED" ? "REJECTED" : "VALIDATED",
      },
    });
  }

  revalidateCompetitorPages(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: selected
      ? "Competitor selected."
      : "Competitor removed from selection.",
  };
}

export async function rejectProspectCompetitor(
  campaignId: string,
  prospectId: string,
  competitorId: string,
): Promise<CompetitorActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to reject competitors.",
    };
  }

  const competitor = await prisma.prospectCompetitor.findUnique({
    where: { id: competitorId },
  });

  if (!competitor || competitor.prospectId !== prospectId) {
    return {
      success: false,
      message: "The competitor could not be found.",
    };
  }

  await prisma.prospectCompetitor.update({
    where: { id: competitorId },
    data: {
      status: "REJECTED",
      isRecommended: false,
    },
  });

  revalidateCompetitorPages(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: "Competitor rejected.",
  };
}
