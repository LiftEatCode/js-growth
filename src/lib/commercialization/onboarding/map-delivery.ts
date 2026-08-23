import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import type { ProjectCommercialSnapshot } from "./types";

export interface MappedWorkstream {
  sourceScopeSectionId: string;
  title: string;
  capabilities: ServiceCapabilityId[];
  sortOrder: number;
  deliverables: MappedDeliverable[];
}

export interface MappedDeliverable {
  sourceScopeDeliverableId: string;
  sourceActionKey: string | null;
  title: string;
  description: string | null;
  sortOrder: number;
  /** Canonical execution key — shared across overlapping commercial presentations. */
  deliveryTaskKey: string;
}

export interface MappedDeliveryTask {
  key: string;
  title: string;
  description: string | null;
  sourceScopeDeliverableIds: string[];
  sourceWorkstreamIds: string[];
  capabilities: ServiceCapabilityId[];
}

/**
 * Map included Scope sections → workstreams + presentation deliverables,
 * and dedupe overlapping action keys into canonical delivery tasks.
 */
export function mapScopeSnapshotToDelivery(
  snapshot: ProjectCommercialSnapshot,
): {
  workstreams: MappedWorkstream[];
  deliveryTasks: MappedDeliveryTask[];
} {
  const workstreams: MappedWorkstream[] = snapshot.includedSections.map(
    (section) => ({
      sourceScopeSectionId: section.sourceScopeSectionId,
      title: section.title,
      capabilities: section.capabilities,
      sortOrder: section.sortOrder,
      deliverables: section.deliverables.map((d) => ({
        sourceScopeDeliverableId: d.sourceScopeDeliverableId,
        sourceActionKey: d.sourceActionKey,
        title: d.title,
        description: d.description,
        sortOrder: d.sortOrder,
        deliveryTaskKey: deliveryTaskKeyFor({
          sourceActionKey: d.sourceActionKey,
          sourceScopeDeliverableId: d.sourceScopeDeliverableId,
        }),
      })),
    }),
  );

  const taskMap = new Map<string, MappedDeliveryTask>();

  for (const ws of workstreams) {
    for (const d of ws.deliverables) {
      const existing = taskMap.get(d.deliveryTaskKey);
      if (!existing) {
        taskMap.set(d.deliveryTaskKey, {
          key: d.deliveryTaskKey,
          title: d.title,
          description: d.description,
          sourceScopeDeliverableIds: [d.sourceScopeDeliverableId],
          sourceWorkstreamIds: [ws.sourceScopeSectionId],
          capabilities: [...ws.capabilities],
        });
        continue;
      }
      if (!existing.sourceScopeDeliverableIds.includes(d.sourceScopeDeliverableId)) {
        existing.sourceScopeDeliverableIds.push(d.sourceScopeDeliverableId);
      }
      if (!existing.sourceWorkstreamIds.includes(ws.sourceScopeSectionId)) {
        existing.sourceWorkstreamIds.push(ws.sourceScopeSectionId);
      }
      for (const cap of ws.capabilities) {
        if (!existing.capabilities.includes(cap)) {
          existing.capabilities.push(cap);
        }
      }
    }
  }

  return {
    workstreams,
    deliveryTasks: [...taskMap.values()],
  };
}

export function deliveryTaskKeyFor(options: {
  sourceActionKey: string | null;
  sourceScopeDeliverableId: string;
}): string {
  const action = options.sourceActionKey?.trim();
  if (action) {
    return `action:${action}`;
  }
  return `deliverable:${options.sourceScopeDeliverableId}`;
}

/** Collect unique capabilities from included snapshot sections. */
export function collectSnapshotCapabilities(
  snapshot: ProjectCommercialSnapshot,
): ServiceCapabilityId[] {
  const set = new Set<ServiceCapabilityId>();
  for (const section of snapshot.includedSections) {
    for (const cap of section.capabilities) {
      set.add(cap);
    }
  }
  return [...set];
}
