import type { LucideIcon } from "lucide-react";

interface AuditKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
}

export function AuditKpiCard({
  icon: Icon,
  label,
  value,
  description,
}: AuditKpiCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
      </div>

      {description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </article>
  );
}