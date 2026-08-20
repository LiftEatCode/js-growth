import { createHash } from "node:crypto";

import {
  IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
  IMPLEMENTATION_INTERPRETATION_VERSION,
} from "./constants";
import type { ImplementationAiInput } from "./types";

export function fingerprintImplementationAiInput(options: {
  input: ImplementationAiInput;
  model: string;
}): string {
  const payload = {
    interpretationVersion: IMPLEMENTATION_INTERPRETATION_VERSION,
    promptVersion: IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
    model: options.model,
    input: options.input,
  };

  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}
