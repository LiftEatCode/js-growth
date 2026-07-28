import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { Container } from "@/components/ui";

type BlogArticleLayoutProps = {
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readingTime: string;
  children: ReactNode;
};

export function BlogArticleLayout({
  title,
  description,
  category,
  publishedAt,
  readingTime,
  children,
}: BlogArticleLayoutProps) {
  return (
    <>
      <section className="border-b border-border bg-muted/20 py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                {category}
              </span>

              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {publishedAt}
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {readingTime}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl font-heading text-4xl font-semibold tracking-tight text-brand sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">
              {description}
            </p>
          </div>
        </Container>
      </section>

      <article className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div
              className="
                space-y-7
                text-base
                leading-8
                text-muted
                sm:text-lg

                [&_h2]:mt-14
                [&_h2]:font-heading
                [&_h2]:text-3xl
                [&_h2]:font-semibold
                [&_h2]:tracking-tight
                [&_h2]:text-brand

                [&_h3]:mt-10
                [&_h3]:font-heading
                [&_h3]:text-2xl
                [&_h3]:font-semibold
                [&_h3]:text-brand

                [&_p]:leading-8

                [&_strong]:font-semibold
                [&_strong]:text-brand

                [&_a]:font-semibold
                [&_a]:text-primary
                [&_a]:underline
                [&_a]:underline-offset-4

                [&_ul]:space-y-3
                [&_ul]:pl-6
                [&_ul]:list-disc

                [&_ol]:space-y-3
                [&_ol]:pl-6
                [&_ol]:list-decimal

                [&_li]:pl-1

                [&_blockquote]:my-10
                [&_blockquote]:border-l-4
                [&_blockquote]:border-primary
                [&_blockquote]:bg-muted/30
                [&_blockquote]:px-6
                [&_blockquote]:py-5
                [&_blockquote]:font-medium
                [&_blockquote]:text-brand
              "
            >
              {children}
            </div>
          </div>
        </Container>
      </article>

      <section className="border-t border-border py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-brand px-6 py-12 text-background sm:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Ready to grow?
                </p>

                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Build a stronger digital presence for your business.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-7 text-background/70">
                  JS Solutions combines websites, Local SEO, automation, and
                  analytics into practical systems designed around your goals.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start a Conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}