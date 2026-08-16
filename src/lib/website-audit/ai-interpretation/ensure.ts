import "server-only";

import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import {
  getOpenAiApiKey,
  getOpenAiAuditModel,
  isAiConfigured,
} from "./config";
import { createOpenAiInterpretationProvider } from "./openai-provider";
import { prismaAiInterpretationStore } from "./persist";
import { ensureAiInterpretation } from "./run";
import type { AiInterpretationView } from "./types";
import type { WebsiteAuditResult } from "../types";

export async function ensureAiInterpretationForEntitledReport(options: {
  reportId: string;
  audit: WebsiteAuditResult;
}): Promise<AiInterpretationView> {
  const entitled = await reportHasProfessionalEntitlement(options.reportId);

  if (!entitled) {
    return {
      status: "hidden",
      record: null,
      attemptCount: 0,
    };
  }

  if (!isAiConfigured()) {
    console.warn("[ai] OPENAI_API_KEY is missing; Professional report will omit interpretation", {
      reportId: options.reportId,
    });
  }

  try {
    const view = await ensureAiInterpretation({
      reportId: options.reportId,
      audit: options.audit,
      entitled: true,
      store: prismaAiInterpretationStore,
      provider: createOpenAiInterpretationProvider({
        apiKey: getOpenAiApiKey(),
      }),
      configured: isAiConfigured(),
      model: getOpenAiAuditModel(),
    });

    if (view.status === "unavailable" && isAiConfigured()) {
      console.error("[ai] interpretation unavailable after entitlement", {
        reportId: options.reportId,
        version: "v1",
        model: getOpenAiAuditModel(),
        status: view.status,
        attemptCount: view.attemptCount,
      });
    }

    return view;
  } catch (error) {
    console.error("[ai] interpretation lookup failed", {
      reportId: options.reportId,
      version: "v1",
      model: getOpenAiAuditModel(),
      status: "unavailable",
      category:
        error instanceof Error ? error.name : "unknown",
    });

    return {
      status: "unavailable",
      record: null,
      attemptCount: 0,
    };
  }
}
