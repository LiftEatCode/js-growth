import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Gauge,
  Globe2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  Button,
  Card,
  Container,
  FeatureCard,
  GlassCard,
  GridPattern,
  MetricCard,
  Section,
} from "@/components/ui";

const serviceExamples = [
  {
    icon: Globe2,
    title: "Website Development",
    description:
      "High-performance websites designed to turn traffic into qualified leads.",
    href: "/websites",
    eyebrow: "Web",
    tone: "default" as const,
  },
  {
    icon: MapPin,
    title: "Local SEO",
    description:
      "Improve local visibility and help nearby customers find your business.",
    href: "/local-seo",
    eyebrow: "Search",
    tone: "brand" as const,
  },
  {
    icon: Bot,
    title: "AI Automation",
    description:
      "Automate repetitive workflows and build smarter internal systems.",
    href: "/ai-automation",
    eyebrow: "AI",
    tone: "default" as const,
  },
  {
    icon: Code2,
    title: "Custom Software",
    description:
      "Purpose-built software for business processes that generic tools cannot handle.",
    href: "/services",
    eyebrow: "Software",
    tone: "dark" as const,
  },
];

export default function StyleGuidePage() {
  return (
    <main className="relative overflow-hidden bg-background">
      <section className="relative border-b border-border bg-brand text-white">
        <GridPattern />

        <Container className="relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              JS Solutions UI System
            </p>

            <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Product design language
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Internal reference for typography, buttons, cards, metrics,
              icons, spacing, and interaction patterns used across JS
              Solutions.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/website-audit" />}
              >
                Run Website Audit

                <ArrowRight
                  aria-hidden="true"
                  className="ml-2 size-4"
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/" />}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                View Website
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <StyleSectionHeader
            eyebrow="Foundation"
            title="Typography"
            description="Primary type hierarchy for marketing pages, product interfaces, and internal dashboards."
          />

          <Card
            variant="elevated"
            padding="lg"
            className="mt-12"
          >
            <div className="space-y-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Hero
                </p>

                <p className="mt-3 font-heading text-5xl font-bold tracking-tight text-brand sm:text-6xl">
                  Grow with better systems.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Heading 1
                </p>

                <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-brand">
                  Website Growth Intelligence
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Heading 2
                </p>

                <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand">
                  Understand what is holding your website back.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Heading 3
                </p>

                <p className="mt-3 font-heading text-xl font-semibold text-brand">
                  Priority growth opportunities
                </p>
              </div>

              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Body Large
                </p>

                <p className="mt-3 text-lg leading-8 text-foreground">
                  Clear business language should explain what matters, why it
                  matters, and what should happen next without overwhelming the
                  reader with unnecessary technical detail.
                </p>
              </div>

              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Body
                </p>

                <p className="mt-3 leading-7 text-muted">
                  Supporting copy should stay readable, concise, and practical.
                  Long paragraphs should be avoided whenever information can be
                  presented more clearly through hierarchy and spacing.
                </p>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <StyleSectionHeader
            eyebrow="Actions"
            title="Buttons"
            description="Primary, secondary, outline, ghost, and link treatments for common actions."
          />

          <Card
            variant="elevated"
            padding="lg"
            className="mt-12"
          >
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg">
                Primary Action

                <ArrowRight
                  aria-hidden="true"
                  className="ml-2 size-4"
                />
              </Button>

              <Button
                size="lg"
                variant="secondary"
              >
                Secondary
              </Button>

              <Button
                size="lg"
                variant="outline"
              >
                Outline
              </Button>

              <Button
                size="lg"
                variant="ghost"
              >
                Ghost
              </Button>

              <Button
                size="lg"
                variant="link"
              >
                Learn More
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="sm">
                Small
              </Button>

              <Button>
                Default
              </Button>

              <Button size="lg">
                Large
              </Button>

              <Button size="xl">
                Extra Large
              </Button>
            </div>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container>
          <StyleSectionHeader
            eyebrow="Surfaces"
            title="Card system"
            description="Core surface treatments used throughout public pages, reports, dashboards, and internal tools."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card
              variant="default"
              padding="md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Default
              </p>

              <h3 className="mt-3 font-heading text-xl font-semibold text-brand">
                Standard surface
              </h3>

              <p className="mt-2 leading-7 text-muted">
                Used for clean content blocks without unnecessary visual weight.
              </p>
            </Card>

            <Card
              variant="subtle"
              padding="md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Subtle
              </p>

              <h3 className="mt-3 font-heading text-xl font-semibold text-brand">
                Soft contrast
              </h3>

              <p className="mt-2 leading-7 text-muted">
                Useful for grouped information, supporting panels, and secondary
                content.
              </p>
            </Card>

            <Card
              variant="elevated"
              padding="md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Elevated
              </p>

              <h3 className="mt-3 font-heading text-xl font-semibold text-brand">
                Important content
              </h3>

              <p className="mt-2 leading-7 text-muted">
                Adds shadow and stronger separation for priority interface
                elements.
              </p>
            </Card>

            <Card
              variant="brand"
              padding="md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Brand
              </p>

              <h3 className="mt-3 font-heading text-xl font-semibold text-brand">
                Highlighted surface
              </h3>

              <p className="mt-2 leading-7 text-muted">
                Introduces subtle blue emphasis without turning the card into a
                banner.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <StyleSectionHeader
            eyebrow="Capabilities"
            title="Feature cards"
            description="Reusable discovery cards for services, products, capabilities, audit categories, and dashboard shortcuts."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {serviceExamples.map((service) => (
              <FeatureCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
                linkLabel="Explore"
                eyebrow={service.eyebrow}
                tone={service.tone}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <StyleSectionHeader
            eyebrow="Data"
            title="Metric cards"
            description="Standard presentation for audits, reports, dashboards, client analytics, and performance summaries."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Website Score"
              value="82"
              helper="Strong foundation"
              icon={Gauge}
              tone="brand"
              trend="up"
              trendLabel="+6 pts"
            />

            <MetricCard
              label="Growth Opportunity"
              value="91"
              helper="High potential"
              icon={TrendingUp}
              tone="positive"
              trend="up"
              trendLabel="+12%"
            />

            <MetricCard
              label="Critical Issues"
              value="3"
              helper="Needs attention"
              icon={Search}
              tone="negative"
              trend="down"
              trendLabel="-2 issues"
            />

            <MetricCard
              label="Quick Wins"
              value="8"
              helper="Low effort"
              icon={CheckCircle2}
              tone="positive"
              trend="neutral"
              trendLabel="Ready"
            />
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-brand text-white">
        <Container>
          <StyleSectionHeader
            eyebrow="Glass"
            title="Glass surfaces"
            description="Reserved for dark sections, hero overlays, floating panels, and premium product previews."
            dark
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <GlassCard
              tone="dark"
              padding="lg"
              interactive
            >
              <div className="flex items-start justify-between gap-5">
                <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300">
                  <Sparkles
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>

                <ArrowRight
                  aria-hidden="true"
                  className="size-5 text-white/30"
                />
              </div>

              <h3 className="mt-6 font-heading text-xl font-semibold text-white">
                Dark glass
              </h3>

              <p className="mt-2 leading-7 text-slate-300">
                Intended for dark hero sections, AI product previews, and
                elevated product experiences.
              </p>
            </GlassCard>

            <div className="rounded-3xl bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-5">
              <GlassCard
                tone="light"
                padding="lg"
                interactive
              >
                <div className="flex items-start justify-between gap-5">
                  <span className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                    <Globe2
                      aria-hidden="true"
                      className="size-5"
                    />
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="size-5 text-slate-300"
                  />
                </div>

                <h3 className="mt-6 font-heading text-xl font-semibold text-brand">
                  Light glass
                </h3>

                <p className="mt-2 leading-7 text-muted">
                  Useful for floating panels, dashboard previews, and layered
                  interfaces over subtle gradients.
                </p>
              </GlassCard>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <StyleSectionHeader
            eyebrow="Iconography"
            title="Core icon language"
            description="Lucide remains the default icon system across the public website and product interfaces."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <IconExample
              icon={Globe2}
              label="Websites"
            />

            <IconExample
              icon={Search}
              label="SEO"
            />

            <IconExample
              icon={MapPin}
              label="Local SEO"
            />

            <IconExample
              icon={Bot}
              label="AI"
            />

            <IconExample
              icon={Gauge}
              label="Analytics"
            />

            <IconExample
              icon={Code2}
              label="Software"
            />
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-brand text-white">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                />

                CTA Pattern
              </div>

              <h2 className="mt-4 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Find the biggest opportunities hiding in your website.
              </h2>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Run a Website Growth Audit to identify SEO, performance,
                technical, accessibility, and conversion opportunities.
              </p>
            </div>

            <Button
              size="xl"
              nativeButton={false}
              render={<Link href="/website-audit" />}
            >
              Free Website Audit

              <TrendingUp
                aria-hidden="true"
                className="ml-2 size-4"
              />
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  );
}

interface StyleSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}

function StyleSectionHeader({
  eyebrow,
  title,
  description,
  dark = false,
}: StyleSectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p
        className={
          dark
            ? "text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300"
            : "text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue"
        }
      >
        {eyebrow}
      </p>

      <h2
        className={
          dark
            ? "mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
            : "mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl"
        }
      >
        {title}
      </h2>

      <p
        className={
          dark
            ? "mt-4 text-lg leading-8 text-slate-300"
            : "mt-4 text-lg leading-8 text-muted"
        }
      >
        {description}
      </p>
    </div>
  );
}

interface IconExampleProps {
  icon: typeof Globe2;
  label: string;
}

function IconExample({
  icon: Icon,
  label,
}: IconExampleProps) {
  return (
    <Card
      variant="elevated"
      padding="md"
      interactive
      className="flex flex-col items-center justify-center text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
        <Icon
          aria-hidden="true"
          className="size-5"
        />
      </span>

      <p className="mt-3 text-sm font-medium text-brand">
        {label}
      </p>
    </Card>
  );
}