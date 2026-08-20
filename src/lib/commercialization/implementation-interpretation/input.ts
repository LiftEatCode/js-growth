import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";

import {
  MAX_AI_ACTIONS_PER_WORKSTREAM,
  MAX_AI_EVIDENCE_PER_WORKSTREAM,
  MAX_AI_IMPLEMENTATION_WORKSTREAMS,
  MAX_AI_PRESERVATION_CONSTRAINTS,
} from "./constants";
import {
  actionSourceKey,
  preservationSourceKey,
  workstreamSourceKey,
} from "./source-keys";
import type {
  ImplementationAiInput,
  ImplementationAiWorkstreamInput,
} from "./types";

export {
  actionSourceKey,
  preservationSourceKey,
  workstreamSourceKey,
} from "./source-keys";

export function buildImplementationAiInput(options: {
  plan: LoadedImplementationPlan;
  businessName: string;
  location: string | null;
}): ImplementationAiInput {
  const active = options.plan.workstreams
    .filter((row) => !row.removed)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, MAX_AI_IMPLEMENTATION_WORKSTREAMS);

  const workstreams: ImplementationAiWorkstreamInput[] = active.map((row) => {
    const evidence = row.evidence
      .filter((item) => item.type !== "COMPETITIVE_ADVANTAGE")
      .slice(0, MAX_AI_EVIDENCE_PER_WORKSTREAM)
      .map((item) => ({
        sourceKey: item.sourceKey,
        type: item.type,
        title: item.title.slice(0, 200),
      }));

    const actions = row.actions
      .slice(0, MAX_AI_ACTIONS_PER_WORKSTREAM)
      .map((action) => ({
        sourceKey: actionSourceKey(row.workstreamType, action.id),
        actionId: action.id,
        text: action.label.slice(0, 240),
        evidenceSourceKeys: action.evidenceSourceKeys.slice(0, 8),
      }));

    const preservationConstraints = row.preservationConstraints
      .slice(0, MAX_AI_PRESERVATION_CONSTRAINTS)
      .map((constraint) => ({
        sourceKey: preservationSourceKey(constraint.category),
        category: constraint.category,
        message: constraint.statement.slice(0, 400),
        maintenanceActions: (constraint.maintenanceActions ?? [])
          .slice(0, 4)
          .map((action) => ({
            sourceKey: actionSourceKey(
              row.workstreamType,
              `maintenance-${action.id}`,
            ),
            text: action.label.slice(0, 240),
          })),
      }));

    return {
      sourceKey: workstreamSourceKey(row.workstreamType),
      workstreamType: row.workstreamType,
      title: row.title,
      priority: row.priority,
      capabilities: row.capabilities,
      deterministicSummary: row.summary.slice(0, 500),
      evidence,
      actions,
      preservationConstraints,
    };
  });

  const allowedSourceKeys = new Set<string>();

  for (const ws of workstreams) {
    allowedSourceKeys.add(ws.sourceKey);
    for (const evidence of ws.evidence) {
      allowedSourceKeys.add(evidence.sourceKey);
    }
    for (const action of ws.actions) {
      allowedSourceKeys.add(action.sourceKey);
    }
    for (const preservation of ws.preservationConstraints) {
      allowedSourceKeys.add(preservation.sourceKey);
      for (const maintenance of preservation.maintenanceActions) {
        allowedSourceKeys.add(maintenance.sourceKey);
      }
    }
  }

  return {
    business: {
      name: options.businessName.slice(0, 160),
      location: options.location ? options.location.slice(0, 160) : null,
    },
    plan: {
      planId: options.plan.id,
      status: options.plan.status,
      generatedAt: options.plan.createdAt.toISOString(),
      planVersion: options.plan.planVersion,
      mappingVersion: options.plan.mappingVersion,
    },
    workstreams,
    allowedSourceKeys: Array.from(allowedSourceKeys).sort(),
  };
}
