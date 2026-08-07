import {
    AlertTriangle,
    Clock3,
    DollarSign,
    ExternalLink,
    Globe2,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
  } from "lucide-react";
  
  import { AuditGradeGauge } from "@/components/website-audit/audit-grade-gauge";
  import {
    MetricCard,
    StatBadge,
  } from "@/components/website-audit/report-ui";
  import { Badge } from "@/components/ui/badge";
  import type { ExecutiveSummary } from "@/lib/website-audit/executive-summary";
  import { getReportConfig } from "@/lib/website-audit/report-config";
  import type {
    ReportMode,
    WebsiteAuditResult,
  } from "@/lib/website-audit/types";
  
  interface AuditExecutiveDashboardProps {
    result: WebsiteAuditResult;
    executiveSummary: ExecutiveSummary;
    mode?: ReportMode;
  }
  
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
        dateStyle: "medium",
      },
    ).format(date);
  }
  
  function formatMinutes(
    minutes: number,
  ): string {
    if (minutes <= 0) {
      return "No work";
    }
  
    if (minutes < 60) {
      return `${minutes} min`;
    }
  
    const hours = Math.floor(
      minutes / 60,
    );
  
    const remainingMinutes =
      minutes % 60;
  
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
  
    return `${hours}h ${remainingMinutes}m`;
  }
  
  function formatCurrency(
    value: number,
  ): string {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      },
    ).format(value);
  }
  
  function getHostname(
    url: string,
  ): string {
    try {
      return new URL(
        url,
      ).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return url;
    }
  }
  
  function getOpportunityLabel(
    level: WebsiteAuditResult["opportunity"]["level"],
  ): string {
    if (level === "very-high") {
      return "Very High";
    }
  
    if (level === "high") {
      return "High";
    }
  
    if (level === "medium") {
      return "Medium";
    }
  
    return "Low";
  }
  
  function getOpportunityTone(
    level: WebsiteAuditResult["opportunity"]["level"],
  ):
    | "success"
    | "primary"
    | "warning"
    | "default" {
    if (level === "very-high") {
      return "success";
    }
  
    if (level === "high") {
      return "primary";
    }
  
    if (level === "medium") {
      return "warning";
    }
  
    return "default";
  }
  
  export function AuditExecutiveDashboard({
    result,
    executiveSummary,
    mode = "public",
  }: AuditExecutiveDashboardProps) {
    const config =
      getReportConfig(mode);
  
    const hostname = getHostname(
      result.metadata.finalUrl,
    );
  
    const actionableFindings =
      result.summary.failed +
      result.summary.warnings;
  
    return (
      <section
        aria-labelledby="executive-dashboard-heading"
        className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_32%),radial-gradient(circle_at_bottom_right,var(--muted)_0,transparent_30%)] opacity-[0.07]"
        />
  
        <div className="relative">
          <div className="border-b border-border p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    <Sparkles
                      aria-hidden="true"
                      className="mr-1 size-3.5"
                    />
  
                    Website Growth Intelligence
                  </Badge>
  
                  <Badge variant="outline">
                    HTTP{" "}
                    {
                      result.metadata
                        .statusCode
                    }
                  </Badge>
  
                  {mode !== "public" ? (
                    <Badge variant="secondary">
                      {mode === "client"
                        ? "Client Report"
                        : "Strategy Report"}
                    </Badge>
                  ) : null}
                </div>
  
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe2
                    aria-hidden="true"
                    className="size-4"
                  />
  
                  <span>
                    {hostname}
                  </span>
                </div>
  
                <h1
                  id="executive-dashboard-heading"
                  className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
                >
                  Website Growth Report
                </h1>
  
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Audited{" "}
                    {formatDate(
                      result.metadata
                        .fetchedAt,
                    )}
                  </span>
  
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
  
                    Read-only public website
                    analysis
                  </span>
                </div>
              </div>
  
              <a
                href={
                  result.metadata.finalUrl
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Open website
  
                <ExternalLink
                  aria-hidden="true"
                  className="size-4"
                />
              </a>
            </div>
          </div>
  
          <div className="grid border-b border-border lg:grid-cols-[300px_1fr]">
            <div className="flex items-center justify-center border-b border-border p-8 lg:border-r lg:border-b-0">
              <AuditGradeGauge
                score={result.overallScore}
                size={220}
              />
            </div>
  
            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">
                Executive summary
              </p>
  
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {
                  executiveSummary.heading
                }
              </h2>
  
              <p className="mt-4 max-w-4xl text-base leading-7 text-muted-foreground sm:text-lg">
                {
                  executiveSummary.summary
                }
              </p>
  
              <div className="mt-6 flex flex-wrap gap-2">
                <StatBadge
                  label={`${result.summary.criticalIssues} critical`}
                  tone={
                    result.summary
                      .criticalIssues > 0
                      ? "danger"
                      : "success"
                  }
                />
  
                <StatBadge
                  label={`${result.summary.quickWins} quick wins`}
                  tone="primary"
                />
  
                <StatBadge
                  label={`${result.summary.highImpactFindings} high impact`}
                  tone={
                    result.summary
                      .highImpactFindings > 0
                      ? "warning"
                      : "default"
                  }
                />
  
                <StatBadge
                  label={`${getOpportunityLabel(
                    result.opportunity.level,
                  )} growth opportunity`}
                  tone={getOpportunityTone(
                    result.opportunity.level,
                  )}
                />
              </div>
            </div>
          </div>
  
          <div className="p-6 sm:p-8 lg:p-10">
            <div
              className={`grid gap-4 sm:grid-cols-2 ${
                config.showRevenueModel
                  ? "xl:grid-cols-5"
                  : "xl:grid-cols-4"
              }`}
            >
              <MetricCard
                icon={TrendingUp}
                label="Opportunity score"
                value={`${result.opportunity.score}/100`}
                description={`${getOpportunityLabel(
                  result.opportunity.level,
                )} modeled growth potential`}
              />
  
              <MetricCard
                icon={AlertTriangle}
                label="Critical issues"
                value={String(
                  result.summary
                    .criticalIssues,
                )}
                description="Issues requiring the highest attention."
              />
  
              <MetricCard
                icon={Zap}
                label="Quick wins"
                value={String(
                  result.summary.quickWins,
                )}
                description="Lower-effort opportunities identified."
              />
  
              {config.showEstimatedTime ? (
                <MetricCard
                  icon={Clock3}
                  label="Estimated effort"
                  value={formatMinutes(
                    result.summary
                      .estimatedFixMinutes,
                  )}
                  description="Modeled implementation effort."
                />
              ) : (
                <MetricCard
                  icon={Clock3}
                  label="Actionable findings"
                  value={String(
                    actionableFindings,
                  )}
                  description="Areas where improvement was detected."
                />
              )}
  
              {config.showRevenueModel ? (
                <MetricCard
                  icon={DollarSign}
                  label="Monthly opportunity"
                  value={`${formatCurrency(
                    result.opportunity
                      .monthlyRevenueOpportunity
                      .minimum,
                  )}–${formatCurrency(
                    result.opportunity
                      .monthlyRevenueOpportunity
                      .maximum,
                  )}`}
                  description="Directional modeled revenue opportunity."
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }