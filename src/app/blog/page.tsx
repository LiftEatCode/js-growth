import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Clock3,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { CTASection } from "@/components/marketing";
import {
  Button,
  Card,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";
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
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[48rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-1/3 -z-10 size-[30rem] rounded-full bg-brand-cyan/15 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <Newspaper
                aria-hidden="true"
                className="size-4"
              />

              Business Growth Insights
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Practical strategies for growing a local business.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Explore useful ideas about websites, Local SEO, automation,
              analytics, marketing, and the systems that support business
              growth.
            </p>
          </div>
        </Container>
      </section>

      {featuredPost ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Featured Insight"
              title="Start with our latest growth strategy."
              description="Practical guidance designed to help small businesses improve visibility, generate leads, and build stronger digital systems."
            />

            <Card
              variant="elevated"
              padding="none"
              interactive
              className="group mt-12 overflow-hidden"
            >
              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="relative flex min-h-64 items-end overflow-hidden bg-gradient-to-br from-slate-950 via-brand to-blue-950 p-8 text-white sm:p-10">
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-blue/30 blur-3xl"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute -bottom-20 -left-16 size-48 rounded-full bg-brand-cyan/15 blur-3xl"
                  />

                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-300">
                      <Sparkles
                        aria-hidden="true"
                        className="size-3.5"
                      />

                      Featured Article
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      {featuredPost.category}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                      <Clock3
                        aria-hidden="true"
                        className="size-4"
                      />

                      {featuredPost.readingTime}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-8 sm:p-10 lg:p-12">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
                    {featuredPost.description}
                  </p>

                  <div className="mt-auto pt-8">
                    <Button
                      size="lg"
                      nativeButton={false}
                      render={
                        <Link href={`/blog/${featuredPost.slug}`} />
                      }
                    >
                      Read Featured Article

                      <ArrowRight
                        aria-hidden="true"
                        className="ml-1 size-4"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Container>
        </Section>
      ) : null}

      {remainingPosts.length > 0 ? (
        <Section className="border-y border-border bg-slate-50/60">
          <Container>
            <SectionHeader
              eyebrow="More Insights"
              title="Ideas you can actually use."
              description="Explore practical guidance around websites, Local SEO, AI, automation, analytics, marketing, and business growth."
              align="center"
              className="mx-auto max-w-3xl"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
                <Card
                  key={post.slug}
                  variant="elevated"
                  padding="lg"
                  interactive
                  className="group flex h-full flex-col"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3 py-1.5 text-brand-blue">
                      {post.category}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <Clock3
                        aria-hidden="true"
                        className="size-3.5"
                      />

                      {post.readingTime}
                    </span>
                  </div>

                  <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-brand">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-brand-blue"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-4 flex-1 leading-7 text-muted">
                    {post.description}
                  </p>

                  <div className="mt-7 border-t border-border pt-5">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue"
                    >
                      Read article

                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </Card>
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