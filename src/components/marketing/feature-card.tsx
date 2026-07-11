import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group rounded-2xl border border-border bg-card p-8 shadow-card",
        "transition duration-300 hover:-translate-y-1 hover:shadow-soft",
        className,
      )}
    >
      <div
        className={cn(
          "mb-6 flex size-12 items-center justify-center rounded-xl",
          "bg-blue-50 text-brand-blue transition duration-300",
          "group-hover:bg-brand-blue group-hover:text-white",
        )}
      >
        <Icon aria-hidden="true" className="size-6" />
      </div>

      <h3 className="font-heading text-xl font-semibold text-brand">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-muted">{description}</p>
    </article>
  );
}