"use server";

import { revalidatePath } from "next/cache";

import { requireInternalSession } from "@/lib/internal-auth";
import {
  createOrLinkLeadFromContactSubmission,
  parseOperatorFollowUpDate,
  recordFollowUpActivity,
  type FollowUpSubjectKind,
} from "@/lib/follow-up";
import { prisma } from "@/lib/prisma";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type FollowUpActionResult =
  | { ok: true; id?: string; leadId?: string; deduplicated?: boolean }
  | { ok: false; error: string };

export async function recordFollowUpActivityAction(
  formData: FormData,
): Promise<FollowUpActionResult> {
  const session = await requireInternalSession();

  const subjectKind = formString(formData, "subjectKind") as FollowUpSubjectKind;
  const subjectId = formString(formData, "subjectId");
  const activityType = formString(formData, "activityType");
  const direction = formString(formData, "direction");
  const outcome = formString(formData, "outcome");
  const summary = formString(formData, "summary");
  const nextFollowUpRaw = formString(formData, "nextFollowUpAt");
  const clearFollowUp = formString(formData, "clearFollowUp") === "1";
  const idempotencyKey = formString(formData, "idempotencyKey") || null;
  const occurredAtRaw = formString(formData, "occurredAt");

  let nextFollowUpAt: Date | null | undefined;
  if (clearFollowUp) {
    nextFollowUpAt = null;
  } else if (nextFollowUpRaw) {
    nextFollowUpAt = parseOperatorFollowUpDate(nextFollowUpRaw);
    if (!nextFollowUpAt) {
      return { ok: false, error: "invalid_follow_up_date" };
    }
  }

  let occurredAt: Date | undefined;
  if (occurredAtRaw) {
    const parsed = new Date(occurredAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "invalid_occurred_at" };
    }
    occurredAt = parsed;
  }

  const result = await recordFollowUpActivity({
    subjectKind,
    subjectId,
    activityType,
    direction,
    outcome,
    summary,
    occurredAt,
    nextFollowUpAt: clearFollowUp ? null : nextFollowUpAt,
    clearFollowUp,
    createdByEmail: session.email,
    idempotencyKey,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/reports/growth/follow-up");
  revalidatePath("/reports/growth");
  revalidatePath(`/reports/leads/${subjectId}`);
  if (subjectKind === "PROSPECT") {
    revalidatePath("/reports/prospecting");
  }
  if (subjectKind === "OPPORTUNITY") {
    revalidatePath(`/reports/opportunities/${subjectId}`);
  }

  return {
    ok: true,
    id: result.id,
    deduplicated: result.deduplicated,
  };
}

export async function scheduleNurtureAction(
  formData: FormData,
): Promise<FollowUpActionResult> {
  const session = await requireInternalSession();
  const subjectKind = formString(formData, "subjectKind") as FollowUpSubjectKind;
  const subjectId = formString(formData, "subjectId");
  const daysRaw = formString(formData, "nurtureDays") || "30";
  const days = Number(daysRaw);
  if (![30, 60, 90].includes(days)) {
    return { ok: false, error: "invalid_nurture_preset" };
  }

  const target = new Date();
  target.setUTCDate(target.getUTCDate() + days);
  const yyyy = target.toISOString().slice(0, 10);
  const nextFollowUpAt = parseOperatorFollowUpDate(yyyy);
  if (!nextFollowUpAt) {
    return { ok: false, error: "invalid_follow_up_date" };
  }

  const idempotencyKey =
    formString(formData, "idempotencyKey") ||
    `nurture:${subjectKind}:${subjectId}:${yyyy}`;

  const result = await recordFollowUpActivity({
    subjectKind,
    subjectId,
    activityType: "NOTE",
    direction: "INTERNAL",
    outcome: "FOLLOW_UP_REQUIRED",
    summary: `Moved to nurture — review in ${days} days (operator-selected).`,
    nextFollowUpAt,
    createdByEmail: session.email,
    idempotencyKey,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/reports/growth/follow-up");
  revalidatePath(`/reports/leads/${subjectId}`);
  return { ok: true, id: result.id, deduplicated: result.deduplicated };
}

export async function markLeadQualifiedAction(
  formData: FormData,
): Promise<FollowUpActionResult> {
  const session = await requireInternalSession();
  const leadId = formString(formData, "leadId");
  if (!leadId) {
    return { ok: false, error: "lead_required" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true },
  });
  if (!lead) {
    return { ok: false, error: "not_found" };
  }

  if (lead.status !== "QUALIFIED") {
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: leadId },
        data: { status: "QUALIFIED", contacted: true },
      });
      await tx.leadActivity.create({
        data: {
          leadId,
          type: "STATUS_CHANGED",
          description: `Marked QUALIFIED by ${session.email}`,
          fromValue: lead.status,
          toValue: "QUALIFIED",
        },
      });
    });
  }

  // Opportunity creation remains on commercial/prospecting path (requires campaign+prospect).
  revalidatePath(`/reports/leads/${leadId}`);
  revalidatePath("/reports/growth/follow-up");
  return { ok: true, leadId };
}

export async function createLeadFromContactAction(
  formData: FormData,
): Promise<FollowUpActionResult> {
  await requireInternalSession();
  const submissionId = formString(formData, "submissionId");
  const decisionRaw = formString(formData, "decision");
  const linkExistingLeadId = formString(formData, "linkExistingLeadId") || null;

  if (decisionRaw !== "CREATE_NEW" && decisionRaw !== "LINK_EXISTING") {
    return { ok: false, error: "invalid_decision" };
  }

  const result = await createOrLinkLeadFromContactSubmission({
    submissionId,
    decision: decisionRaw,
    linkExistingLeadId,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/reports/growth/follow-up");
  revalidatePath(`/reports/leads/${result.leadId}`);
  return {
    ok: true,
    leadId: result.leadId,
    deduplicated: result.deduplicated,
  };
}
