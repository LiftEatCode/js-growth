import {
    BarChart3,
    Clock3,
    DollarSign,
    FileText,
    Gauge,
    LockKeyhole,
    MapPin,
    Search,
    Settings2,
    TrendingUp,
    Zap,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type {
    AuditOpportunity,
    OpportunityInsight,
    ReportMode,
  } from "@/lib/website-audit/types";
  
  interface AuditOpportunityCardProps {
    opportunity: AuditOpportunity;
    mode?: ReportMode;
  }
  
  function getLevelLabel(
    level: AuditOpportunity["level"],
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
  
  function getLevelClasses(
    level: AuditOpportunity["level"],
  ): string {
    if (level === "very-high") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }
  
    if (level === "high") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    }
  
    if (level === "medium") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
  
    return "border-border bg-muted text-muted-foreground";
  }
  
  function getConfidenceLabel(
    confidence: AuditOpportunity["confidence"],
  ): string {
    return `${confidence
      .charAt(0)
      .toUpperCase()}${confidence.slice(1)} confidence`;
  }
  
  function getPriorityClasses(
    priority: OpportunityInsight["priority"],
  ): string {
    if (priority === "high") {
      return "border-destructive/30 bg-destructive/10 text-destructive";
    }
  
    if (priority === "medium") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
  
    return "border-border bg-muted text-muted-foreground";
  }
  
  function getPriorityLabel(
    priority: OpportunityInsight["priority"],
  ): string {
    if (priority === "high") {
      return "High priority";
    }
  
    if (priority === "medium") {
      return "Medium priority";
    }
  
    return "Low priority";
  }
  
  function InsightIcon({
    icon,
    className,
  }: {
    icon: OpportunityInsight["icon"];
    className?: string;
  }) {
    const props = {
      "aria-hidden": true as const,
      className,
    };

    if (icon === "search") {
      return <Search {...props} />;
    }

    if (icon === "map") {
      return <MapPin {...props} />;
    }

    if (icon === "speed") {
      return <Zap {...props} />;
    }

    if (icon === "content") {
      return <FileText {...props} />;
    }

    return <Settings2 {...props} />;
  }
  
  function formatMinutes(
    minutes: number,
  ): string {
    if (minutes <= 0) {
      return "No work estimated";
    }
  
    if (minutes < 60) {
      return `${minutes} min`;
    }
  
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
  
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
  
    return `${hours}h ${remainingMinutes}m`;
  }
  
  function formatCurrency(
    value: number,
  ): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  export function AuditOpportunityCard({
    opportunity,
    mode = "public",
  }: AuditOpportunityCardProps) {
    const isPublic = mode === "public";
    const isConsultation =
      mode === "consultation";
    const isClient = mode === "client";
  
    const visibleInsights = isPublic
      ? opportunity.insights.slice(0, 2)
      : opportunity.insights;
  
    const lockedInsightsCount = Math.max(
      opportunity.insights.length -
        visibleInsights.length,
      0,
    );
  
    return (
      <section
        aria-labelledby="business-opportunity-heading"
        className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp
                aria-hidden="true"
                className="size-4"
              />
  
              Modeled business potential
            </div>
  
            <h2
              id="business-opportunity-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              Business opportunity
            </h2>
  
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              The audit identified opportunities that may
              improve search visibility, lead generation, and
              overall website performance.
            </p>
          </div>
  
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={getLevelClasses(
                opportunity.level,
              )}
            >
              {getLevelLabel(
                opportunity.level,
              )}{" "}
              opportunity
            </Badge>
  
            {!isPublic ? (
              <Badge variant="secondary">
                {getConfidenceLabel(
                  opportunity.confidence,
                )}
              </Badge>
            ) : null}
          </div>
        </div>
  
        <div
          className={`mt-8 grid gap-4 ${
            isPublic
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          <OpportunityMetric
            icon={BarChart3}
            label="Opportunity score"
            value={`${opportunity.score}/100`}
            description="Based on the size and severity of detected growth gaps."
          />
  
          <OpportunityMetric
            icon={TrendingUp}
            label="Traffic opportunity"
            value={`${opportunity.trafficGainPercent.minimum}%–${opportunity.trafficGainPercent.maximum}%`}
            description="Directional organic visibility potential."
          />
  
          {!isPublic ? (
            <>
              <OpportunityMetric
                icon={Gauge}
                label="Lead potential"
                value={`${opportunity.monthlyLeadGain.minimum}–${opportunity.monthlyLeadGain.maximum}/mo`}
                description="Modeled additional monthly lead opportunity."
              />
  
              <OpportunityMetric
                icon={Clock3}
                label="Estimated work"
                value={formatMinutes(
                  opportunity.estimatedFixMinutes,
                )}
                description="Estimated implementation effort."
              />
            </>
          ) : null}
        </div>
  
        {isPublic ? (
          <LockedBusinessModel
            opportunity={opportunity}
          />
        ) : (
          <RevenueOpportunity
            opportunity={opportunity}
          />
        )}
  
        {visibleInsights.length > 0 ? (
          <div className="mt-8">
            <div>
              <p className="text-sm font-medium text-primary">
                Strategic insights
              </p>
  
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Executive growth opportunities
              </h3>
  
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                These opportunities were generated from the
                actual issues detected during the audit.
              </p>
            </div>
  
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {visibleInsights.map(
                (insight) => (
                  <OpportunityInsightCard
                    key={insight.id}
                    insight={insight}
                    mode={mode}
                  />
                ),
              )}
            </div>
  
            {isPublic &&
            lockedInsightsCount > 0 ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <LockKeyhole
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
  
                <div>
                  <p className="font-medium text-foreground">
                    {lockedInsightsCount} additional growth{" "}
                    {lockedInsightsCount === 1
                      ? "opportunity is"
                      : "opportunities are"}{" "}
                    included in the full strategy review.
                  </p>
  
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The complete review connects each
                    opportunity to business impact,
                    implementation priority, and recommended
                    next steps.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="font-semibold text-foreground">
              No major growth gaps were identified.
            </p>
  
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The current audit did not identify enough
              actionable issues to generate specific growth
              opportunities.
            </p>
          </div>
        )}
  
        {isClient ? (
          <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
            <p className="font-semibold text-foreground">
              Client growth strategy
            </p>
  
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              AI-generated growth strategy, implementation
              guidance, and opportunity modeling will appear
              here once the client AI layer is enabled.
            </p>
          </div>
        ) : null}
  
        {isConsultation ||
        isClient ? (
          <details className="mt-8 rounded-2xl border border-border bg-background">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-foreground">
              View estimate methodology and assumptions
            </summary>
  
            <div className="border-t border-border px-5 py-4">
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {opportunity.assumptions.map(
                  (assumption) => (
                    <li
                      key={assumption}
                      className="flex gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className="text-primary"
                      >
                        •
                      </span>
  
                      <span>
                        {assumption}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </details>
        ) : null}
      </section>
    );
  }
  
  interface OpportunityMetricProps {
    icon: typeof BarChart3;
    label: string;
    value: string;
    description: string;
  }
  
  function OpportunityMetric({
    icon: Icon,
    label,
    value,
    description,
  }: OpportunityMetricProps) {
    return (
      <article className="rounded-2xl border border-border bg-background p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </div>
  
        <p className="mt-4 text-sm text-muted-foreground">
          {label}
        </p>
  
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
  
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </article>
    );
  }
  
  function LockedBusinessModel({
    opportunity,
  }: {
    opportunity: AuditOpportunity;
  }) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole
                aria-hidden="true"
                className="size-5"
              />
            </div>
  
            <div>
              <p className="font-semibold text-foreground">
                Full business-impact model
              </p>
  
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                The full strategy review includes modeled
                lead potential, revenue opportunity,
                implementation effort, confidence, and the
                assumptions behind the estimates.
              </p>
            </div>
          </div>
  
          <div className="shrink-0 rounded-xl border border-border bg-background px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Opportunity level
            </p>
  
            <p className="mt-1 text-lg font-semibold text-foreground">
              {getLevelLabel(
                opportunity.level,
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  function RevenueOpportunity({
    opportunity,
  }: {
    opportunity: AuditOpportunity;
  }) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <DollarSign
                aria-hidden="true"
                className="size-4"
              />
  
              Modeled monthly revenue opportunity
            </div>
  
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(
                opportunity
                  .monthlyRevenueOpportunity
                  .minimum,
              )}
              {" – "}
              {formatCurrency(
                opportunity
                  .monthlyRevenueOpportunity
                  .maximum,
              )}
            </p>
          </div>
  
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            This is a directional model rather than a
            guarantee. Actual results depend on traffic,
            conversion rate, customer value, competition, and
            implementation.
          </p>
        </div>
      </div>
    );
  }
  
  interface OpportunityInsightCardProps {
    insight: OpportunityInsight;
    mode: ReportMode;
  }
  
  function OpportunityInsightCard({
    insight,
    mode,
  }: OpportunityInsightCardProps) {
    const isPublic =
      mode === "public";
  
    return (
      <article className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <InsightIcon
                icon={insight.icon}
                className="size-5"
              />
            </div>
  
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground">
                {insight.title}
              </h4>
  
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {insight.description}
              </p>
            </div>
          </div>
  
          {!isPublic ? (
            <Badge
              variant="outline"
              className={getPriorityClasses(
                insight.priority,
              )}
            >
              {getPriorityLabel(
                insight.priority,
              )}
            </Badge>
          ) : null}
        </div>
  
        {!isPublic ? (
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business value
            </p>
  
            <p className="mt-2 text-sm leading-6 text-foreground">
              {insight.businessValue}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary">
            <LockKeyhole
              aria-hidden="true"
              className="size-4"
            />
  
            Business-impact analysis available in
            the full strategy review.
          </div>
        )}
      </article>
    );
  }