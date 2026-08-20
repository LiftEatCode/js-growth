export {
  COMPETITIVE_INTERPRETATION_VERSION,
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  MAX_AI_ADVANTAGES,
  MAX_AI_COMPETITORS,
  MAX_AI_FINDING_EVIDENCE_PER_ITEM,
  MAX_AI_OPPORTUNITIES,
  MAX_COMPETITIVE_INTERPRETATION_REPAIR_ATTEMPTS,
  MAX_COMPETITIVE_INTERPRETATIONS_PER_ACTION,
} from "./constants";
export { detectUnsupportedCommercialClaims } from "./claims";
export { buildCompetitiveAiInput, buildSourceKeyCatalog } from "./input";
export { fingerprintCompetitiveAiInput } from "./fingerprint";
export { generateCompetitiveInterpretation } from "./create";
export { loadLatestCompetitiveInterpretation } from "./load";
export {
  assertOpenAiStructuredOutputSchemaHasNoOptionalProperties,
  competitiveInterpretationContentSchema,
  jsonSchemaForCompetitiveInterpretation,
} from "./schema";
export { evaluateCompetitiveInterpretationStaleness } from "./staleness";
export { validateCompetitiveInterpretationContent } from "./validate";
export type {
  CompetitiveAiInput,
  CompetitiveInterpretationContent,
  CompetitiveInterpretationFailureCode,
} from "./types";
