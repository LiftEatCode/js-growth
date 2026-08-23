import { z } from "zod";

export const contentDraftStructuredSchema = z.object({
  seoTitle: z.string().min(1).max(120).nullable(),
  metaDescription: z.string().min(1).max(320).nullable(),
  h1: z.string().min(1).max(160).nullable(),
  slugRecommendation: z.string().min(1).max(120).nullable(),
  outline: z.array(z.string().min(1).max(300)).min(1).max(20),
  bodyMarkdown: z.string().min(40).max(40000),
  cta: z.string().min(1).max(300),
  internalLinks: z.array(z.string().min(1).max(300)).max(20),
  faq: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().min(1).max(2000),
      }),
    )
    .max(12),
  distributionIdeas: z.array(z.string().min(1).max(500)).max(10),
  researchNotes: z.array(z.string().min(1).max(500)).max(15),
  claimFlags: z.array(z.string().min(1).max(200)).max(20),
  founderInputRequired: z.boolean(),
  structuredDataRecommendation: z.string().min(1).max(500).nullable(),
});

export type ContentDraftStructured = z.infer<typeof contentDraftStructuredSchema>;
