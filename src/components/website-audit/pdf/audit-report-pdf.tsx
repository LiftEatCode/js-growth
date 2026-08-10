import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
  } from "@react-pdf/renderer";
  
  import { buildExecutiveSummary } from "@/lib/website-audit/executive-summary";
  import { getAuditGrade } from "@/lib/website-audit/grading";
  import { buildRoadmap } from "@/lib/website-audit/roadmap";
  import type {
    AuditCategory,
    AuditFinding,
  } from "@/lib/website-audit/types";
  import type {
    AuditReport,
  } from "@/lib/website-audit/storage";
  
  interface AuditReportPdfProps {
    report: AuditReport;
  }
  
  const COLORS = {
    brand: "#0f172a",
    brandSoft: "#172554",
    blue: "#2563eb",
    blueLight: "#eff6ff",
    cyan: "#06b6d4",
    slate900: "#0f172a",
    slate800: "#1e293b",
    slate700: "#334155",
    slate600: "#475569",
    slate500: "#64748b",
    slate400: "#94a3b8",
    slate300: "#cbd5e1",
    slate200: "#e2e8f0",
    slate100: "#f1f5f9",
    slate50: "#f8fafc",
    white: "#ffffff",
    emerald: "#059669",
    emeraldLight: "#ecfdf5",
    amber: "#d97706",
    amberLight: "#fffbeb",
    red: "#dc2626",
    redLight: "#fef2f2",
  };
  
  const styles = StyleSheet.create({
    page: {
      paddingTop: 42,
      paddingBottom: 54,
      paddingHorizontal: 44,
      fontSize: 9,
      color: COLORS.slate700,
      backgroundColor: COLORS.white,
      fontFamily: "Helvetica",
    },
  
    coverPage: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingHorizontal: 0,
      backgroundColor: COLORS.brand,
      color: COLORS.white,
      fontFamily: "Helvetica",
    },
  
    coverTop: {
      paddingHorizontal: 48,
      paddingTop: 48,
    },
  
    coverBrand: {
      fontSize: 11,
      fontWeight: 700,
      color: COLORS.cyan,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
  
    coverEyebrow: {
      marginTop: 54,
      fontSize: 9,
      fontWeight: 700,
      color: COLORS.cyan,
      textTransform: "uppercase",
      letterSpacing: 1.4,
    },
  
    coverTitle: {
      marginTop: 12,
      maxWidth: 460,
      fontSize: 32,
      lineHeight: 1.08,
      fontWeight: 700,
      color: COLORS.white,
    },
  
    coverWebsite: {
      marginTop: 18,
      fontSize: 14,
      color: COLORS.slate300,
    },
  
    coverDescription: {
      marginTop: 22,
      maxWidth: 430,
      fontSize: 11,
      lineHeight: 1.55,
      color: COLORS.slate300,
    },
  
    coverScorePanel: {
      marginTop: 42,
      marginHorizontal: 48,
      padding: 22,
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 10,
      backgroundColor: "#172033",
    },
  
    coverScoreRow: {
      flexDirection: "row",
    },
  
    coverScorePrimary: {
      width: "34%",
      paddingRight: 20,
      borderRightWidth: 1,
      borderRightColor: "#334155",
    },
  
    coverScoreSecondary: {
      width: "33%",
      paddingLeft: 20,
    },
  
    coverMetricLabel: {
      fontSize: 8,
      color: COLORS.slate400,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
  
    coverMetricValue: {
      marginTop: 7,
      fontSize: 26,
      fontWeight: 700,
      color: COLORS.white,
    },
  
    coverMetricAccent: {
      marginTop: 7,
      fontSize: 26,
      fontWeight: 700,
      color: COLORS.cyan,
    },
  
    coverFooter: {
      position: "absolute",
      left: 48,
      right: 48,
      bottom: 38,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#334155",
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: COLORS.slate400,
    },
  
    pageHeader: {
      marginBottom: 26,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.slate200,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  
    pageBrand: {
      fontSize: 9,
      fontWeight: 700,
      color: COLORS.blue,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  
    pageWebsite: {
      fontSize: 8,
      color: COLORS.slate500,
    },
  
    eyebrow: {
      fontSize: 8,
      fontWeight: 700,
      color: COLORS.blue,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  
    pageTitle: {
      marginTop: 6,
      fontSize: 22,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    pageDescription: {
      marginTop: 8,
      maxWidth: 470,
      fontSize: 10,
      lineHeight: 1.55,
      color: COLORS.slate500,
    },
  
    section: {
      marginTop: 24,
    },
  
    sectionTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    sectionDescription: {
      marginTop: 6,
      fontSize: 9,
      lineHeight: 1.5,
      color: COLORS.slate500,
    },
  
    metricGrid: {
      marginTop: 16,
      flexDirection: "row",
    },
  
    metricCard: {
      flexGrow: 1,
      flexBasis: 0,
      marginRight: 8,
      borderWidth: 1,
      borderColor: COLORS.slate200,
      borderRadius: 8,
      padding: 12,
      backgroundColor: COLORS.slate50,
    },
  
    metricCardLast: {
      flexGrow: 1,
      flexBasis: 0,
      borderWidth: 1,
      borderColor: COLORS.slate200,
      borderRadius: 8,
      padding: 12,
      backgroundColor: COLORS.slate50,
    },
  
    metricLabel: {
      fontSize: 7,
      color: COLORS.slate500,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
  
    metricValue: {
      marginTop: 5,
      fontSize: 18,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    metricDescription: {
      marginTop: 4,
      fontSize: 7.5,
      lineHeight: 1.4,
      color: COLORS.slate500,
    },
  
    executivePanel: {
      marginTop: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: "#bfdbfe",
      borderRadius: 8,
      backgroundColor: COLORS.blueLight,
    },
  
    executiveTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    executiveText: {
      marginTop: 7,
      fontSize: 9,
      lineHeight: 1.55,
      color: COLORS.slate600,
    },
  
    categoryGrid: {
      marginTop: 14,
      flexDirection: "row",
      flexWrap: "wrap",
    },
  
    categoryCard: {
      width: "48%",
      marginRight: "2%",
      marginBottom: 9,
      borderWidth: 1,
      borderColor: COLORS.slate200,
      borderRadius: 8,
      padding: 11,
      backgroundColor: COLORS.white,
    },
  
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  
    categoryName: {
      width: "70%",
      fontSize: 9,
      fontWeight: 700,
      color: COLORS.slate800,
    },
  
    categoryPercent: {
      fontSize: 13,
      fontWeight: 700,
      color: COLORS.blue,
    },
  
    categoryMeta: {
      marginTop: 4,
      fontSize: 7.5,
      color: COLORS.slate500,
    },
  
    progressTrack: {
      marginTop: 8,
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.slate100,
    },
  
    progressFillExcellent: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.emerald,
    },
  
    progressFillStrong: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.blue,
    },
  
    progressFillWarning: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.amber,
    },
  
    progressFillDanger: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.red,
    },
  
    finding: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: COLORS.slate200,
      borderRadius: 8,
      overflow: "hidden",
    },
  
    findingHeader: {
      padding: 10,
      backgroundColor: COLORS.slate50,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.slate200,
    },
  
    findingHeaderDanger: {
      padding: 10,
      backgroundColor: COLORS.redLight,
      borderBottomWidth: 1,
      borderBottomColor: "#fecaca",
    },
  
    findingHeaderWarning: {
      padding: 10,
      backgroundColor: COLORS.amberLight,
      borderBottomWidth: 1,
      borderBottomColor: "#fde68a",
    },
  
    findingTitle: {
      fontSize: 10.5,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    findingMeta: {
      marginTop: 4,
      fontSize: 7,
      color: COLORS.slate500,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  
    findingBody: {
      padding: 10,
    },
  
    findingDescription: {
      fontSize: 8.5,
      lineHeight: 1.5,
      color: COLORS.slate600,
    },
  
    findingRecommendation: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.slate200,
    },
  
    recommendationLabel: {
      fontSize: 7,
      fontWeight: 700,
      color: COLORS.blue,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  
    recommendationText: {
      marginTop: 4,
      fontSize: 8.5,
      lineHeight: 1.5,
      color: COLORS.slate700,
    },
  
    roadmapPhase: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: COLORS.slate200,
      borderRadius: 8,
      overflow: "hidden",
    },
  
    roadmapHeader: {
      flexDirection: "row",
    },
  
    roadmapNumber: {
      width: 62,
      padding: 11,
      backgroundColor: COLORS.brand,
      color: COLORS.white,
    },
  
    roadmapNumberLabel: {
      fontSize: 6.5,
      color: COLORS.cyan,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  
    roadmapNumberValue: {
      marginTop: 3,
      fontSize: 17,
      fontWeight: 700,
      color: COLORS.white,
    },
  
    roadmapContent: {
      flexGrow: 1,
      padding: 11,
      backgroundColor: COLORS.white,
    },
  
    roadmapTitle: {
      fontSize: 10.5,
      fontWeight: 700,
      color: COLORS.slate900,
    },
  
    roadmapDescription: {
      marginTop: 4,
      fontSize: 8,
      lineHeight: 1.45,
      color: COLORS.slate500,
    },
  
    roadmapTask: {
      marginTop: 8,
      paddingTop: 7,
      borderTopWidth: 1,
      borderTopColor: COLORS.slate200,
    },
  
    roadmapTaskTitle: {
      fontSize: 8.5,
      fontWeight: 700,
      color: COLORS.slate800,
    },
  
    roadmapTaskText: {
      marginTop: 3,
      fontSize: 7.5,
      lineHeight: 1.4,
      color: COLORS.slate500,
    },
  
    notePanel: {
      marginTop: 18,
      padding: 13,
      borderRadius: 8,
      backgroundColor: COLORS.blueLight,
      borderWidth: 1,
      borderColor: "#bfdbfe",
    },
  
    noteTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: "#1d4ed8",
    },
  
    noteText: {
      marginTop: 5,
      fontSize: 8,
      lineHeight: 1.5,
      color: COLORS.slate600,
    },
  
    nextStepPanel: {
      marginTop: 20,
      padding: 16,
      borderRadius: 8,
      backgroundColor: COLORS.brand,
      color: COLORS.white,
    },
  
    nextStepEyebrow: {
      fontSize: 7,
      fontWeight: 700,
      color: COLORS.cyan,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
  
    nextStepTitle: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: 700,
      color: COLORS.white,
    },
  
    nextStepText: {
      marginTop: 6,
      fontSize: 8.5,
      lineHeight: 1.5,
      color: COLORS.slate300,
    },
  
    footer: {
      position: "absolute",
      left: 44,
      right: 44,
      bottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 7,
      color: COLORS.slate400,
    },
  });
  
  function formatDate(
    value: string,
  ): string {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
  
    return new Intl.DateTimeFormat(
      "en-US",
      {
        dateStyle: "long",
      },
    ).format(date);
  }
  
  function formatOpportunityLevel(
    level: string,
  ): string {
    return level
      .split("-")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1),
      )
      .join(" ");
  }
  
  function getCategoryPercentage(
    score: number,
    maxScore: number,
  ): number {
    if (maxScore <= 0) {
      return 0;
    }
  
    return Math.round(
      (score / maxScore) * 100,
    );
  }
  
  function getCategoryProgressStyle(
    percentage: number,
  ) {
    if (percentage >= 90) {
      return styles.progressFillExcellent;
    }
  
    if (percentage >= 75) {
      return styles.progressFillStrong;
    }
  
    if (percentage >= 60) {
      return styles.progressFillWarning;
    }
  
    return styles.progressFillDanger;
  }
  
  function getFindingHeaderStyle(
    finding: AuditFinding,
  ) {
    if (
      finding.status === "fail" ||
      finding.priority === "critical"
    ) {
      return styles.findingHeaderDanger;
    }
  
    if (finding.status === "warning") {
      return styles.findingHeaderWarning;
    }
  
    return styles.findingHeader;
  }
  
  function formatCategory(
    category: AuditCategory,
  ): string {
    const labels: Record<
      AuditCategory,
      string
    > = {
      technical: "Technical SEO",
      seo: "Search Optimization",
      content: "Content",
      accessibility: "Accessibility",
      local: "Local SEO",
      performance: "Performance",
    };
  
    return labels[category];
  }
  
  function PdfHeader({
    hostname,
  }: {
    hostname: string;
  }) {
    return (
      <View style={styles.pageHeader}>
        <Text style={styles.pageBrand}>
          JS Solutions
        </Text>
  
        <Text style={styles.pageWebsite}>
          {hostname}
        </Text>
      </View>
    );
  }
  
  function PdfFooter() {
    return (
      <View
        style={styles.footer}
        fixed
      >
        <Text>
          JS Solutions · Website Growth Intelligence
        </Text>
  
        <Text
          render={({
            pageNumber,
            totalPages,
          }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
    );
  }
  
  export function AuditReportPdf({
    report,
  }: AuditReportPdfProps) {
    const audit = report.audit;
  
    const grade = getAuditGrade(
      audit.overallScore,
    );
  
    const executiveSummary =
      buildExecutiveSummary(
        audit.findings,
        audit.summary,
      );
  
    const roadmap =
      buildRoadmap(
        audit.findings,
      );
  
    const priorityFindings =
      audit.findings
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
  
          const impactWeight = {
            high: 3,
            medium: 2,
            low: 1,
          };
  
          return (
            priorityWeight[b.priority] *
              100 +
            impactWeight[
              b.businessImpact
            ] *
              10 +
            b.scoreImpact -
            (priorityWeight[a.priority] *
              100 +
              impactWeight[
                a.businessImpact
              ] *
                10 +
              a.scoreImpact)
          );
        })
        .slice(0, 10);
  
    return (
      <Document
        title={`Website Growth Report - ${report.hostname}`}
        author="JS Solutions"
        subject="Website Growth Audit"
        keywords="website audit, SEO, Local SEO, website growth, JS Solutions"
      >
        <Page
          size="LETTER"
          style={styles.coverPage}
        >
          <View style={styles.coverTop}>
            <Text style={styles.coverBrand}>
              JS Solutions
            </Text>
  
            <Text style={styles.coverEyebrow}>
              Website Growth Intelligence
            </Text>
  
            <Text style={styles.coverTitle}>
              Website Growth Report
            </Text>
  
            <Text style={styles.coverWebsite}>
              {report.hostname}
            </Text>
  
            <Text style={styles.coverDescription}>
              A professional review of the website&apos;s
              technical, search, content, accessibility,
              local SEO, and performance signals with
              prioritized opportunities for improvement.
            </Text>
          </View>
  
          <View style={styles.coverScorePanel}>
            <View style={styles.coverScoreRow}>
              <View style={styles.coverScorePrimary}>
                <Text style={styles.coverMetricLabel}>
                  Website Grade
                </Text>
  
                <Text style={styles.coverMetricAccent}>
                  {grade.letter}
                </Text>
              </View>
  
              <View style={styles.coverScoreSecondary}>
                <Text style={styles.coverMetricLabel}>
                  Overall Score
                </Text>
  
                <Text style={styles.coverMetricValue}>
                  {audit.overallScore}/100
                </Text>
              </View>
  
              <View style={styles.coverScoreSecondary}>
                <Text style={styles.coverMetricLabel}>
                  Opportunity
                </Text>
  
                <Text style={styles.coverMetricValue}>
                  {audit.opportunity.score}/100
                </Text>
              </View>
            </View>
          </View>
  
          <View style={styles.coverFooter}>
            <Text>
              Prepared {formatDate(report.createdAt)}
            </Text>
  
            <Text>
              js-growth.com
            </Text>
          </View>
        </Page>
  
        <Page
          size="LETTER"
          style={styles.page}
        >
          <PdfHeader
            hostname={report.hostname}
          />
  
          <Text style={styles.eyebrow}>
            Executive Overview
          </Text>
  
          <Text style={styles.pageTitle}>
            What the audit found
          </Text>
  
          <Text style={styles.pageDescription}>
            This section summarizes the current condition of
            the website and highlights the issues and
            opportunities most likely to deserve attention.
          </Text>
  
          <View style={styles.executivePanel}>
            <Text style={styles.executiveTitle}>
              {executiveSummary.heading}
            </Text>
  
            <Text style={styles.executiveText}>
              {executiveSummary.summary}
            </Text>
          </View>
  
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                Critical Issues
              </Text>
  
              <Text style={styles.metricValue}>
                {audit.summary.criticalIssues}
              </Text>
  
              <Text style={styles.metricDescription}>
                Highest-priority issues detected.
              </Text>
            </View>
  
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                Quick Wins
              </Text>
  
              <Text style={styles.metricValue}>
                {audit.summary.quickWins}
              </Text>
  
              <Text style={styles.metricDescription}>
                Lower-effort improvement opportunities.
              </Text>
            </View>
  
            <View style={styles.metricCardLast}>
              <Text style={styles.metricLabel}>
                High Impact
              </Text>
  
              <Text style={styles.metricValue}>
                {audit.summary.highImpactFindings}
              </Text>
  
              <Text style={styles.metricDescription}>
                Findings with stronger business impact.
              </Text>
            </View>
          </View>
  
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Growth Opportunity
            </Text>
  
            <Text style={styles.sectionDescription}>
              The opportunity model estimates how much
              improvement potential exists based on the
              quantity, severity, and business impact of the
              issues detected.
            </Text>
  
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  Opportunity Level
                </Text>
  
                <Text style={styles.metricValue}>
                  {formatOpportunityLevel(
                    audit.opportunity.level,
                  )}
                </Text>
              </View>
  
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  Opportunity Score
                </Text>
  
                <Text style={styles.metricValue}>
                  {audit.opportunity.score}/100
                </Text>
              </View>
  
              <View style={styles.metricCardLast}>
                <Text style={styles.metricLabel}>
                  Traffic Potential
                </Text>
  
                <Text style={styles.metricValue}>
                  {
                    audit.opportunity
                      .trafficGainPercent.minimum
                  }
                  %–
                  {
                    audit.opportunity
                      .trafficGainPercent.maximum
                  }
                  %
                </Text>
              </View>
            </View>
          </View>
  
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Category Performance
            </Text>
  
            <Text style={styles.sectionDescription}>
              These scores show where the website is strongest
              and where the largest optimization gaps exist.
            </Text>
  
            <View style={styles.categoryGrid}>
              {audit.categoryScores.map(
                (category) => {
                  const percentage =
                    getCategoryPercentage(
                      category.score,
                      category.maxScore,
                    );
  
                  const issueCount =
                    audit.findings.filter(
                      (finding) =>
                        finding.category ===
                          category.category &&
                        finding.status !==
                          "pass",
                    ).length;
  
                  return (
                    <View
                      key={category.category}
                      style={styles.categoryCard}
                      wrap={false}
                    >
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>
                          {category.label}
                        </Text>
  
                        <Text style={styles.categoryPercent}>
                          {percentage}%
                        </Text>
                      </View>
  
                      <Text style={styles.categoryMeta}>
                        {category.score}/{category.maxScore} points ·{" "}
                        {issueCount}{" "}
                        {issueCount === 1
                          ? "issue"
                          : "issues"}
                      </Text>
  
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            getCategoryProgressStyle(
                              percentage,
                            ),
                            {
                              width: `${percentage}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                },
              )}
            </View>
          </View>
  
          <PdfFooter />
        </Page>
  
        <Page
          size="LETTER"
          style={styles.page}
        >
          <PdfHeader
            hostname={report.hostname}
          />
  
          <Text style={styles.eyebrow}>
            Priority Findings
          </Text>
  
          <Text style={styles.pageTitle}>
            What deserves attention first
          </Text>
  
          <Text style={styles.pageDescription}>
            These findings are ordered by priority, business
            impact, and score impact. Addressing the strongest
            issues first usually creates the clearest path
            toward improvement.
          </Text>
  
          {priorityFindings.map(
            (finding, index) => (
              <View
                key={finding.id}
                style={styles.finding}
                wrap={false}
              >
                <View
                  style={getFindingHeaderStyle(
                    finding,
                  )}
                >
                  <Text style={styles.findingTitle}>
                    {index + 1}. {finding.title}
                  </Text>
  
                  <Text style={styles.findingMeta}>
                    {formatCategory(
                      finding.category,
                    )}
                    {" · "}
                    {finding.priority} priority
                    {" · "}
                    {finding.businessImpact} business impact
                    {" · "}
                    {finding.scoreImpact} point score impact
                  </Text>
                </View>
  
                <View style={styles.findingBody}>
                  <Text style={styles.findingDescription}>
                    {finding.description}
                  </Text>
  
                  {finding.recommendation ? (
                    <View
                      style={
                        styles.findingRecommendation
                      }
                    >
                      <Text
                        style={
                          styles.recommendationLabel
                        }
                      >
                        Recommended Action
                      </Text>
  
                      <Text
                        style={
                          styles.recommendationText
                        }
                      >
                        {finding.recommendation}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ),
          )}
  
          <View style={styles.notePanel}>
            <Text style={styles.noteTitle}>
              About these recommendations
            </Text>
  
            <Text style={styles.noteText}>
              This report identifies the areas that should be
              reviewed and provides strategic recommendations.
              Detailed code changes, implementation steps,
              content rewrites, and custom development should
              be validated against the website&apos;s full
              architecture before deployment.
            </Text>
          </View>
  
          <PdfFooter />
        </Page>
  
        <Page
          size="LETTER"
          style={styles.page}
        >
          <PdfHeader
            hostname={report.hostname}
          />
  
          <Text style={styles.eyebrow}>
            Improvement Roadmap
          </Text>
  
          <Text style={styles.pageTitle}>
            A practical order of work
          </Text>
  
          <Text style={styles.pageDescription}>
            The roadmap organizes audit findings into phases so
            the most urgent and valuable improvements can be
            handled before lower-priority optimization work.
          </Text>
  
          {roadmap
            .slice(0, 5)
            .map(
              (phase, phaseIndex) => (
                <View
                  key={phase.id}
                  style={styles.roadmapPhase}
                  wrap={false}
                >
                  <View style={styles.roadmapHeader}>
                    <View style={styles.roadmapNumber}>
                      <Text
                        style={
                          styles.roadmapNumberLabel
                        }
                      >
                        Phase
                      </Text>
  
                      <Text
                        style={
                          styles.roadmapNumberValue
                        }
                      >
                        {String(
                          phaseIndex + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </Text>
                    </View>
  
                    <View style={styles.roadmapContent}>
                      <Text style={styles.roadmapTitle}>
                        {phase.title}
                      </Text>
  
                      <Text
                        style={
                          styles.roadmapDescription
                        }
                      >
                        {phase.description}
                      </Text>
  
                      {phase.findings
                        .slice(0, 4)
                        .map((finding) => (
                          <View
                            key={finding.id}
                            style={
                              styles.roadmapTask
                            }
                          >
                            <Text
                              style={
                                styles.roadmapTaskTitle
                              }
                            >
                              {finding.title}
                            </Text>
  
                            <Text
                              style={
                                styles.roadmapTaskText
                              }
                            >
                              {finding.recommendation ??
                                finding.description}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                </View>
              ),
            )}
  
          <View style={styles.nextStepPanel}>
            <Text style={styles.nextStepEyebrow}>
              Recommended Next Step
            </Text>
  
            <Text style={styles.nextStepTitle}>
              Turn the audit into an implementation plan.
            </Text>
  
            <Text style={styles.nextStepText}>
              JS Solutions can review the findings, validate
              priorities against your business goals, and build
              a practical website, SEO, Local SEO, automation,
              or development plan around the opportunities
              identified in this report.
            </Text>
          </View>
  
          <View style={styles.notePanel}>
            <Text style={styles.noteTitle}>
              Report scope
            </Text>
  
            <Text style={styles.noteText}>
              This audit evaluates publicly available website
              signals detected during the scan. It is not a
              guarantee of rankings, traffic, leads, or revenue
              and does not replace a full technical,
              competitive, analytics, or business review.
            </Text>
          </View>
  
          <PdfFooter />
        </Page>
      </Document>
    );
  }