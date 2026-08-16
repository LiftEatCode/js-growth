import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const robotsIndexabilityRule: AuditRule =
    {
      id:
        "robots-indexability",
  
      category:
        "technical",
  
      title:
        "Search indexability",
  
      evaluate({
        pageData,
      }) {
        const {
          robots,
        } =
          pageData;
  
        if (
          robots.noindex
        ) {
          return createFinding({
            id:
              "robots-noindex",
  
            title:
              "Page is blocked from search indexing",
  
            description:
              robots.raw
                ? `The page declares the robots directive "${robots.raw}", which instructs search engines not to index this page.`
                : "The page instructs search engines not to index it.",
  
            status:
              "fail",
  
            category:
              "technical",
  
            scoreImpact:
              12,
  
            priority:
              "critical",
  
            businessImpact:
              "high",
  
            difficulty:
              "easy",
  
            estimatedFixMinutes:
              15,
  
            quickWin:
              true,
  
            recommendation:
              "Confirm whether the noindex directive is intentional. If this page should appear in search results, remove the noindex directive and verify that no other indexing controls block the page.",
          });
        }
  
        if (
          robots.nofollow
        ) {
          return createFinding({
            id:
              "robots-nofollow",
  
            title:
              "Page tells search engines not to follow links",
  
            description:
              robots.raw
                ? `The page declares the robots directive "${robots.raw}", which can prevent search engines from following links found on the page.`
                : "The page instructs search engines not to follow links.",
  
            status:
              "warning",
  
            category:
              "technical",
  
            scoreImpact:
              6,
  
            priority:
              "high",
  
            businessImpact:
              "medium",
  
            difficulty:
              "easy",
  
            estimatedFixMinutes:
              15,
  
            quickWin:
              true,
  
            recommendation:
              "Confirm that the nofollow directive is intentional. For normal public marketing pages, allowing crawlers to follow internal links generally helps search engines discover and understand the site.",
          });
        }
  
        if (
          robots.nosnippet
        ) {
          return createFinding({
            id:
              "robots-nosnippet",
  
            title:
              "Search snippets are restricted",
  
            description:
              "The page includes a nosnippet robots directive, which can prevent search engines from showing descriptive text or rich result snippets for this page.",
  
            status:
              "warning",
  
            category:
              "seo",
  
            scoreImpact:
              3,
  
            priority:
              "medium",
  
            businessImpact:
              "medium",
  
            difficulty:
              "easy",
  
            estimatedFixMinutes:
              10,
  
            quickWin:
              true,
  
            recommendation:
              "Confirm that suppressing search-result snippets is intentional. Public service and landing pages usually benefit from allowing search engines to generate useful result snippets.",
          });
        }
  
        return createFinding({
          id:
            "robots-indexable",
  
          title:
            "Page appears indexable",
  
          description:
            robots.raw
              ? `The page declares "${robots.raw}" and does not contain a noindex directive.`
              : "No page-level robots directive was found that prevents search engines from indexing this page.",
  
          status:
            "pass",
  
          category:
            "technical",
  
          scoreImpact:
            12,
        });
      },
    };