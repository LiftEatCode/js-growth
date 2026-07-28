import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  Code2,
  Search,
} from "lucide-react";

import { PageHero } from "@/components/marketing";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical insights from JS Solutions about websites, Local SEO, AI automation, analytics, and digital growth for local businesses.",
};

const featuredArticle = {
  title: "Why Every Local Business Needs More Than Just a Website",
  description:
    "A website should do more than look professional. Learn how performance, Local SEO, conversion strategy, analytics, and automation work together to generate measurable business growth.",
  category: "Digital Growth",
  readTime: "7 min read",
  href: "/blog/why-local-businesses-need-more-than-a-website",
};

const articles = [
  {
    title: "What Is Local SEO and Why Does It Matter?",
    description:
      "Learn how Local SEO helps nearby customers find your business through Google Search, Maps, and your Google Business Profile.",
    category: "Local SEO",
    readTime: "6 min read",
    href: "/blog/what-is-local-seo",
    icon: Search,
  },
  {
    title: "How Much Should a Small Business Website Cost?",
    description:
      "Understand the factors that affect website pricing and what small businesses should expect from a professional website investment.",
    category: "Websites",
    readTime: "8 min read",
    href: "/blog/small-business-website-cost",
    icon: Code2,
  },
  {
    title: "How AI Automation Can Save Your Business Time",
    description:
      "Explore practical ways AI and automation can reduce repetitive work, improve follow-up, and create more consistent customer experiences.",
    category: "AI Automation",
    readTime: "7 min read",
    href: "/blog/how-ai-automation-saves-time",
    icon: Bot,
  },
  {
    title: "The Website Metrics Local Businesses Should Track",
    description:
      "Discover which analytics matter most when measuring website performance, lead generation, search visibility, and marketing results.",
    category: "Analytics",
    readTime: "6 min read",
    href: "/blog/website-metrics-local-businesses",
    icon: ChartNoAxesCombined,
  },
];

const categories = [
  "Websites",
  "Local SEO",
  "AI Automation",
  "Business Systems",
  "Analytics",
  "Digital Growth",
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Websites, SEO, AI, and automation explained."
        description="Practical insights for local businesses that want stronger online visibility, better technology, smarter workflows, and more consistent lead generation."
      />

      <Section className="border-b border-border">
        <Container>
          <div className="grid gap-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                  Featured
                </span>

                <span className="text-muted">
                  {featuredArticle.category}
                </span>

                <span className="text-muted" aria-hidden="true">
                  •
                </span>

                <span className="text-muted">
                  {featuredArticle.readTime}
                </span>
              </div>

              <h2 className="mt-6 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
                {featuredArticle.title}
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                {featuredArticle.description}
              </p>

              <div className="mt-8">
                <Link
                  href={featuredArticle.href}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Read Article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-muted/40 p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ChartNoAxesCombined className="h-8 w-8" />
                </div>

                <p className="mt-6 font-heading text-xl font-semibold text-brand">
                  Strategy backed by technology
                </p>

                <p className="mt-3 text-sm leading-6 text-muted">
                  Practical guidance designed to help local businesses make
                  smarter decisions about websites, marketing, automation, and
                  growth.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border bg-muted/20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Latest insights
              </p>

              <h2 className="mt-4 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
                Practical guidance for growing local businesses
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                Explore strategies covering website performance, Local SEO,
                automation, analytics, lead generation, and business
                technology.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Suggest a topic
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {articles.map((article) => {
              const Icon = article.icon;

              return (
                <article
                  key={article.title}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-sm text-muted">
                      {article.readTime}
                    </span>
                  </div>

                  <p className="mt-6 text-sm font-semibold text-primary">
                    {article.category}
                  </p>

                  <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand">
                    {article.title}
                  </h3>

                  <p className="mt-4 flex-1 text-sm leading-7 text-muted">
                    {article.description}
                  </p>

                  <Link
                    href={article.href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors group-hover:text-primary"
                  >
                    Read Article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Explore topics
              </p>

              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
                Find the information your business needs
              </h2>

              <p className="mt-5 text-base leading-7 text-muted">
                Browse insights across the core areas that influence local
                visibility, operational efficiency, customer acquisition, and
                long-term business growth.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-card"
                >
                  <span className="font-medium text-brand">{category}</span>

                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="overflow-hidden rounded-3xl border border-border bg-brand px-6 py-12 text-background sm:px-10 lg:px-16 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Need help growing?
                </p>

                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Turn these strategies into results for your business.
                </h2>

                <p className="mt-5 text-base leading-7 text-background/70 sm:text-lg">
                  JS Solutions combines modern websites, Local SEO, AI,
                  automation, and analytics into practical systems built around
                  your goals.
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
      </Section>
    </>
  );
}