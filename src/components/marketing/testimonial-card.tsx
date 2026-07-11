import { Quote } from "lucide-react";

import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  className?: string;
};

export function TestimonialCard({
  quote,
  name,
  role,
  company,
  className,
}: TestimonialCardProps) {
  const attribution = [role, company].filter(Boolean).join(", ");

  return (
    <figure
      className={cn(
        "rounded-2xl border border-border bg-card p-8 shadow-card",
        className,
      )}
    >
      <Quote aria-hidden="true" className="size-8 text-brand-blue" />

      <blockquote className="mt-6 text-lg leading-8 text-foreground">
        “{quote}”
      </blockquote>

      <figcaption className="mt-6">
        <p className="font-heading font-semibold text-brand">{name}</p>

        {attribution ? (
          <p className="mt-1 text-sm text-muted">{attribution}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}