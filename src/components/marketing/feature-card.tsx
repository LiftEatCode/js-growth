import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
  className,
}: FeatureCardProps) {
  const content = (
    <>
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-6" />
      </div>

      <h3 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-muted-foreground">
        {description}
      </p>

      {href ? (
        <span className="mt-5 inline-flex text-sm font-semibold text-brand">
          Explore service →
        </span>
      ) : null}
    </>
  );

  const cardClassName = cn(
    "group block h-full rounded-2xl border bg-card p-6 shadow-soft transition duration-300",
    href &&
      "hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}