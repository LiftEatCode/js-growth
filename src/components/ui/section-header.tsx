import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  className,
}: SectionHeaderProps) {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "max-w-3xl",
        isCentered && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl md:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-5 text-base leading-7 text-muted sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}

      {actions ? (
        <div
          className={cn(
            "mt-7 flex flex-wrap gap-4",
            isCentered && "justify-center",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}