import {
    Sparkles,
    TrendingUp,
  } from "lucide-react";
  
  import type {
    ExecutiveSummary,
  } from "@/lib/website-audit/executive-summary";
  
  interface Props {
    summary: ExecutiveSummary;
  }
  
  function formatMinutes(
    minutes: number,
  ) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
  
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
  
    if (!m) {
      return `${h} hours`;
    }
  
    return `${h}h ${m}m`;
  }
  
  export function ExecutiveSummaryCard({
    summary,
  }: Props) {
    return (
      <section className="rounded-3xl border bg-gradient-to-br from-primary/5 to-background p-8">
  
        <div className="flex items-center gap-3">
  
          <Sparkles className="h-6 w-6 text-primary" />
  
          <div>
  
            <p className="text-sm uppercase tracking-wider text-primary">
              AI Executive Summary
            </p>
  
            <h2 className="text-3xl font-bold">
              {summary.heading}
            </h2>
  
          </div>
  
        </div>
  
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {summary.summary}
        </p>
  
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
  
          <div>
  
            <h3 className="mb-4 font-semibold">
              What&apos;s Working Well
            </h3>
  
            <ul className="space-y-2">
  
              {summary.strengths.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4 text-green-500" />
  
                  {item}
                </li>
              ))}
  
            </ul>
  
          </div>
  
          <div>
  
            <h3 className="mb-4 font-semibold">
              Top Priorities
            </h3>
  
            <ul className="space-y-2">
  
              {summary.priorities.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
  
                  {item}
                </li>
              ))}
  
            </ul>
  
          </div>
  
        </div>
  
        <div className="mt-8 rounded-2xl bg-background p-5">
  
          Estimated implementation time
  
          <div className="mt-2 text-3xl font-bold">
  
            {formatMinutes(
              summary.estimatedFixMinutes,
            )}
  
          </div>
  
        </div>
  
      </section>
    );
  }