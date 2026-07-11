import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  category: string;
  results?: readonly string[];
  className?: string;
};

export function ProjectCard({
  title,
  description,
  href,
  category,
  results = [],
  className,
}: ProjectCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-border bg-card shadow-card",
        "transition duration-300 hover:-translate-y-1 hover:shadow-soft",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.5),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.25),transparent_35%)]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-2xl font-semibold text-white/90">
            {title}
          </span>
        </div>
      </div>

      <div className="p-7">
        <Badge variant="secondary">{category}</Badge>

        <h3 className="mt-4 font-heading text-2xl font-semibold text-brand">
          <Link
            href={href}
            className="inline-flex items-center gap-2"
          >
            {title}

            <ArrowUpRight
              aria-hidden="true"
              className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </h3>

        <p className="mt-3 leading-7 text-muted">{description}</p>

        {results.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Project results">
            {results.map((result) => (
              <li
                key={result}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted"
              >
                {result}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}