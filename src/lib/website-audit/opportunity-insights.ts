import type {
    AuditFinding,
    OpportunityInsight,
  } from "./types";
  
  export function buildOpportunityInsights(
    findings: AuditFinding[],
  ): OpportunityInsight[] {
    const insights: OpportunityInsight[] = [];
  
    const actionable = findings.filter(
      (finding) => finding.status !== "pass",
    );
  
    const hasMissingMetadata =
      actionable.some(
        (finding) =>
          finding.id.includes("title") ||
          finding.id.includes("meta"),
      );
  
    const hasLocalIssues =
      actionable.some(
        (finding) =>
          finding.category === "local",
      );
  
    const hasPerformanceIssues =
      actionable.some(
        (finding) =>
          finding.category ===
          "performance",
      );
  
    const hasContentIssues =
      actionable.some(
        (finding) =>
          finding.category ===
          "content",
      );
  
    const hasTechnicalIssues =
      actionable.some(
        (finding) =>
          finding.category ===
          "technical",
      );
  
    if (hasMissingMetadata) {
      insights.push({
        id: "metadata",
        title:
          "Increase Search Visibility",
  
        description:
          "Several important metadata elements are missing or could be improved.",
  
        businessValue:
          "Better search snippets can improve click-through rates and increase qualified organic traffic.",
  
        priority: "high",
  
        category: "seo",
  
        icon: "search",
      });
    }
  
    if (hasLocalIssues) {
      insights.push({
        id: "local",
  
        title:
          "Strengthen Local Rankings",
  
        description:
          "Local search signals are incomplete.",
  
        businessValue:
          "Improving local SEO can increase visibility in Google Maps and nearby searches.",
  
        priority: "high",
  
        category: "local",
  
        icon: "map",
      });
    }
  
  if (hasContentIssues) {
    insights.push({
      id: "content",

      title:
        "Expand High-Value Content",

      description:
        "Content quality and structure can be improved.",

      businessValue:
        "Better content helps attract more search traffic and builds customer trust.",

      priority: "medium",

      category: "content",

      icon: "content",
    });
  }

  const hasCroIssues =
    actionable.some(
      (finding) =>
        finding.category === "cro",
    );

  if (hasCroIssues) {
    insights.push({
      id: "conversion",
      title: "Make It Easier To Convert",
      description:
        "The page has conversion-path or trust gaps that can stop interested visitors from contacting the business.",
      businessValue:
        "Clearer calls to action and authentic trust evidence help more visitors take the next step.",
      priority: "high",
      category: "cro",
      icon: "conversion",
    });
  }
  
    if (hasPerformanceIssues) {
      insights.push({
        id: "performance",
  
        title:
          "Improve Website Speed",
  
        description:
          "Performance issues may reduce user engagement.",
  
        businessValue:
          "Faster websites generally improve user experience and conversion rates.",
  
        priority: "medium",
  
        category: "performance",
  
        icon: "speed",
      });
    }
  
    if (hasTechnicalIssues) {
      insights.push({
        id: "technical",
  
        title:
          "Strengthen Technical Foundation",
  
        description:
          "Technical SEO issues may be limiting search engine crawling and indexing.",
  
        businessValue:
          "A healthier technical foundation supports long-term search growth.",
  
        priority: "medium",
  
        category: "technical",
  
        icon: "technical",
      });
    }
  
    return insights;
  }