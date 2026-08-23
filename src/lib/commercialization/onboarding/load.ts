import "server-only";

import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import {
  loadPaymentStateForOpportunity,
  loadPaymentsForAgreement,
} from "@/lib/commercialization/payments/load";
import { prisma } from "@/lib/prisma";

import {
  clientProjectStatusLabel,
  derivedOnboardingStateLabel,
  type ClientProjectStatusValue,
  type DerivedOnboardingState,
  type OnboardingItemStatusValue,
} from "./constants";
import { deriveOnboardingState } from "./derive";
import { getOnboardingEligibility } from "./eligibility";
import { parseProjectCommercialSnapshot } from "./snapshot";
import type {
  LoadedProjectSummary,
  OnboardingItemView,
  ProjectCommercialSnapshot,
} from "./types";

export async function loadOnboardingEligibilityForOpportunity(options: {
  opportunityId: string;
}) {
  const payment = await loadPaymentStateForOpportunity({
    opportunityId: options.opportunityId,
  });
  return {
    ...getOnboardingEligibility({
      agreement: payment.agreement,
      payments: payment.payments,
    }),
    paymentStateSnapshot: payment.state,
    agreement: payment.agreement,
  };
}

export async function loadProjectForOpportunity(options: {
  opportunityId: string;
}): Promise<{
  project: LoadedProjectSummary | null;
  client: { id: string; name: string } | null;
}> {
  const row = await prisma.clientProject.findUnique({
    where: { opportunityId: options.opportunityId },
    include: {
      client: { select: { id: true, name: true } },
      onboardingItems: true,
      deliveryTasks: { select: { status: true } },
    },
  });

  if (!row) {
    return { project: null, client: null };
  }

  const payments = await loadPaymentsForAgreement({
    agreementId: row.agreementId,
  });
  const agreement = await prisma.commercialAgreement.findUnique({
    where: { id: row.agreementId },
    select: {
      id: true,
      opportunityId: true,
      status: true,
      currency: true,
      paymentTermType: true,
      totalInvestmentCents: true,
      depositCents: true,
      balanceCents: true,
      paymentCustomText: true,
      snapshotJson: true,
    },
  });

  const eligibility = getOnboardingEligibility({
    agreement: agreement
      ? {
          agreementId: agreement.id,
          opportunityId: agreement.opportunityId,
          status: agreement.status,
          currency: agreement.currency,
          paymentTermType: agreement.paymentTermType as AgreementPaymentTermType,
          totalInvestmentCents: agreement.totalInvestmentCents,
          depositCents: agreement.depositCents,
          balanceCents: agreement.balanceCents,
          paymentCustomText: agreement.paymentCustomText,
          businessName: row.client.name,
        }
      : null,
    payments,
  });

  const allTasksComplete =
    row.deliveryTasks.length > 0 &&
    row.deliveryTasks.every((t) => t.status === "COMPLETED");

  const onboardingState = deriveOnboardingState({
    projectStatus: row.status as ClientProjectStatusValue,
    items: row.onboardingItems.map((i) => ({
      required: i.required,
      status: i.status,
    })),
    balanceOutstandingCents: eligibility.balanceOutstandingCents,
    allRequiredDeliveryTasksComplete: allTasksComplete,
  });

  const snapshot = parseProjectCommercialSnapshot(row.commercialSnapshotJson);

  return {
    client: row.client,
    project: {
      id: row.id,
      clientId: row.clientId,
      clientName: row.client.name,
      opportunityId: row.opportunityId,
      agreementId: row.agreementId,
      name: row.name,
      status: row.status as ClientProjectStatusValue,
      statusLabel: clientProjectStatusLabel(
        row.status as ClientProjectStatusValue,
      ),
      ownerEmail: row.ownerEmail,
      onboardingState,
      onboardingStateLabel: derivedOnboardingStateLabel(onboardingState),
      depositPaid: eligibility.depositPaid,
      balanceOutstandingCents: eligibility.balanceOutstandingCents,
      paidInFull: eligibility.paidInFull,
      finalHandoffBlockedByBalance:
        onboardingState === "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
      totalInvestmentCents:
        snapshot?.totalInvestmentCents ??
        agreement?.totalInvestmentCents ??
        0,
      depositCents: snapshot?.depositCents ?? agreement?.depositCents ?? null,
      balanceCents: snapshot?.balanceCents ?? agreement?.balanceCents ?? null,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
    },
  };
}

export async function loadClientList(): Promise<
  Array<{
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    website: string | null;
    primaryContactEmail: string | null;
    status: string;
    activeProjectCount: number;
    latestProjectStatus: string | null;
    ownerEmail: string | null;
    updatedAt: Date;
  }>
