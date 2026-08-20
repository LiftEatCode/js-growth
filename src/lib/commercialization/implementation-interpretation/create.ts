import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "@/lib/commercialization/implementation-plan/constants";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
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
import { prisma } from "@/lib/prisma";

import {
  IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
  IMPLEMENTATION_INTERPRETATION_TIMEOUT_MS,
  IMPLEMENTATION_INTERPRETATION_VERSION,
  MAX_IMPLEMENTATION_INTERPRETATION_REPAIR_ATTEMPTS,
  MAX_IMPLEMENTATION_INTERPRETATIONS_PER_ACTION,
} from "./constants";
import { fingerprintImplementationAiInput } from "./fingerprint";
import { buildImplementationAiInput } from "./input";
import {
  createOpenAiImplementationInterpretationProvider,
  type ImplementationInterpretationProvider,
} from "./openai-provider";
import {
  IMPLEMENTATION_INTERPRETATION_SYSTEM_PROMPT,
  buildImplementationInterpretationRepairPrompt,
  buildImplementationInterpretationUserPrompt,
} from "./prompt";
import { implementationInterpretationContentSchema } from "./schema";
import type { ImplementationInterpretationFailureCode } from "./types";
import {
  validateImplementationInterpretationContent,
  type ImplementationInterpretationValidationResult,
} from "./validate";

function boundFailureMessage(message: string): string {
  return message.slice(0, 280);
}

class ImplementationInterpretationValidationError extends Error {
  readonly failureCode: ImplementationInterpretationFailureCode =
    "VALIDATION_FAILED";
  readonly rule: string;
  readonly section: string;
  readonly excerpt: string;

  constructor(options: {
    message: string;
    rule: string;
    section: string;
    excerpt: string;
  }) {
    super(options.message);
    this.name = "ImplementationInterpretationValidationError";
    this.rule = options.rule;
    this.section = options.section;
    this.excerpt = options.excerpt;
  }
}

