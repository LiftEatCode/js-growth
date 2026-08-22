"use server";

import { revalidatePath } from "next/cache";

import {
  approveAgreement,
  createAgreementForOpportunity,
  markAgreementReviewed,
  reviseAgreementForOpportunity,
  updateAgreementPresentation,
  voidAgreement,
  type AgreementPaymentTermType,
} from "@/lib/commercialization/agreement";
import { getInternalSession } from "@/lib/internal-auth";

export interface AgreementActionResult {
  success: boolean;
  message?: string;
  agreementId?: string;
}

function revalidateOpportunity(opportunityId: string) {
  revalidatePath("/reports/opportunities");
  revalidatePath(`/reports/opportunities/${opportunityId}`);
}

export async function createAgreementAction(options: {
  opportunityId: string;
  proposalId: string;
  createOverrideReason?: string;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await createAgreementForOpportunity({
    opportunityId: options.opportunityId,
    proposalId: options.proposalId,
    actorEmail: session.email,
    createOverrideReason: options.createOverrideReason,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    agreementId: result.agreementId,
    message: "Agreement created.",
  };
}

export async function reviseAgreementAction(options: {
  opportunityId: string;
  proposalId: string;
  createOverrideReason?: string;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await reviseAgreementForOpportunity({
    opportunityId: options.opportunityId,
    proposalId: options.proposalId,
    actorEmail: session.email,
    createOverrideReason: options.createOverrideReason,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    agreementId: result.agreementId,
    message: "Agreement revision created.",
  };
}

export async function updateAgreementPresentationAction(options: {
  opportunityId: string;
  agreementId: string;
  title?: string;
  engagementOverview?: string;
  clientResponsibilities?: string[];
  jsResponsibilities?: string[];
  timelineTerms?: string;
  changeRequestTerms?: string;
  thirdPartyCostTerms?: string;
  resultsDisclaimer?: string;
  acceptanceLanguage?: string;
  paymentTermType?: AgreementPaymentTermType;
  paymentCustomText?: string | null;
  depositPercent?: number;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateAgreementPresentation({
    agreementId: options.agreementId,
    actorEmail: session.email,
    title: options.title,
    engagementOverview: options.engagementOverview,
    clientResponsibilities: options.clientResponsibilities,
    jsResponsibilities: options.jsResponsibilities,
    timelineTerms: options.timelineTerms,
    changeRequestTerms: options.changeRequestTerms,
    thirdPartyCostTerms: options.thirdPartyCostTerms,
    resultsDisclaimer: options.resultsDisclaimer,
    acceptanceLanguage: options.acceptanceLanguage,
    paymentTermType: options.paymentTermType,
    paymentCustomText: options.paymentCustomText,
    depositPercent: options.depositPercent,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  revalidatePath(
    `/reports/opportunities/${options.opportunityId}/agreement/${options.agreementId}`,
  );
  return { success: true, agreementId: options.agreementId };
}

export async function markAgreementReviewedAction(options: {
  opportunityId: string;
  agreementId: string;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await markAgreementReviewed({
    agreementId: options.agreementId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return { success: true, agreementId: options.agreementId };
}

export async function approveAgreementAction(options: {
  opportunityId: string;
  agreementId: string;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await approveAgreement({
    agreementId: options.agreementId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return { success: true, agreementId: options.agreementId };
}

export async function voidAgreementAction(options: {
  opportunityId: string;
  agreementId: string;
  reason?: string;
}): Promise<AgreementActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await voidAgreement({
    agreementId: options.agreementId,
    actorEmail: session.email,
    reason: options.reason,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return { success: true, agreementId: options.agreementId };
}
