import {
    BarChart3,
    Clock3,
    DollarSign,
    Gauge,
    TrendingUp,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type { AuditOpportunity } from "@/lib/website-audit/types";
  
  interface AuditOpportunityCardProps {
    opportunity: AuditOpportunity;
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
  
  function formatMinutes(minutes: number): string {
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
  
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  export function AuditOpportunityCard({
    opportunity,
  }: AuditOpportunityCardProps) {
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
              These estimates translate the detected website
              gaps into modeled traffic, lead, and revenue
              opportunities. They are directional estimates,
              not guaranteed results.
            </p>
          </div>
  
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={getLevelClasses(
                opportunity.level,
              )}
            >
              {getLevelLabel(opportunity.level)} opportunity
            </Badge>
  
            <Badge variant="secondary">
              {getConfidenceLabel(
                opportunity.confidence,
              )}
            </Badge>
          </div>
        </div>
  
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OpportunityMetric
            icon={BarChart3}
            label="Opportunity score"
            value={`${opportunity.score}/100`}
            description="Modeled from score gaps and issue severity"
          />
  
          <OpportunityMetric
            icon={TrendingUp}
            label="Traffic potential"
            value={`${opportunity.trafficGainPercent.minimum}%–${opportunity.trafficGainPercent.maximum}%`}
            description="Potential organic visibility improvement"
          />
  
          <OpportunityMetric
            icon={Gauge}
            label="Lead potential"
            value={`${opportunity.monthlyLeadGain.minimum}–${opportunity.monthlyLeadGain.maximum}/mo`}
            description="Modeled monthly lead increase"
          />
  
          <OpportunityMetric
            icon={Clock3}
            label="Estimated work"
            value={formatMinutes(
              opportunity.estimatedFixMinutes,
            )}
            description="Estimated implementation effort"
          />
        </div>
  
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
                  opportunity.monthlyRevenueOpportunity
                    .minimum,
                )}
                {" – "}
                {formatCurrency(
                  opportunity.monthlyRevenueOpportunity
                    .maximum,
                )}
              </p>
            </div>
  
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              This range assumes an average value of $250 per
              additional lead and depends heavily on actual
              traffic, conversion rate, competition, and
              implementation quality.
            </p>
          </div>
        </div>
  
        <details className="mt-6 rounded-2xl border border-border bg-background">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-foreground">
            View estimate assumptions
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
  
                    <span>{assumption}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </details>
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