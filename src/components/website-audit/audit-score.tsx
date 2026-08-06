"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  TrendingUp,
} from "lucide-react";

import type {
  AuditCategoryScore,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditScoreProps {
  overallScore: number;
  categoryScores: AuditCategoryScore[];
  summary: WebsiteAuditResult["summary"];
}

function getScoreColor(score: number) {
  if (score >= 90) {
    return "text-green-500";
  }

  if (score >= 75) {
    return "text-emerald-500";
  }

  if (score >= 60) {
    return "text-yellow-500";
  }

  if (score >= 40) {
    return "text-orange-500";
  }

  return "text-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${mins}m`;
}

export function AuditScore({
  overallScore,
  categoryScores,
  summary,
}: AuditScoreProps) {
  return (
    <div className="space-y-8">

      <div className="rounded-3xl border bg-card p-10">

        <div className="text-center">

          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Website Health
          </p>

          <h2
            className={`mt-4 text-7xl font-bold ${getScoreColor(
              overallScore,
            )}`}
          >
            {overallScore}
          </h2>

          <p className="mt-2 text-xl font-semibold">
            {getScoreLabel(overallScore)}
          </p>

        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Critical Issues"
          value={summary.criticalIssues}
        />

        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="High Impact"
          value={summary.highImpactFindings}
        />

        <MetricCard
          icon={<BadgeCheck className="h-6 w-6" />}
          title="Quick Wins"
          value={summary.quickWins}
        />

        <MetricCard
          icon={<Clock3 className="h-6 w-6" />}
          title="Estimated Fix Time"
          value={formatMinutes(
            summary.estimatedFixMinutes,
          )}
        />

      </div>

      <div className="rounded-3xl border bg-card p-8">

        <h3 className="mb-6 text-xl font-semibold">
          Category Scores
        </h3>

        <div className="space-y-6">

          {categoryScores.map((category) => (
            <CategoryBar
              key={category.category}
              category={category}
            />
          ))}

        </div>

      </div>

    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">

      <div className="mb-4 text-primary">
        {icon}
      </div>

      <div className="text-3xl font-bold">
        {value}
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {title}
      </div>

    </div>
  );
}

function CategoryBar({
  category,
}: {
  category: AuditCategoryScore;
}) {
  const percent =
    (category.score / category.maxScore) * 100;

  return (
    <div>

      <div className="mb-2 flex justify-between">

        <span className="font-medium">
          {category.label}
        </span>

        <span className="text-muted-foreground">
          {category.score} / {category.maxScore}
        </span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-muted">

        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${percent}%`,
          }}
        />

      </div>

    </div>
  );
}