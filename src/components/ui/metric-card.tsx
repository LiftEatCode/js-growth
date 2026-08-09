import type {
    LucideIcon,
  } from "lucide-react";
  import {
    ArrowDownRight,
    ArrowUpRight,
    Minus,
  } from "lucide-react";
  
  import {
    Card,
  } from "@/components/ui/card";
  import { cn } from "@/lib/utils";
  
  type MetricCardTone =
    | "default"
    | "positive"
    | "warning"
    | "negative"
    | "brand";
  
  type MetricCardTrend =
    | "up"
    | "down"
    | "neutral";
  
  interface MetricCardProps {
    label: string;
  
    value: string | number;
  
    helper?: string;
  
    icon?: LucideIcon;
  
    tone?: MetricCardTone;
  
    trend?: MetricCardTrend;
  
    trendLabel?: string;
  
    className?: string;
  }
  
  const toneClasses: Record<
    MetricCardTone,
    {
      icon: string;
      helper: string;
    }
  > = {
    default: {
      icon:
        "border-slate-200 bg-slate-100 text-slate-600",
  
      helper:
        "text-muted",
    },
  
    positive: {
      icon:
        "border-emerald-200 bg-emerald-50 text-emerald-600",
  
      helper:
        "text-emerald-700",
    },
  
    warning: {
      icon:
        "border-amber-200 bg-amber-50 text-amber-600",
  
      helper:
        "text-amber-700",
    },
  
    negative: {
      icon:
        "border-red-200 bg-red-50 text-red-600",
  
      helper:
        "text-red-700",
    },
  
    brand: {
      icon:
        "border-brand-blue/15 bg-brand-blue/[0.07] text-brand-blue",
  
      helper:
        "text-brand-blue",
    },
  };
  
  function TrendIcon({
    trend,
  }: {
    trend: MetricCardTrend;
  }) {
    if (trend === "up") {
      return (
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5"
        />
      );
    }
  
    if (trend === "down") {
      return (
        <ArrowDownRight
          aria-hidden="true"
          className="size-3.5"
        />
      );
    }
  
    return (
      <Minus
        aria-hidden="true"
        className="size-3.5"
      />
    );
  }
  
  export function MetricCard({
    label,
    value,
    helper,
    icon: Icon,
    tone = "default",
    trend,
    trendLabel,
    className,
  }: MetricCardProps) {
    return (
      <Card
        variant="elevated"
        padding="md"
        className={cn(
          "overflow-hidden",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">
              {label}
            </p>
  
            <p className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand">
              {value}
            </p>
          </div>
  
          {Icon ? (
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                toneClasses[
                  tone
                ].icon,
              )}
            >
              <Icon
                aria-hidden="true"
                className="size-[18px]"
              />
            </span>
          ) : null}
        </div>
  
        {helper ||
        trendLabel ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {helper ? (
              <p
                className={cn(
                  "text-sm",
                  toneClasses[
                    tone
                  ].helper,
                )}
              >
                {helper}
              </p>
            ) : null}
  
            {trend &&
            trendLabel ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  trend ===
                    "up" &&
                    "bg-emerald-50 text-emerald-700",
                  trend ===
                    "down" &&
                    "bg-red-50 text-red-700",
                  trend ===
                    "neutral" &&
                    "bg-slate-100 text-slate-600",
                )}
              >
                <TrendIcon
                  trend={trend}
                />
  
                {trendLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </Card>
    );
  }