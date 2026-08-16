import { createHash } from "node:crypto";

import { AI_INTERPRETATION_VERSION } from "./constants";
import type { AiAuditContext } from "./types";

export function fingerprintAiContext(context: AiAuditContext): string {
  const payload = JSON.stringify({
    version: AI_INTERPRETATION_VERSION,
    context,
  });

  return createHash("sha256").update(payload).digest("hex");
}
