import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
  } from "@react-pdf/renderer";
  
  import { getAuditGrade } from "@/lib/website-audit/grading";
  import type { AuditReport } from "@/lib/website-audit/storage";
  
  interface AuditReportPdfProps {
    report: AuditReport;
  }
  
  const styles = StyleSheet.create({
    page: {
      paddingTop: 44,
      paddingBottom: 50,
      paddingHorizontal: 44,
      fontSize: 10,
      color: "#172033",
      backgroundColor: "#ffffff",
    },
  
    brand: {
      fontSize: 11,
      fontWeight: 700,
      color: "#2563eb",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
  
    title: {
      marginTop: 12,
      fontSize: 28,
      fontWeight: 700,
      color: "#0f172a",
    },
  
    website: {
      marginTop: 8,
      fontSize: 12,
      color: "#64748b",
    },
  
    divider: {
      marginVertical: 22,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
    },
  
    scoreGrid: {
      flexDirection: "row",
      gap: 12,
    },
  
    scoreCard: {
      flexGrow: 1,
      flexBasis: 0,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 8,
      padding: 14,
    },
  
    metricLabel: {
      fontSize: 8,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: "#64748b",
    },
  
    metricValue: {
      marginTop: 5,
      fontSize: 21,
      fontWeight: 700,
      color: "#0f172a",
    },
  
    section: {
      marginTop: 24,
    },
  
    sectionTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
    },
  
    sectionDescription: {
      marginTop: 6,
      lineHeight: 1.5,
      color: "#64748b",
    },
  
    categoryGrid: {
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
  
    categoryCard: {
      width: "48%",
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 7,
      padding: 10,
    },
  
    categoryName: {
      fontSize: 9,
      color: "#64748b",
    },
  
    categoryScore: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: 700,
      color: "#0f172a",
    },
  
    finding: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 7,
      padding: 11,
    },
  
    findingTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: "#0f172a",
    },
  
    findingMeta: {
      marginTop: 4,
      fontSize: 8,
      color: "#2563eb",
      textTransform: "uppercase",
    },
  
    findingDescription: {
      marginTop: 6,
      lineHeight: 1.45,
      color: "#64748b",
    },
  
    lockedPanel: {
      marginTop: 16,
      padding: 14,
      borderRadius: 7,
      backgroundColor: "#eff6ff",
      borderWidth: 1,
      borderColor: "#bfdbfe",
    },
  
    lockedTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: "#1d4ed8",
    },
  
    lockedText: {
      marginTop: 5,
      lineHeight: 1.45,
      color: "#475569",
    },
  
    footer: {
      position: "absolute",
      left: 44,
      right: 44,
      bottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      color: "#94a3b8",
      fontSize: 8,
    },
  });
  
  function formatDate(value: string): string {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
  
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
    }).format(date);
  }
  
  export function AuditReportPdf({
    report,
  }: AuditReportPdfProps) {
    const audit = report.audit;
    const grade = getAuditGrade(
      audit.overallScore,
    );
  
    const actionableFindings =
      audit.findings
        .filter(
          (finding) =>
            finding.status !== "pass",
        )
        .slice(0, 8);
  
    return (
      <Document
        title={`Website Growth Report - ${report.hostname}`}
        author="JS Solutions"
        subject="Website Growth Audit"
      >
        <Page
          size="LETTER"
          style={styles.page}
        >
          <Text style={styles.brand}>
            JS Solutions
          </Text>
  
          <Text style={styles.title}>
            Website Growth Report
          </Text>
  
          <Text style={styles.website}>
            {report.website}
          </Text>
  
          <Text style={styles.website}>
            Prepared {formatDate(report.createdAt)}
          </Text>
  
          <View style={styles.divider} />
  
          <View style={styles.scoreGrid}>
            <View style={styles.scoreCard}>
              <Text style={styles.metricLabel}>
                Website Grade
              </Text>
  
              <Text style={styles.metricValue}>
                {grade.letter}
              </Text>
            </View>
  
            <View style={styles.scoreCard}>
              <Text style={styles.metricLabel}>
                Overall Score
              </Text>
  
              <Text style={styles.metricValue}>
                {audit.overallScore}/100
              </Text>
            </View>
  
            <View style={styles.scoreCard}>
              <Text style={styles.metricLabel}>
                Opportunity
              </Text>
  
              <Text style={styles.metricValue}>
                {audit.opportunity.score}/100
              </Text>
            </View>
          </View>
  
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Executive Overview
            </Text>
  
            <Text style={styles.sectionDescription}>
              This report summarizes the website&apos;s
              current search, technical, content,
              accessibility, local SEO, and performance
              signals. It is designed to identify priority
              growth opportunities and areas that deserve
              additional strategy review.
            </Text>
          </View>
  
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Key Findings
            </Text>
  
            <View style={styles.scoreGrid}>
              <View style={styles.scoreCard}>
                <Text style={styles.metricLabel}>
                  Critical Issues
                </Text>
  
                <Text style={styles.metricValue}>
                  {audit.summary.criticalIssues}
                </Text>
              </View>
  
              <View style={styles.scoreCard}>
                <Text style={styles.metricLabel}>
                  Quick Wins
                </Text>
  
                <Text style={styles.metricValue}>
                  {audit.summary.quickWins}
                </Text>
              </View>
  
              <View style={styles.scoreCard}>
                <Text style={styles.metricLabel}>
                  High Impact
                </Text>
  
                <Text style={styles.metricValue}>
                  {audit.summary.highImpactFindings}
                </Text>
              </View>
            </View>
          </View>
  
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Category Scores
            </Text>
  
            <View style={styles.categoryGrid}>
              {audit.categoryScores.map(
                (category) => (
                  <View
                    key={category.category}
                    style={styles.categoryCard}
                  >
                    <Text style={styles.categoryName}>
                      {category.label}
                    </Text>
  
                    <Text style={styles.categoryScore}>
                      {category.score}/
                      {category.maxScore}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
  
          <View
            style={styles.footer}
            fixed
          >
            <Text>
              JS Solutions - Website Growth Intelligence
            </Text>
  
            <Text
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
  
        <Page
          size="LETTER"
          style={styles.page}
        >
          <Text style={styles.brand}>
            JS Solutions
          </Text>
  
          <Text style={styles.sectionTitle}>
            Priority Findings
          </Text>
  
          <Text style={styles.sectionDescription}>
            The following issues represent a preview of the
            highest-value opportunities identified during the
            website audit.
          </Text>
  
          {actionableFindings.map(
            (finding) => (
              <View
                key={finding.id}
                style={styles.finding}
                wrap={false}
              >
                <Text style={styles.findingTitle}>
                  {finding.title}
                </Text>
  
                <Text style={styles.findingMeta}>
                  {finding.category} - {finding.priority} priority
                  {" - "}
                  {finding.businessImpact} business impact
                </Text>
  
                <Text style={styles.findingDescription}>
                  {finding.description}
                </Text>
              </View>
            ),
          )}
  
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedTitle}>
              Implementation guidance intentionally excluded
            </Text>
  
            <Text style={styles.lockedText}>
              This professional report identifies what should
              be addressed and why it matters. Detailed
              implementation instructions, code changes,
              content rewrites, and AI-generated technical
              fixes are reserved for strategy and client
              engagements.
            </Text>
          </View>
  
          <View
            style={styles.footer}
            fixed
          >
            <Text>
              JS Solutions - Website Growth Intelligence
            </Text>
  
            <Text
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      </Document>
    );
  }