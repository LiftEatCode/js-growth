import type { Metadata } from "next";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Search,
  Workflow,
} from "lucide-react";

import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/marketing";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact JS Solutions to discuss your website, Local SEO, AI automation, digital marketing, or business growth project.",
};

const services = [
  {
    title: "Websites",
    description:
      "High-performance websites designed to build trust and convert visitors into customers.",
    icon: Globe2,
  },
  {
    title: "Local SEO",
    description:
      "Improve your local visibility and help nearby customers find your business.",
    icon: Search,
  },
  {
    title: "AI Automation",
    description:
      "Use AI and automation to respond faster, reduce manual work, and improve operations.",
    icon: Bot,
  },
  {
    title: "Business Systems",
    description:
      "Connect workflows, marketing, reporting, and customer communication into one system.",
    icon: Workflow,
  },
  {
    title: "Analytics",
    description:
      "Understand where leads come from and which marketing efforts are producing results.",
    icon: BarChart3,
  },
];

const nextSteps = [
  "We review your business, goals, and current challenges.",
  "We identify the highest-impact opportunities.",
  "You receive a clear recommendation and next-step plan.",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact JS Solutions"
        title="Let’s build a better growth system for your business."
        description="Tell us what you are working on, where your business is getting stuck, and what you want to accomplish. We will help identify the right website, Local SEO, automation, or marketing solution."
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                  Start a conversation
                </p>

                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
                  Tell us about your business.
                </h2>

                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Complete the form below and provide as much detail as you can.
                  We will review your request and follow up with practical next
                  steps.
                </p>
              </div>

              <ContactForm />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-muted/40 p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  What happens next?
                </h2>

                <div className="mt-6 space-y-5">
                  {nextSteps.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-foreground p-6 text-background">
                <h2 className="font-heading text-xl font-semibold">
                  Prefer email?
                </h2>

                <p className="mt-3 text-sm leading-6 text-background/70">
                  Send your project details directly and we will get back to
                  you as soon as possible.
                </p>

                <a
                  href="mailto:jssolutions.tx@gmail.com"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
                >
                  <Mail className="size-4" />
                  jssolutions.tx@gmail.com
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-brand" />

                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Based in Texas
                  </h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Helping local businesses build stronger websites, better
                  visibility, and more efficient systems.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container>
          <SectionHeader
            eyebrow="How We Help"
            title="One partner for your digital growth."
            description="JS Solutions combines software engineering, marketing strategy, Local SEO, automation, and analytics into practical business systems."
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5 text-foreground" />
                  </div>

                  <h3 className="mt-5 font-heading text-xl font-semibold text-foreground">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 rounded-3xl bg-foreground px-6 py-10 text-background sm:px-10 lg:grid-cols-2 lg:items-center lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-background/60">
                Built for local businesses
              </p>

              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Practical strategy. Modern technology. Clear results.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-background/70">
                You do not need disconnected tools or vague marketing advice.
                You need a system that helps your business get found, respond
                faster, build trust, and generate more opportunities.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Clear recommendations based on your goals",
                "Modern, scalable technology",
                "Solutions designed around your workflow",
                "Ongoing optimization and measurable reporting",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-background" />

                  <p className="text-sm leading-6 text-background/80">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}