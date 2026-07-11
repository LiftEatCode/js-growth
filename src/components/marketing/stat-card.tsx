import { cn } from "@/lib/utils";

type StatCardProps = {
  value: string;
  label: string;
  description?: string;
  className?: string;
};

export function StatCard({
  value,
  label,
  description,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-card",
        className,
      )}
    >
      <p className="font-heading text-4xl font-bold tracking-tight text-brand-blue">
        {value}
      </p>

      <h3 className="mt-3 font-heading text-lg font-semibold text-brand">
        {label}
      </h3>

      {description ? (
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </article>
  );
}