"use server";

import { revalidatePath } from "next/cache";

import { requireInternalSession } from "@/lib/internal-auth";
import {
  GROWTH_SNAPSHOT_SOURCES,
  type GrowthSnapshotSource,
} from "@/lib/growth/snapshot";
import { createGrowthSnapshot } from "@/lib/growth/snapshot-store";

export type CreateSnapshotState = {
  success: boolean;
  message: string;
};

function isGrowthSnapshotSource(value: string): value is GrowthSnapshotSource {
  return (GROWTH_SNAPSHOT_SOURCES as readonly string[]).includes(value);
}

export async function createGrowthSnapshotAction(
  _previous: CreateSnapshotState,
  formData: FormData,
): Promise<CreateSnapshotState> {
  const session = await requireInternalSession();

  const sourceRaw = String(formData.get("source") ?? "");
  const periodStartRaw = String(formData.get("periodStart") ?? "");
  const periodEndRaw = String(formData.get("periodEnd") ?? "");
  const metricsRaw = String(formData.get("metricsJson") ?? "");

  if (!isGrowthSnapshotSource(sourceRaw)) {
    return { success: false, message: "Invalid snapshot source." };
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return { success: false, message: "Invalid period dates." };
  }

  let metrics: unknown;
  try {
    metrics = JSON.parse(metricsRaw);
  } catch {
    return { success: false, message: "metricsJson must be valid JSON." };
  }

  const result = await createGrowthSnapshot({
    periodStart,
    periodEnd,
    source: sourceRaw,
    metrics,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return { success: true, message: `Snapshot ${result.id} saved.` };
}
