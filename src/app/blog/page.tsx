import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { CTASection } from "@/components/marketing";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { blogPosts } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Business Growth Insights",
  description:
    "Practical insights about websites, Local SEO, AI automation, analytics, and digital growth for local businesses.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const featuredPost =
    blogPosts.find((post) => post.featured) ?? blogPosts[0];

  const remainingPosts = featuredPost
    ? blogPosts.filter((post) => post.slug !== featuredPost.slug)
    : [];

  return (
    <>
      <Section className="overflow-hidden pt-28 sm:pt-32">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Insights
            </p>

            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Practical strategies for growing a local business
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
              Explore actionable ideas about websites, Local SEO, automation,
              analytics, and modern digital growth.
            </p>
          </div>
        </Container>
      </Section>

      {featuredPost ? (
        <Section className="pt-4 sm:pt-8">
          <Container>
            <article className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10 lg:p-12">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="rounded-full border border-border bg-background px-3 py-1 font-medium text-foreground">
                    {featuredPost.category}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {featuredPost.readingTime}
                  </span>
                </div>

                <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="transition-colors hover:text-brand"
                  >
                    {featuredPost.title}
                  </Link>
                </h2>

                <p className="mt-5 text-lg leading-8 text-muted">
                  {featuredPost.description}
                </p>

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-brand transition-transform group-hover:translate-x-1"
                >
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </Container>
        </Section>
      ) : null}

      {remainingPosts.length > 0 ? (
        <Section>
          <Container>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="font-medium text-brand">
                      {post.category}
                    </span>

                    <span aria-hidden="true">•</span>

                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-foreground">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-brand"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-4 flex-1 leading-7 text-muted">
                    {post.description}
                  </p>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-6 inline-flex items-center gap-2 font-semibold text-brand transition-transform group-hover:translate-x-1"
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Ready to build a stronger digital growth system?"
        description="Let’s create a website, SEO strategy, and automation system designed around your business goals."
        primaryLabel="Start Your Project"
        primaryHref="/contact"
        secondaryLabel="View Services"
        secondaryHref="/services"
      />
    </>
  );
}