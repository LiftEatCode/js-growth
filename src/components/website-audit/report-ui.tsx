import type {
    LucideIcon,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  
  interface ReportSectionProps {
    eyebrow?: string;
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
  }
  
  export function ReportSection({
    eyebrow,
    title,
    description,
    icon: Icon,
    children,
    className = "",
  }: ReportSectionProps) {
    return (
      <section
        className={`rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 ${className}`}
      >
        <div>
          {eyebrow ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              {Icon ? (
                <Icon
                  aria-hidden="true"
                  className="size-4"
                />
              ) : null}
  
              {eyebrow}
            </div>
          ) : null}
  
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
  
          {description ? (
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
  
        <div className="mt-6">
          {children}
        </div>
      </section>
    );
  }
  
  interface MetricCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    description?: string;
  }
  
  export function MetricCard({
    icon: Icon,
    label,
    value,
    description,
  }: MetricCardProps) {
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
  
        {description ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </article>
    );
  }
  
  interface InfoPanelProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    tone?: "default" | "primary" | "warning" | "danger";
  }
  
  export function InfoPanel({
    icon: Icon,
    title,
    description,
    tone = "default",
  }: InfoPanelProps) {
    const toneClasses = {
      default:
        "border-border bg-muted/30",
      primary:
        "border-primary/20 bg-primary/5",
      warning:
        "border-amber-500/20 bg-amber-500/5",
      danger:
        "border-destructive/20 bg-destructive/5",
    }[tone];
  
    return (
      <div
        className={`rounded-2xl border p-5 ${toneClasses}`}
      >
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
              <Icon
                aria-hidden="true"
                className="size-4"
              />
            </div>
          ) : null}
  
          <div>
            <p className="font-medium text-foreground">
              {title}
            </p>
  
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  interface StatBadgeProps {
    label: string;
    tone?:
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "danger";
  }
  
  export function StatBadge({
    label,
    tone = "default",
  }: StatBadgeProps) {
    const toneClasses = {
      default:
        "border-border bg-muted text-muted-foreground",
      primary:
        "border-primary/30 bg-primary/10 text-primary",
      success:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      warning:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      danger:
        "border-destructive/30 bg-destructive/10 text-destructive",
    }[tone];
  
    return (
      <Badge
        variant="outline"
        className={toneClasses}
      >
        {label}
      </Badge>
    );
  }