function mapFailure(error: unknown): {
  code: ImplementationInterpretationFailureCode;
  message: string;
} {
  if (error instanceof MissingOpenAiKeyError) {
    return { code: "NOT_CONFIGURED", message: "OpenAI is not configured." };
  }

  if (error instanceof OpenAiTimeoutError) {
    return { code: "TIMEOUT", message: "Interpretation timed out." };
  }

  if (error instanceof ImplementationInterpretationValidationError) {
    const detail = error.rule ? ` [${error.rule}]` : "";
    return {
      code: "VALIDATION_FAILED",
      message: boundFailureMessage(`${error.message}${detail}`),
    };
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

function toValidationError(
  result: Extract<ImplementationInterpretationValidationResult, { ok: false }>,
): ImplementationInterpretationValidationError {
  return new ImplementationInterpretationValidationError({
    message: result.reason,
    rule: result.rule,
    section: result.section,
    excerpt: result.excerpt,
  });
}

export type GenerateImplementationInterpretationResult =
  | {
      ok: true;
      interpretationId: string;
      reused: boolean;
      implementationPlanId: string;
      openAiCalls?: number;
    }
  | {
      ok: false;
      code: ImplementationInterpretationFailureCode;
      message: string;
      interpretationId?: string;
      openAiCalls?: number;
    };

export async function generateImplementationInterpretation(options: {
  campaignId: string;
  prospectId: string;
  implementationPlanId?: string;
  createdByEmail: string;
  force?: boolean;
  provider?: ImplementationInterpretationProvider;
}): Promise<GenerateImplementationInterpretationResult> {
  if (MAX_IMPLEMENTATION_INTERPRETATIONS_PER_ACTION !== 1) {
    return {
      ok: false,
      code: "MODEL_ERROR",
      message: "Interpretation concurrency misconfigured.",
    };
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
  });

  if (!planLoad.plan) {
    return {
      ok: false,
      code: "MISSING_PLAN",
      message:
        "Generate an Implementation Plan before requesting an AI strategy.",
    };
  }

  const plan = planLoad.plan;

  if (
    options.implementationPlanId &&
    options.implementationPlanId !== plan.id
  ) {
    return {
      ok: false,
      code: "STALE_PLAN",
      message:
        "That Implementation Plan is no longer current. Use the latest plan.",
    };
  }

  if (plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "SUPERSEDED_PLAN",
      message: "This Implementation Plan was superseded. Rebuild the plan first.",
    };
  }

  if (plan.planVersion !== IMPLEMENTATION_PLAN_VERSION) {
    return {
      ok: false,
      code: "UNSUPPORTED_PLAN_VERSION",
      message: `Unsupported plan version ${plan.planVersion}.`,
    };
  }

  if (plan.mappingVersion !== IMPLEMENTATION_MAPPING_VERSION) {
    return {
      ok: false,
      code: "UNSUPPORTED_MAPPING_VERSION",
      message: `Unsupported mapping version ${plan.mappingVersion}. Rebuild the Implementation Plan.`,
    };
  }

  if (planLoad.stale) {
    return {
      ok: false,
      code: "STALE_PLAN",
      message:
        "The Implementation Plan is stale. Rebuild it before generating an AI strategy.",
    };
  }

  const activeWorkstreams = plan.workstreams.filter((row) => !row.removed);
  if (activeWorkstreams.length === 0) {
    return {
      ok: false,
      code: "MISSING_PLAN",
      message: "The Implementation Plan has no active workstreams.",
    };
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: options.prospectId },
    select: {
      businessName: true,
      city: true,
      state: true,
      leadId: true,
    },
  });

  if (!prospect) {
    return {
      ok: false,
      code: "MISSING_PLAN",
      message: "Prospect not found.",
    };
  }

  const location =
    [prospect.city, prospect.state].filter(Boolean).join(", ") || null;
  const model = getOpenAiAuditModel();
  const aiInput = buildImplementationAiInput({
    plan,
    businessName: prospect.businessName,
    location,
  });
  const inputFingerprint = fingerprintImplementationAiInput({
    input: aiInput,
    model,
  });
  const inputJson = JSON.stringify(aiInput);

  if (!options.force) {
    const reusable = await prisma.implementationPlanInterpretation.findFirst({
      where: {
        implementationPlanId: plan.id,
        status: "COMPLETED",
        interpretationVersion: IMPLEMENTATION_INTERPRETATION_VERSION,
        promptVersion: IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
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
        implementationPlanId: plan.id,
        openAiCalls: 0,
      };
    }
  }

  const row = await prisma.implementationPlanInterpretation.create({
    data: {
      implementationPlanId: plan.id,
      prospectId: options.prospectId,
      campaignId: options.campaignId,
      leadId: prospect.leadId,
      status: "RUNNING",
      model,
      promptVersion: IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
      interpretationVersion: IMPLEMENTATION_INTERPRETATION_VERSION,
      planVersion: plan.planVersion,
      mappingVersion: plan.mappingVersion,
      inputFingerprint,
      startedAt: new Date(),
      createdByEmail: options.createdByEmail,
    },
  });

  const provider =
    options.provider ??
    createOpenAiImplementationInterpretationProvider({
      apiKey: getOpenAiApiKey(),
    });

  let openAiCalls = 0;

  try {
    const providerResult = await withTimeout(
      provider.generate({
        model,
        system: IMPLEMENTATION_INTERPRETATION_SYSTEM_PROMPT,
        user: buildImplementationInterpretationUserPrompt(inputJson),
        timeoutMs: IMPLEMENTATION_INTERPRETATION_TIMEOUT_MS,
      }),
      IMPLEMENTATION_INTERPRETATION_TIMEOUT_MS,
    );
    openAiCalls += 1;

    let parsed = implementationInterpretationContentSchema.safeParse(
      providerResult.parsed,
    );

    if (!parsed.success) {
      throw new InvalidAiOutputError(
        parsed.error.issues.map((issue) => issue.message).join("; "),
      );
    }

    let validation = validateImplementationInterpretationContent(
      parsed.data,
      aiInput,
    );

    if (!validation.ok) {
      console.warn("[implementation-interpretation] validation failed", {
        interpretationId: row.id,
        implementationPlanId: plan.id,
        attempt: "initial",
        rule: validation.rule,
        section: validation.section,
      });

      if (MAX_IMPLEMENTATION_INTERPRETATION_REPAIR_ATTEMPTS >= 1) {
        const repairResult = await withTimeout(
          provider.generate({
            model,
            system: IMPLEMENTATION_INTERPRETATION_SYSTEM_PROMPT,
            user: buildImplementationInterpretationRepairPrompt({
              inputJson,
              invalidOutputJson: JSON.stringify(parsed.data),
              validationErrors: `${validation.rule}: ${validation.reason}`,
            }),
            timeoutMs: IMPLEMENTATION_INTERPRETATION_TIMEOUT_MS,
          }),
          IMPLEMENTATION_INTERPRETATION_TIMEOUT_MS,
        );
        openAiCalls += 1;

        parsed = implementationInterpretationContentSchema.safeParse(
          repairResult.parsed,
        );

        if (!parsed.success) {
          throw new InvalidAiOutputError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
          );
        }

        validation = validateImplementationInterpretationContent(
          parsed.data,
          aiInput,
        );

        if (!validation.ok) {
          console.warn("[implementation-interpretation] validation failed", {
            interpretationId: row.id,
            implementationPlanId: plan.id,
            attempt: "repair",
            rule: validation.rule,
            section: validation.section,
          });
          throw toValidationError(validation);
        }
      } else {
        throw toValidationError(validation);
      }
    }

    await prisma.implementationPlanInterpretation.update({
      where: { id: row.id },
      data: {
        status: "COMPLETED",
        model: providerResult.model,
        interpretationJson: parsed.data as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return {
      ok: true,
      interpretationId: row.id,
      reused: false,
      implementationPlanId: plan.id,
      openAiCalls,
    };
  } catch (error) {
    const failure = mapFailure(error);

    await prisma.implementationPlanInterpretation.update({
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
      openAiCalls,
    };
  }
}
