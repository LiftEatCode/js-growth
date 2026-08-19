import { z } from "zod";

import {
  MAX_OUTREACH_BODY_CHARS,
  MAX_OUTREACH_SUBJECT_CHARS,
  MIN_OUTREACH_BODY_CHARS,
  MIN_OUTREACH_SUBJECT_CHARS,
} from "./constants";

export const outreachDraftOutputSchema = z.object({
  subject: z
    .string()
    .min(MIN_OUTREACH_SUBJECT_CHARS)
    .max(MAX_OUTREACH_SUBJECT_CHARS),
  body: z.string().min(MIN_OUTREACH_BODY_CHARS).max(MAX_OUTREACH_BODY_CHARS),
});
