import type {
  LucideIcon,
} from "lucide-react";

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
      className={`overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-border bg-slate-50/50 px-6 py-6 sm:px-8">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {Icon ? (
              <Icon
                aria-hidden="true"
                className="size-4"
              />
            ) : null}

            {eyebrow}
          </div>
        ) : null}

        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            {description}
          </p>
        ) : null}
      </div>

      <div className="p-6 sm:p-8">
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
    <article className="rounded-2xl border border-white/10 bg-white p-5 text-brand shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
        <Icon
          aria-hidden="true"
          className="size-5"
        />
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>

      <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-brand">
        {value}
      </p>

      {description ? (
        <p className="mt-2 text-xs leading-5 text-muted">
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
  tone?:
    | "default"
    | "primary"
    | "warning"
    | "danger"
    | "success";
}

export function InfoPanel({
  icon: Icon,
  title,
  description,
  tone = "default",
}: InfoPanelProps) {
  const toneClasses = {
    default:
      "border-border bg-slate-50/70",
    primary:
      "border-brand-blue/15 bg-brand-blue/[0.045]",
    warning:
      "border-amber-200 bg-amber-50/70",
    danger:
      "border-red-200 bg-red-50/70",
    success:
      "border-emerald-200 bg-emerald-50/70",
  }[tone];

  const iconClasses = {
    default:
      "border-border bg-white text-brand",
    primary:
      "border-brand-blue/10 bg-white text-brand-blue",
    warning:
      "border-amber-200 bg-white text-amber-600",
    danger:
      "border-red-200 bg-white text-red-600",
    success:
      "border-emerald-200 bg-white text-emerald-600",
  }[tone];

  return (
    <div
      className={`rounded-2xl border p-5 ${toneClasses}`}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${iconClasses}`}
          >
            <Icon
              aria-hidden="true"
              className="size-4"
            />
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="font-heading font-semibold text-brand">
            {title}
          </p>

          <p className="mt-1.5 text-sm leading-6 text-muted">
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
      "border-slate-200 bg-slate-50 text-slate-600",
    primary:
      "border-brand-blue/20 bg-brand-blue/[0.07] text-brand-blue",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700",
    danger:
      "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClasses}`}
    >
      {label}
    </span>
  );
}