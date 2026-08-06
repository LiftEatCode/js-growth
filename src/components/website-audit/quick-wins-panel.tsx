import {
    BadgeCheck,
    Clock3,
    Sparkles,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  
  import type {
    AuditFinding,
  } from "@/lib/website-audit/types";
  
  interface QuickWinsPanelProps {
    findings: AuditFinding[];
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
  
  export function QuickWinsPanel({
    findings,
  }: QuickWinsPanelProps) {
    const quickWins = findings
      .filter(
        (finding) =>
          finding.status !== "pass" &&
          finding.quickWin,
      )
      .sort(
        (a, b) =>
          a.estimatedFixMinutes -
          b.estimatedFixMinutes,
      );
  
    if (quickWins.length === 0) {
      return null;
    }
  
    const totalMinutes = quickWins.reduce(
      (total, finding) =>
        total + finding.estimatedFixMinutes,
      0,
    );
  
    return (
      <section className="rounded-3xl border bg-card p-8">
  
        <div className="flex items-center gap-3">
  
          <Sparkles className="h-5 w-5 text-primary" />
  
          <div>
  
            <h2 className="text-2xl font-semibold">
              Quick Wins
            </h2>
  
            <p className="text-sm text-muted-foreground">
              Easy improvements with immediate value.
            </p>
  
          </div>
  
        </div>
  
        <div className="mt-8 space-y-4">
  
          {quickWins.map((finding) => (
  
            <div
              key={finding.id}
              className="rounded-2xl border p-5"
            >
  
              <div className="flex justify-between">
  
                <div>
  
                  <div className="flex items-center gap-2">
  
                    <BadgeCheck className="h-5 w-5 text-green-500" />
  
                    <h3 className="font-semibold">
                      {finding.title}
                    </h3>
  
                  </div>
  
                  <p className="mt-2 text-sm text-muted-foreground">
                    {finding.description}
                  </p>
  
                </div>
  
                <Badge variant="outline">
  
                  <Clock3 className="mr-2 h-4 w-4" />
  
                  {formatMinutes(
                    finding.estimatedFixMinutes,
                  )}
  
                </Badge>
  
              </div>
  
              {finding.recommendation && (
  
                <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
  
                  {finding.recommendation}
  
                </div>
  
              )}
  
            </div>
  
          ))}
  
        </div>
  
        <div className="mt-8 rounded-2xl bg-primary/5 p-5">
  
          <div className="flex justify-between">
  
            <span className="font-medium">
              Estimated Time
            </span>
  
            <span className="font-bold">
  
              {formatMinutes(totalMinutes)}
  
            </span>
  
          </div>
  
        </div>
  
      </section>
    );
  }