> {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        select: {
          status: true,
          ownerEmail: true,
          updatedAt: true,
        },
      },
    },
  });

  return clients.map((c) => {
    const activeStatuses = new Set(["ONBOARDING", "READY", "ACTIVE", "BLOCKED"]);
    const activeProjectCount = c.projects.filter((p) =>
      activeStatuses.has(p.status),
    ).length;
    const latest = c.projects[0] ?? null;
    return {
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      website: c.website,
      primaryContactEmail: c.primaryContactEmail,
      status: c.status,
      activeProjectCount,
      latestProjectStatus: latest?.status ?? null,
      ownerEmail: latest?.ownerEmail ?? null,
      updatedAt: c.updatedAt,
    };
  });
}

export async function loadClientDetail(options: { clientId: string }) {
  const client = await prisma.client.findUnique({
    where: { id: options.clientId },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          opportunityId: true,
          ownerEmail: true,
          createdAt: true,
          updatedAt: true,
          startedAt: true,
        },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          stage: true,
          wonAt: true,
        },
      },
    },
  });

  if (!client) {
    return null;
  }

  return {
    id: client.id,
    name: client.name,
    primaryContactName: client.primaryContactName,
    primaryContactEmail: client.primaryContactEmail,
    phone: client.phone,
    website: client.website,
    hostname: client.hostname,
    city: client.city,
    state: client.state,
    status: client.status,
    sourceProspectId: client.sourceProspectId,
    sourceOpportunityId: client.sourceOpportunityId,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    projects: client.projects.map((p) => ({
      ...p,
      statusLabel: clientProjectStatusLabel(
        p.status as ClientProjectStatusValue,
      ),
      href: `/reports/clients/${client.id}/projects/${p.id}`,
      opportunityHref: `/reports/opportunities/${p.opportunityId}`,
    })),
    opportunities: client.opportunities,
  };
}

