import { createHash } from "node:crypto";

import {
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  COMPETITIVE_INTERPRETATION_VERSION,
} from "./constants";
import type { CompetitiveAiInput } from "./types";

export function fingerprintCompetitiveAiInput(options: {
  input: CompetitiveAiInput;
  model: string;
}): string {
  const payload = JSON.stringify({
    interpretationVersion: COMPETITIVE_INTERPRETATION_VERSION,
    promptVersion: COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
    model: options.model,
    input: options.input,
  });

  return createHash("sha256").update(payload).digest("hex");
}
