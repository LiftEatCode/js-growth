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

import {
  InfoPanel,
  MetricCard,
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
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

function getLevelTone(
  level: AuditOpportunity["level"],
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

function getPriorityTone(
  priority: OpportunityInsight["priority"],
):
  | "danger"
  | "warning"
  | "default" {
  if (priority === "high") {
    return "danger";
  }

  if (priority === "medium") {
    return "warning";
  }

  return "default";
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

export function AuditOpportunityCard({
  opportunity,
  mode = "public",
}: AuditOpportunityCardProps) {
  const isPublic =
    mode === "public";

  const isConsultation =
    mode === "consultation";

  const isClient =
    mode === "client";

  const visibleInsights =
    isPublic
      ? opportunity.insights.slice(
          0,
          2,
        )
      : opportunity.insights;

  const lockedInsightsCount =
    Math.max(
      opportunity.insights.length -
        visibleInsights.length,
      0,
    );

  return (
    <ReportSection
      eyebrow="Modeled business potential"
      title="Business opportunity"
      description="The audit identified opportunities that may improve search visibility, lead generation, and overall website performance."
      icon={TrendingUp}
    >
      <div className="flex flex-wrap gap-2">
        <StatBadge
          label={`${getLevelLabel(
            opportunity.level,
          )} opportunity`}
          tone={getLevelTone(
            opportunity.level,
          )}
        />

        {!isPublic ? (
          <StatBadge
            label={`${opportunity.confidence
              .charAt(0)
              .toUpperCase()}${opportunity.confidence.slice(
              1,
            )} confidence`}
            tone="default"
          />
        ) : null}
      </div>

      <div
        className={`mt-6 grid gap-4 ${
          isPublic
            ? "sm:grid-cols-2"
            : "sm:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        <MetricCard
          icon={BarChart3}
          label="Opportunity score"
          value={`${opportunity.score}/100`}
          description="Based on the size and severity of detected growth gaps."
        />

        <MetricCard
          icon={TrendingUp}
          label="Traffic opportunity"
          value={`${opportunity.trafficGainPercent.minimum}%–${opportunity.trafficGainPercent.maximum}%`}
          description="Directional organic visibility potential."
        />

        {!isPublic ? (
          <>
            <MetricCard
              icon={Gauge}
              label="Lead potential"
              value={`${opportunity.monthlyLeadGain.minimum}–${opportunity.monthlyLeadGain.maximum}/mo`}
              description="Modeled additional monthly lead opportunity."
            />

            <MetricCard
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

      <div className="mt-4">
        {isPublic ? (
          <InfoPanel
            icon={LockKeyhole}
            title="Full business-impact model"
            description="The full strategy review includes modeled lead potential, revenue opportunity, implementation effort, confidence, and the assumptions behind the estimates."
            tone="primary"
          />
        ) : (
          <RevenueOpportunity
            opportunity={opportunity}
          />
        )}
      </div>

      {visibleInsights.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-medium text-primary">
            Strategic insights
          </p>

          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Executive growth opportunities
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            These opportunities were
            generated from the actual issues
            detected during the audit.
          </p>

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
            <div className="mt-4">
              <InfoPanel
                icon={LockKeyhole}
                title={`${lockedInsightsCount} additional growth ${
                  lockedInsightsCount === 1
                    ? "opportunity is"
                    : "opportunities are"
                } included in the full strategy review.`}
                description="The complete review connects each opportunity to business impact, implementation priority, and recommended next steps."
                tone="primary"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8">
          <InfoPanel
            title="No major growth gaps were identified."
            description="The current audit did not identify enough actionable issues to generate specific growth opportunities."
            tone="default"
          />
        </div>
      )}

      {isClient ? (
        <div className="mt-8">
          <InfoPanel
            icon={TrendingUp}
            title="Client growth strategy"
            description="AI-generated growth strategy, implementation guidance, and opportunity modeling will appear here once the client AI layer is enabled."
            tone="primary"
          />
        </div>
      ) : null}

      {isConsultation ||
      isClient ? (
        <details className="mt-8 rounded-2xl border border-border bg-background">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-foreground">
            View estimate methodology
            and assumptions
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
    </ReportSection>
  );
}

function RevenueOpportunity({
  opportunity,
}: {
  opportunity: AuditOpportunity;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <DollarSign
              aria-hidden="true"
              className="size-4"
            />

            Modeled monthly revenue
            opportunity
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
          This is a directional model rather
          than a guarantee. Actual results
          depend on traffic, conversion rate,
          customer value, competition, and
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
          <StatBadge
            label={getPriorityLabel(
              insight.priority,
            )}
            tone={getPriorityTone(
              insight.priority,
            )}
          />
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
        <div className="mt-4">
          <InfoPanel
            icon={LockKeyhole}
            title="Business-impact analysis locked"
            description="Detailed business value and prioritization are included in the full strategy review."
            tone="primary"
          />
        </div>
      )}
    </article>
  );
}