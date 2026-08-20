import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  getOpenAiApiKey,
  getOpenAiAuditModel,
} from "@/lib/website-audit/ai-interpretation/config";
import {
  InvalidAiOutputError,
  withTimeout,
} from "@/lib/website-audit/ai-interpretation/errors";
import {
  MissingOpenAiKeyError,
  OpenAiProviderError,
  OpenAiTimeoutError,
} from "@/lib/website-audit/ai-interpretation/openai-provider";
import { COMPETITIVE_COMPARISON_VERSION } from "@/lib/competitive-intelligence/comparison/constants";
import { prisma } from "@/lib/prisma";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";

import {
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  COMPETITIVE_INTERPRETATION_TIMEOUT_MS,
  COMPETITIVE_INTERPRETATION_VERSION,
  MAX_COMPETITIVE_INTERPRETATIONS_PER_ACTION,
} from "./constants";
import { fingerprintCompetitiveAiInput } from "./fingerprint";
import { buildCompetitiveAiInput } from "./input";
import {
  COMPETITIVE_INTERPRETATION_SYSTEM_PROMPT,
  buildCompetitiveInterpretationUserPrompt,
} from "./prompt";
import {
  createOpenAiCompetitiveInterpretationProvider,
  type CompetitiveInterpretationProvider,
} from "./openai-provider";
import { competitiveInterpretationContentSchema } from "./schema";
import type { CompetitiveInterpretationFailureCode } from "./types";
import { validateCompetitiveInterpretationContent } from "./validate";

function boundFailureMessage(message: string): string {
  return message.slice(0, 280);
}

function mapFailure(error: unknown): {
  code: CompetitiveInterpretationFailureCode;
  message: string;
} {
  if (error instanceof MissingOpenAiKeyError) {
    return { code: "NOT_CONFIGURED", message: "OpenAI is not configured." };
  }

  if (error instanceof OpenAiTimeoutError) {
    return { code: "TIMEOUT", message: "Interpretation timed out." };
  }

  if (error instanceof InvalidAiOutputError) {
    return {
      code: "INVALID_OUTPUT",
      message: boundFailureMessage(error.reason),
    };
  }

  if (error instanceof OpenAiProviderError) {
    if (error.category === "invalid-output") {
      return {
        code: "INVALID_OUTPUT",
        message: boundFailureMessage(error.message),
      };
    }

    return {
      code: "MODEL_ERROR",
      message: boundFailureMessage(error.message),
    };
  }

  return {
    code: "MODEL_ERROR",
    message: boundFailureMessage(
      error instanceof Error ? error.message : "Unknown interpretation error.",
    ),
  };
}

export type GenerateCompetitiveInterpretationResult =
  | {
      ok: true;
      interpretationId: string;
      reused: boolean;
      comparisonSnapshotId: string;
    }
  | {
      ok: false;
      code: CompetitiveInterpretationFailureCode;
      message: string;
      interpretationId?: string;
    };

