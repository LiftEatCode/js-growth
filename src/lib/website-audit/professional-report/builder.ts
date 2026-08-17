import type {
    AuditCategory,
    AuditFinding,
    WebsiteAuditResult,
  } from "@/lib/website-audit/types";
  
  import {
    PROFESSIONAL_REPORT_VERSION,
    type ProfessionalReport,
    type ProfessionalReportCategoryInsight,
    type ProfessionalReportEffort,
    type ProfessionalReportHealth,
    type ProfessionalReportRoadmapItem,
    type ProfessionalReportStrategicOpportunity,
  } from "./types";
  
  function getHostname(
    website: string,
  ): string {
    try {
      return new URL(website).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return website;
    }
  }
  
  function getHealthFromScore(
    score: number,
    maxScore = 100,
  ): ProfessionalReportHealth {
    const normalized =
      maxScore > 0
        ? (score / maxScore) * 100
        : 0;
  
    if (normalized >= 90) {
      return "excellent";
    }
  
    if (normalized >= 80) {
      return "strong";
    }
  
    if (normalized >= 65) {
      return "moderate";
    }
  
    if (normalized >= 45) {
      return "weak";
    }
  
    return "critical";
  }
  
  function getHealthLabel(
    health: ProfessionalReportHealth,
  ): string {
    switch (health) {
      case "excellent":
        return "excellent";
      case "strong":
        return "strong";
      case "moderate":
        return "moderate";
      case "weak":
        return "underperforming";
      case "critical":
        return "high-risk";
    }
  }
  
  function getEffort(
    finding: AuditFinding,
  ): ProfessionalReportEffort {
    if (
      finding.difficulty === "easy" ||
      finding.estimatedFixMinutes <= 30
    ) {
      return "low";
    }
  
    if (
      finding.difficulty === "medium" ||
      finding.estimatedFixMinutes <= 120
    ) {
      return "medium";
    }
  
    return "high";
  }
  
  function getCategoryBusinessImpact(
    category: AuditCategory,
  ): string {
    switch (category) {
      case "technical":
        return "Technical weaknesses can reduce crawlability, reliability, and the overall quality signals search engines and visitors receive.";
  
      case "seo":
        return "SEO weaknesses can limit how often the business appears in search results and reduce the number of qualified prospects finding the site.";
  
      case "content":
        return "Content weaknesses can make it harder for visitors and search engines to understand services, expertise, and relevance.";

      case "cro":
        return "Conversion weaknesses can stop interested visitors from calling, requesting a quote, or otherwise becoming a lead.";
  
      case "accessibility":
        return "Accessibility weaknesses can create unnecessary friction for users and may reduce the overall usability and trustworthiness of the website.";
  
      case "local":
        return "Local SEO weaknesses can reduce visibility when nearby customers search for the services the business provides.";
  
      case "performance":
        return "Performance weaknesses can increase abandonment, reduce engagement, and weaken both search visibility and conversion potential.";
    }
  }
  
  function getCategorySummary(
    category: AuditCategory,
    health: ProfessionalReportHealth,
  ): string {
    const healthLabel =
      getHealthLabel(health);
  
    switch (category) {
      case "technical":
        return `The technical foundation is currently ${healthLabel}. This area influences how reliably the site can be crawled, understood, and used.`;
  
      case "seo":
        return `Search optimization is currently ${healthLabel}. Improvements here may strengthen organic visibility and qualified traffic potential.`;
  
      case "content":
        return `Website content is currently ${healthLabel}. This affects how clearly the business communicates its services, value, and relevance.`;

      case "cro":
        return `Conversion readiness is currently ${healthLabel}. This area influences whether visitors can understand the offer, trust the business, and take the next step.`;
  
      case "accessibility":
        return `Accessibility is currently ${healthLabel}. This area influences usability across a wider range of visitors and devices.`;
  
      case "local":
        return `Local search readiness is currently ${healthLabel}. This directly affects the site's ability to compete for nearby customers.`;
  
      case "performance":
        return `Website performance signals are currently ${healthLabel}. This category reviews observable HTML, script, image, and resource-reference risks — not measured Core Web Vitals.`;
    }
  }
  
  function getCategoryInsights(
    audit: WebsiteAuditResult,
  ): ProfessionalReportCategoryInsight[] {
    return audit.categoryScores
      .filter(
        (categoryScore) =>
          categoryScore.maxScore > 0 &&
          categoryScore.applicable !== false,
      )
      .map(
      (categoryScore) => {
        const health =
          getHealthFromScore(
            categoryScore.score,
            categoryScore.maxScore,
          );
  
        return {
          category:
            categoryScore.category,
  
          label:
            categoryScore.label,
  
          score:
            categoryScore.score,
  
          maxScore:
            categoryScore.maxScore,
  
          health,
  
          summary:
            getCategorySummary(
              categoryScore.category,
              health,
            ),
  
          businessImpact:
            getCategoryBusinessImpact(
              categoryScore.category,
            ),
        };
      },
    );
  }
  
  function getTopWeakFindings(
    audit: WebsiteAuditResult,
  ): AuditFinding[] {
    return audit.findings
      .filter(
        (finding) =>
          finding.status !== "pass",
      )
      .sort((a, b) => {
        const priorityWeight = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
  
        const businessWeight = {
          high: 3,
          medium: 2,
          low: 1,
        };
  
        const aScore =
          priorityWeight[a.priority] * 10 +
          businessWeight[
            a.businessImpact
          ] *
            5 +
          Math.max(
            a.scoreImpact,
            0,
          );
  
        const bScore =
          priorityWeight[b.priority] * 10 +
          businessWeight[
            b.businessImpact
          ] *
            5 +
          Math.max(
            b.scoreImpact,
            0,
          );
  
        return bScore - aScore;
      });
  }
  
  function getStrengths(
    audit: WebsiteAuditResult,
  ) {
    return audit.findings
      .filter(
        (finding) =>
          finding.status === "pass",
      )
      .slice(0, 5)
      .map((finding) => ({
        id: finding.id,
  
        title: finding.title,
  
        description:
          finding.description,
  
        category:
          finding.category,
      }));
  }
  
  function getWeaknesses(
    audit: WebsiteAuditResult,
  ) {
    return getTopWeakFindings(audit)
      .slice(0, 6)
      .map((finding) => ({
        id: finding.id,
  
        title: finding.title,
  
        description:
          finding.description,
  
        businessImpact:
          getCategoryBusinessImpact(
            finding.category,
          ),
  
        category:
          finding.category,
  
        priority:
          finding.priority,
      }));
  }
  
  function getQuickWins(
    audit: WebsiteAuditResult,
  ) {
    return audit.findings
      .filter(
        (finding) =>
          finding.status !== "pass" &&
          finding.quickWin,
      )
      .sort(
        (a, b) =>
          b.scoreImpact -
          a.scoreImpact,
      )
      .slice(0, 6)
      .map((finding) => ({
        id: finding.id,
  
        title: finding.title,
  
        description:
          finding.description,
  
        businessValue:
          getCategoryBusinessImpact(
            finding.category,
          ),
  
        category:
          finding.category,
  
        estimatedMinutes:
          finding.estimatedFixMinutes,
      }));
  }
  
  function getStrategicOpportunities(
    audit: WebsiteAuditResult,
  ): ProfessionalReportStrategicOpportunity[] {
    const fromInsights: ProfessionalReportStrategicOpportunity[] =
      audit.opportunity.insights.map(
        (insight) => ({
          id: insight.id,
  
          title:
            insight.title,
  
          description:
            insight.description,
  
          businessValue:
            insight.businessValue,
  
          category:
            insight.category,
  
          businessImpact:
            insight.priority ===
            "high"
              ? "high"
              : insight.priority ===
                  "medium"
                ? "medium"
                : "low",
  
          effort:
            "medium" as const,
  
          confidence:
            audit.opportunity
              .confidence,
        }),
      );
  
    if (fromInsights.length > 0) {
      return fromInsights.slice(
        0,
        6,
      );
    }
  
    return getTopWeakFindings(audit)
      .filter(
        (finding) =>
          !finding.quickWin,
      )
      .slice(0, 6)
      .map((finding) => ({
        id: finding.id,
  
        title: finding.title,
  
        description:
          finding.description,
  
        businessValue:
          getCategoryBusinessImpact(
            finding.category,
          ),
  
        category:
          finding.category,
  
        businessImpact:
          finding.businessImpact,
  
        effort:
          getEffort(finding),
  
        confidence:
          audit.opportunity
            .confidence,
      }));
  }
  
  function getRoadmapTimeframe(
    finding: AuditFinding,
  ): ProfessionalReportRoadmapItem["timeframe"] {
    if (
      finding.priority ===
        "critical" ||
      (
        finding.priority ===
          "high" &&
        finding.quickWin
      )
    ) {
      return "immediate";
    }
  
    if (
      finding.priority === "high"
    ) {
      return "30-days";
    }
  
    if (
      finding.priority ===
      "medium"
    ) {
      return "60-days";
    }
  
    return "90-days";
  }
  
  function toRoadmapItem(
    finding: AuditFinding,
  ): ProfessionalReportRoadmapItem {
    return {
      id: finding.id,
  
      title: finding.title,
  
      description:
        finding.description,
  
      businessReason:
        getCategoryBusinessImpact(
          finding.category,
        ),
  
      category:
        finding.category,
  
      timeframe:
        getRoadmapTimeframe(
          finding,
        ),
  
      priority:
        finding.priority,
    };
  }
  
  function getPriorityRoadmap(
    audit: WebsiteAuditResult,
  ) {
    const items =
      getTopWeakFindings(audit)
        .slice(0, 12)
        .map(toRoadmapItem);
  
    return {
      immediate:
        items.filter(
          (item) =>
            item.timeframe ===
            "immediate",
        ),
  
      thirtyDays:
        items.filter(
          (item) =>
            item.timeframe ===
            "30-days",
        ),
  
      sixtyDays:
        items.filter(
          (item) =>
            item.timeframe ===
            "60-days",
        ),
  
      ninetyDays:
        items.filter(
          (item) =>
            item.timeframe ===
            "90-days",
        ),
    };
  }
  
  function getExecutiveSummary(
    audit: WebsiteAuditResult,
  ) {
    const health =
      getHealthFromScore(
        audit.overallScore,
      );
  
    const topFindings =
      getTopWeakFindings(audit);
  
    const biggestRisk =
      topFindings[0];
  
    const biggestOpportunity =
      audit.opportunity
        .insights[0];
  
    return {
      headline:
        health === "excellent"
          ? "The website has a strong foundation with targeted opportunities for continued growth."
          : health === "strong"
            ? "The website is performing well overall, with several meaningful opportunities to strengthen growth."
            : health === "moderate"
              ? "The website has a workable foundation, but several issues are limiting its growth potential."
              : health === "weak"
                ? "The website has multiple high-impact weaknesses that may be limiting visibility and lead generation."
                : "The website requires significant attention to reduce risk and improve its ability to support business growth.",
  
      summary:
        `The website currently scores ${audit.overallScore}/100. ` +
        `The audit identified ${audit.summary.criticalIssues} critical issues, ` +
        `${audit.summary.highImpactFindings} high-impact findings, and ` +
        `${audit.summary.quickWins} potential quick wins. ` +
        `The strongest next step is to prioritize the issues that most directly affect search visibility, user trust, and lead generation.`,
  
      overallHealth:
        health,
  
      biggestOpportunity:
        biggestOpportunity
          ? biggestOpportunity.title
          : "Improve the highest-impact areas identified in the audit.",
  
      biggestRisk:
        biggestRisk
          ? biggestRisk.title
          : "No major risk was identified in the current audit.",
  
      recommendedFocus:
        biggestRisk
          ? `Start with ${biggestRisk.title.toLowerCase()} and then address the remaining high-impact findings in priority order.`
          : "Maintain the current foundation while continuing to improve visibility, content quality, and conversion performance.",
    };
  }
  
  function getBusinessImpact(
    audit: WebsiteAuditResult,
  ) {
    const critical =
      audit.summary.criticalIssues;
  
    const highImpact =
      audit.summary
        .highImpactFindings;
  
    const urgency =
      critical > 0
        ? "urgent"
        : highImpact >= 4
          ? "high"
          : highImpact >= 2
            ? "medium"
            : "low";
  
    return {
      headline:
        critical > 0
          ? "Several issues may be creating measurable business risk."
          : highImpact > 0
            ? "The website has meaningful opportunities to improve business performance."
            : "The website has a relatively healthy foundation with room for optimization.",
  
      summary:
        "Website performance is not only a technical concern. Search visibility, usability, local presence, and content clarity all influence how effectively the website attracts and converts prospective customers.",
  
      visibilityImpact:
        "Weak SEO, local search, content, or technical signals can reduce how often the business appears when prospective customers are actively searching for its services.",
  
      leadGenerationImpact:
        "Website friction can reduce the percentage of visitors who call, submit a form, request a quote, or take another meaningful conversion action.",
  
      trustImpact:
        "Missing or weak website signals can reduce confidence in the business before a prospective customer ever makes contact.",
  
      growthImpact:
        audit.opportunity.score >=
        70
          ? "The audit indicates substantial room for improvement. Addressing the highest-value opportunities may strengthen the website's ability to support future customer acquisition."
          : "The website still has opportunities to improve, but the current audit suggests a more targeted optimization strategy rather than a complete overhaul.",
  
      urgency,
    } as const;
  }
  
  function getOpportunitySummary(
    audit: WebsiteAuditResult,
  ) {
    const score =
      audit.opportunity.score;
  
    let headline: string;
  
    if (score >= 85) {
      headline =
        "The website shows very strong growth opportunity.";
    } else if (score >= 70) {
      headline =
        "The website has significant room for growth.";
    } else if (score >= 50) {
      headline =
        "The website has several worthwhile optimization opportunities.";
    } else {
      headline =
        "The website is relatively mature, with more targeted opportunities remaining.";
    }
  
    return {
      score,
  
      headline,
  
      summary:
        `The current opportunity score is ${score}/100. ` +
        `This reflects the amount of improvement potential identified across technical, SEO, content, local search, accessibility, and performance signals.`,
  
      confidence:
        audit.opportunity
          .confidence,
    };
  }
  
  function getClosingSummary(
    audit: WebsiteAuditResult,
  ) {
    if (
      audit.summary.criticalIssues >
      0
    ) {
      return {
        headline:
          "The highest-priority issues should be addressed before broader growth initiatives.",
  
        summary:
          "The audit identified issues that may interfere with visibility, usability, or conversion performance. Resolving those risks first creates a stronger foundation for future SEO, content, and marketing efforts.",
  
        nextStep:
          "Review the highest-priority findings with a website and growth specialist to determine the most effective implementation sequence.",
      };
    }
  
    if (
      audit.opportunity.score >=
      70
    ) {
      return {
        headline:
          "The website has a clear path to stronger growth performance.",
  
        summary:
          "The foundation is usable, but the audit shows meaningful opportunities to improve visibility, trust, and lead generation through focused optimization.",
  
        nextStep:
          "Prioritize the highest-impact opportunities and build a phased improvement plan around the areas most closely tied to business growth.",
      };
    }
  
    return {
      headline:
        "The website has a solid foundation that can be improved through targeted optimization.",
  
      summary:
        "The audit suggests that broad reconstruction is not necessarily required. A focused strategy around the remaining weaknesses may provide a better return than making changes without clear priorities.",
  
      nextStep:
        "Review the remaining opportunities and determine which improvements best align with the business's current growth goals.",
    };
  }
  
  export function buildProfessionalReport(
    audit: WebsiteAuditResult,
  ): ProfessionalReport {
    const website =
      audit.metadata.finalUrl;
  
    return {
      version:
        PROFESSIONAL_REPORT_VERSION,
  
      generatedAt:
        new Date().toISOString(),
  
      website,
  
      hostname:
        getHostname(website),
  
      overallScore:
        audit.overallScore,
  
      executiveSummary:
        getExecutiveSummary(
          audit,
        ),
  
      businessImpact:
        getBusinessImpact(
          audit,
        ),
  
      strengths:
        getStrengths(audit),
  
      weaknesses:
        getWeaknesses(audit),
  
      quickWins:
        getQuickWins(audit),
  
      strategicOpportunities:
        getStrategicOpportunities(
          audit,
        ),
  
      categoryInsights:
        getCategoryInsights(
          audit,
        ),
  
      opportunity:
        getOpportunitySummary(
          audit,
        ),
  
      priorityRoadmap:
        getPriorityRoadmap(
          audit,
        ),
  
      closingSummary:
        getClosingSummary(
          audit,
        ),
    };
  }