export async function loadProjectDetail(options: {
  projectId: string;
}): Promise<{
  project: {
    id: string;
    name: string;
    status: ClientProjectStatusValue;
    statusLabel: string;
    ownerEmail: string;
    clientId: string;
    clientName: string;
    opportunityId: string;
    agreementId: string;
    scopeId: string;
    pricingId: string;
    proposalId: string;
    onboardingState: DerivedOnboardingState;
    onboardingStateLabel: string;
    depositPaid: boolean;
    balanceOutstandingCents: number;
    paidInFull: boolean;
    finalHandoffBlockedByBalance: boolean;
    depositLabel: string;
    balanceLabel: string;
    totalLabel: string;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    canStart: boolean;
    canComplete: boolean;
    commercialLinks: {
      opportunity: string;
      agreement: string;
      scope: string;
      pricing: string;
      proposal: string;
    };
  };
  snapshot: ProjectCommercialSnapshot | null;
  onboardingItems: OnboardingItemView[];
  workstreams: Array<{
    id: string;
    title: string;
    status: string;
    sortOrder: number;
    capabilities: unknown;
    deliverables: Array<{
      id: string;
      title: string;
      status: string;
      deliveryTaskId: string | null;
      sourceActionKey: string | null;
    }>;
  }>;
  deliveryTasks: Array<{
    id: string;
    key: string;
    title: string;
    description: string | null;
    status: string;
    completedAt: Date | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    actorEmail: string;
    note: string | null;
    createdAt: Date;
  }>;
} | null> {
  const row = await prisma.clientProject.findUnique({
    where: { id: options.projectId },
    include: {
      client: { select: { id: true, name: true } },
      onboardingItems: { orderBy: { sortOrder: "asc" } },
      workstreams: {
        orderBy: { sortOrder: "asc" },
        include: {
          deliverables: { orderBy: { sortOrder: "asc" } },
        },
      },
      deliveryTasks: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });

  if (!row) {
    return null;
  }

  const payments = await loadPaymentsForAgreement({
    agreementId: row.agreementId,
  });
  const agreement = await prisma.commercialAgreement.findUnique({
    where: { id: row.agreementId },
    select: {
      id: true,
      opportunityId: true,
      status: true,
      currency: true,
      paymentTermType: true,
      totalInvestmentCents: true,
      depositCents: true,
      balanceCents: true,
      paymentCustomText: true,
    },
  });

  const eligibility = getOnboardingEligibility({
    agreement: agreement
      ? {
          agreementId: agreement.id,
          opportunityId: agreement.opportunityId,
          status: agreement.status,
          currency: agreement.currency,
          paymentTermType: agreement.paymentTermType as AgreementPaymentTermType,
          totalInvestmentCents: agreement.totalInvestmentCents,
          depositCents: agreement.depositCents,
          balanceCents: agreement.balanceCents,
          paymentCustomText: agreement.paymentCustomText,
          businessName: row.client.name,
        }
      : null,
    payments,
  });

  const allTasksComplete =
    row.deliveryTasks.length === 0 ||
    row.deliveryTasks.every((t) => t.status === "COMPLETED");

  const onboardingState = deriveOnboardingState({
    projectStatus: row.status as ClientProjectStatusValue,
    items: row.onboardingItems.map((i) => ({
      required: i.required,
      status: i.status,
    })),
    balanceOutstandingCents: eligibility.balanceOutstandingCents,
    allRequiredDeliveryTasksComplete: allTasksComplete,
  });

  const snapshot = parseProjectCommercialSnapshot(row.commercialSnapshotJson);
  const depositCents = snapshot?.depositCents ?? agreement?.depositCents ?? null;
  const balanceCents = snapshot?.balanceCents ?? agreement?.balanceCents ?? null;
  const totalCents =
    snapshot?.totalInvestmentCents ?? agreement?.totalInvestmentCents ?? 0;

  const canStart =
    (row.status === "ONBOARDING" || row.status === "READY") &&
    onboardingState === "READY_FOR_KICKOFF";

  const canComplete =
    (row.status === "ACTIVE" || row.status === "BLOCKED") &&
    allTasksComplete &&
    eligibility.paidInFull;

  return {
    project: {
      id: row.id,
      name: row.name,
      status: row.status as ClientProjectStatusValue,
      statusLabel: clientProjectStatusLabel(
        row.status as ClientProjectStatusValue,
      ),
      ownerEmail: row.ownerEmail,
      clientId: row.clientId,
      clientName: row.client.name,
      opportunityId: row.opportunityId,
      agreementId: row.agreementId,
      scopeId: row.scopeId,
      pricingId: row.pricingId,
      proposalId: row.proposalId,
      onboardingState,
      onboardingStateLabel: derivedOnboardingStateLabel(onboardingState),
      depositPaid: eligibility.depositPaid,
      balanceOutstandingCents: eligibility.balanceOutstandingCents,
      paidInFull: eligibility.paidInFull,
      finalHandoffBlockedByBalance:
        onboardingState === "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
      depositLabel:
        depositCents != null
          ? eligibility.depositPaid
            ? `Deposit Paid: ${formatUsdCents(depositCents)}`
            : `Deposit Due: ${formatUsdCents(depositCents)}`
          : "—",
      balanceLabel:
        balanceCents != null && balanceCents > 0
          ? eligibility.balanceOutstandingCents > 0
            ? `Balance Due: ${formatUsdCents(balanceCents)} (before final handoff)`
            : `Balance Paid: ${formatUsdCents(balanceCents)}`
          : eligibility.paidInFull
            ? "Paid in full"
            : "—",
      totalLabel: `Investment: ${formatUsdCents(totalCents)}`,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      canStart,
      canComplete,
      commercialLinks: {
        opportunity: `/reports/opportunities/${row.opportunityId}`,
        agreement: `/reports/opportunities/${row.opportunityId}/agreement/${row.agreementId}`,
        scope: `/reports/opportunities/${row.opportunityId}/scope/${row.scopeId}`,
        pricing: `/reports/opportunities/${row.opportunityId}/pricing/${row.pricingId}`,
        proposal: `/reports/opportunities/${row.opportunityId}/proposal/${row.proposalId}`,
      },
    },
    snapshot,
    onboardingItems: row.onboardingItems.map((i) => ({
      id: i.id,
      key: i.key,
      label: i.label,
      description: i.description,
      status: i.status as OnboardingItemStatusValue,
      required: i.required,
      sortOrder: i.sortOrder,
      completedAt: i.completedAt,
      notes: i.notes,
    })),
    workstreams: row.workstreams.map((ws) => ({
      id: ws.id,
      title: ws.title,
      status: ws.status,
      sortOrder: ws.sortOrder,
      capabilities: ws.capabilitiesJson,
      deliverables: ws.deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        deliveryTaskId: d.deliveryTaskId,
        sourceActionKey: d.sourceActionKey,
      })),
    })),
    deliveryTasks: row.deliveryTasks.map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      description: t.description,
      status: t.status,
      completedAt: t.completedAt,
    })),
    activities: row.activities.map((a) => ({
      id: a.id,
      type: a.type,
      actorEmail: a.actorEmail,
      note: a.note,
      createdAt: a.createdAt,
    })),
  };
}