export async function generateCompetitiveInterpretation(options: {
  campaignId: string;
  prospectId: string;
  comparisonSnapshotId?: string;
  createdByEmail: string;
  force?: boolean;
  provider?: CompetitiveInterpretationProvider;
}): Promise<GenerateCompetitiveInterpretationResult> {
  if (MAX_COMPETITIVE_INTERPRETATIONS_PER_ACTION !== 1) {
    return {
      ok: false,
      code: "MODEL_ERROR",
      message: "Interpretation concurrency misconfigured.",
    };
  }

  const snapshot = options.comparisonSnapshotId
    ? await prisma.competitiveComparisonSnapshot.findFirst({
        where: {
          id: options.comparisonSnapshotId,
          campaignId: options.campaignId,
          prospectId: options.prospectId,
        },
      })
    : await prisma.competitiveComparisonSnapshot.findFirst({
        where: {
          campaignId: options.campaignId,
          prospectId: options.prospectId,
        },
        orderBy: { createdAt: "desc" },
      });

  if (!snapshot) {
    return {
      ok: false,
      code: "MISSING_COMPARISON",
      message:
        "Generate a competitive comparison before requesting AI interpretation.",
    };
  }

  if (snapshot.comparisonVersion !== COMPETITIVE_COMPARISON_VERSION) {
    return {
      ok: false,
      code: "UNSUPPORTED_COMPARISON_VERSION",
      message: `Unsupported comparison version ${snapshot.comparisonVersion}.`,
    };
  }

  const comparison = snapshot.comparisonJson as unknown as CompetitiveComparison;
  const prospect = await prisma.prospect.findUnique({
    where: { id: options.prospectId },
    select: { businessName: true },
  });

  if (!prospect) {
    return {
      ok: false,
      code: "MISSING_COMPARISON",
      message: "Prospect not found.",
    };
  }

  const model = getOpenAiAuditModel();
  const aiInput = buildCompetitiveAiInput({
    comparison,
    comparisonSnapshotId: snapshot.id,
    targetBusinessName: prospect.businessName,
  });
  const inputFingerprint = fingerprintCompetitiveAiInput({
    input: aiInput,
    model,
  });

  if (!options.force) {
    const reusable = await prisma.competitiveInterpretation.findFirst({
      where: {
        comparisonSnapshotId: snapshot.id,
        status: "COMPLETED",
        interpretationVersion: COMPETITIVE_INTERPRETATION_VERSION,
        promptVersion: COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
        model,
        inputFingerprint,
      },
      orderBy: { createdAt: "desc" },
    });

    if (reusable) {
      return {
        ok: true,
        interpretationId: reusable.id,
        reused: true,
        comparisonSnapshotId: snapshot.id,
      };
    }
  }

  const row = await prisma.competitiveInterpretation.create({
    data: {
      prospectId: options.prospectId,
      campaignId: options.campaignId,
      comparisonSnapshotId: snapshot.id,
      status: "RUNNING",
      model,
      promptVersion: COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
      interpretationVersion: COMPETITIVE_INTERPRETATION_VERSION,
      comparisonVersion: snapshot.comparisonVersion,
      auditEngineVersion: snapshot.auditEngineVersion,
      inputFingerprint,
      startedAt: new Date(),
      createdByEmail: options.createdByEmail,
    },
  });

  const provider =
    options.provider ??
    createOpenAiCompetitiveInterpretationProvider({
      apiKey: getOpenAiApiKey(),
    });

  try {
    const providerResult = await withTimeout(
      provider.generate({
        model,
        system: COMPETITIVE_INTERPRETATION_SYSTEM_PROMPT,
        user: buildCompetitiveInterpretationUserPrompt(
          JSON.stringify(aiInput),
        ),
        timeoutMs: COMPETITIVE_INTERPRETATION_TIMEOUT_MS,
      }),
      COMPETITIVE_INTERPRETATION_TIMEOUT_MS,
    );

    const parsed = competitiveInterpretationContentSchema.safeParse(
      providerResult.parsed,
    );

    if (!parsed.success) {
      throw new InvalidAiOutputError(
        parsed.error.issues[0]?.message ?? "schema-mismatch",
      );
    }

    const validated = validateCompetitiveInterpretationContent(
      parsed.data,
      aiInput,
    );

    if (!validated.ok) {
      throw new InvalidAiOutputError(validated.reason);
    }

    await prisma.competitiveInterpretation.update({
      where: { id: row.id },
      data: {
        status: "COMPLETED",
        model: providerResult.model || model,
        interpretationJson: validated.content as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
        failureCode: null,
        failureMessage: null,
        failedAt: null,
      },
    });

    return {
      ok: true,
      interpretationId: row.id,
      reused: false,
      comparisonSnapshotId: snapshot.id,
    };
  } catch (error) {
    const failure = mapFailure(error);

    await prisma.competitiveInterpretation.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureCode: failure.code,
        failureMessage: failure.message,
      },
    });

    return {
      ok: false,
      code: failure.code,
      message: failure.message,
      interpretationId: row.id,
    };
  }
}
