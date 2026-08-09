import Link from "next/link";
import type {
  LucideIcon,
} from "lucide-react";
import {
  ArrowRight,
} from "lucide-react";

import {
  Card,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureCardTone =
  | "default"
  | "brand"
  | "dark";

interface FeatureCardProps {
  title: string;

  description: string;

  icon: LucideIcon;

  href?: string;

  linkLabel?: string;

  eyebrow?: string;

  tone?: FeatureCardTone;

  className?: string;
}

const toneClasses: Record<
  FeatureCardTone,
  {
    card: string;
    icon: string;
    eyebrow: string;
    title: string;
    description: string;
    arrow: string;
  }
> = {
  default: {
    card:
      "",

    icon:
      "border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue",

    eyebrow:
      "text-brand-blue",

    title:
      "text-brand",

    description:
      "text-muted",

    arrow:
      "text-slate-300 group-hover/card:text-brand-blue",
  },

  brand: {
    card:
      "border-brand-blue/15 bg-brand-blue/[0.035]",

    icon:
      "border-brand-blue/15 bg-white text-brand-blue",

    eyebrow:
      "text-brand-blue",

    title:
      "text-brand",

    description:
      "text-muted",

    arrow:
      "text-brand-blue/40 group-hover/card:text-brand-blue",
  },

  dark: {
    card:
      "border-white/10 bg-brand text-white shadow-card",

    icon:
      "border-white/10 bg-white/[0.08] text-cyan-300",

    eyebrow:
      "text-cyan-300",

    title:
      "text-white",

    description:
      "text-slate-300",

    arrow:
      "text-white/30 group-hover/card:text-cyan-300",
  },
};

function FeatureCardContent({
  title,
  description,
  icon: Icon,
  linkLabel,
  eyebrow,
  tone,
}: Required<
  Pick<
    FeatureCardProps,
    | "title"
    | "description"
    | "icon"
    | "tone"
  >
> &
  Pick<
    FeatureCardProps,
    | "linkLabel"
    | "eyebrow"
  >) {
  const styles =
    toneClasses[tone];

  return (
    <>
      <div className="flex items-start justify-between gap-5">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border transition duration-200",
            styles.icon,
          )}
        >
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </span>

        <ArrowRight
          aria-hidden="true"
          className={cn(
            "mt-1 size-5 shrink-0 transition duration-200 group-hover/card:translate-x-1",
            styles.arrow,
          )}
        />
      </div>

      <div className="mt-6">
        {eyebrow ? (
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.16em]",
              styles.eyebrow,
            )}
          >
            {eyebrow}
          </p>
        ) : null}

        <h3
          className={cn(
            "font-heading text-xl font-semibold tracking-tight",
            eyebrow
              ? "mt-2"
              : "",
            styles.title,
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "mt-2 leading-7",
            styles.description,
          )}
        >
          {description}
        </p>

        {linkLabel ? (
          <div
            className={cn(
              "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold",
              tone ===
                "dark"
                ? "text-cyan-300"
                : "text-brand-blue",
            )}
          >
            {linkLabel}

            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover/card:translate-x-0.5"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  href,
  linkLabel,
  eyebrow,
  tone = "default",
  className,
}: FeatureCardProps) {
  const styles =
    toneClasses[tone];

  const card = (
    <Card
      variant={
        tone === "dark"
          ? "default"
          : tone === "brand"
            ? "brand"
            : "elevated"
      }
      padding="lg"
      interactive={
        Boolean(href)
      }
      className={cn(
        "group/card h-full overflow-hidden",
        styles.card,
        className,
      )}
    >
      <FeatureCardContent
        title={title}
        description={
          description
        }
        icon={icon}
        linkLabel={
          linkLabel
        }
        eyebrow={
          eyebrow
        }
        tone={tone}
      />
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/15"
    >
      {card}
    </Link>
  );
}