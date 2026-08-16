import type { AiInterpretationContent } from "./schema";

export const IMPLEMENTATION_AREA_LABELS: Record<
  AiInterpretationContent["implementationAreas"][number]["area"],
  string
> = {
  "technical-seo": "Technical SEO",
  "service-page-seo": "Service page SEO",
  "local-seo": "Local SEO",
  conversion: "Conversion optimization",
  "content-expansion": "Content expansion",
  performance: "Performance optimization",
  trust: "Trust / authority content",
};

export const BUSINESS_IMPACT_LABELS: Record<
  AiInterpretationContent["topPriorities"][number]["expectedBusinessImpact"][number],
  string
> = {
  "search-visibility": "Search visibility",
  "lead-generation": "Lead generation",
  conversion: "Conversion",
  "local-visibility": "Local visibility",
  trust: "Trust",
  "user-experience": "User experience",
  "technical-foundation": "Technical foundation",
};

export const FREE_AI_CAPABILITY_COPY =
  "Professional includes an executive growth analysis that connects your technical, content, conversion, local, performance, and competitive findings into a prioritized strategy.";
