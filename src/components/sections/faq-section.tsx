import {
  CircleHelp,
  Sparkles,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";

const faqs = [
  {
    question:
      "What types of businesses does JS Solutions work with?",
    answer:
      "JS Solutions primarily works with local and service-based businesses, including automotive shops, contractors, restaurants, medical offices, professional services, and companies that want to generate more leads online.",
  },
  {
    question:
      "What makes JS Solutions different from a traditional marketing agency?",
    answer:
      "JS Solutions combines marketing strategy with senior-level software engineering. We do not just run campaigns. We build high-performance websites, automation systems, AI integrations, analytics, and scalable digital infrastructure around your business.",
  },
  {
    question:
      "Can you improve my existing website?",
    answer:
      "Yes. We can evaluate your existing website for performance, usability, SEO, accessibility, conversion issues, and technical problems. Depending on its condition, we may recommend optimizing it or rebuilding it on a stronger foundation.",
  },
  {
    question:
      "How does Local SEO help my business?",
    answer:
      "Local SEO helps your business appear when nearby customers search for your services. This includes improving your website, service pages, location relevance, Google Business Profile, citations, reviews, and overall local search visibility.",
  },
  {
    question:
      "What kinds of AI and automation solutions do you build?",
    answer:
      "We build practical systems such as lead follow-up workflows, customer communication tools, internal business automation, AI-assisted content processes, reporting systems, CRM integrations, and custom workflows designed around how your business operates.",
  },
  {
    question:
      "Will I be able to expand the website later?",
    answer:
      "Yes. The website is being built with clean architecture and reusable components so it can expand into client portals, dashboards, scheduling, CRM integrations, reporting systems, secure authentication, and other future features.",
  },
  {
    question:
      "How long does a website project take?",
    answer:
      "The timeline depends on the size, content, integrations, and technical requirements of the project. After the discovery phase, we provide a clear scope, project plan, and estimated timeline before development begins.",
  },
  {
    question:
      "Do you provide ongoing support and marketing services?",
    answer:
      "Yes. JS Solutions can provide ongoing website improvements, Local SEO, content marketing, social media management, analytics, automation support, and digital strategy after the initial project launches.",
  },
] as const;

export function FAQSection() {
  return (
    <Section className="relative overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="absolute -right-40 top-0 -z-10 size-[32rem] rounded-full bg-brand-blue/[0.04] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -left-48 bottom-0 -z-10 size-[28rem] rounded-full bg-brand-cyan/[0.035] blur-3xl"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              <Sparkles
                aria-hidden="true"
                className="size-3.5"
              />

              Frequently Asked Questions
            </div>

            <SectionHeader
              title="Clear answers before we get started."
              description="Learn more about how JS Solutions builds websites, marketing systems, AI integrations, and automation for growing businesses."
              className="mt-5"
            />

            <Card
              variant="brand"
              padding="md"
              className="mt-8"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue shadow-sm">
                  <CircleHelp
                    aria-hidden="true"
                    className="size-[18px]"
                  />
                </span>

                <div>
                  <p className="text-sm font-semibold text-brand">
                    Still have a question?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted">
                    Every business is different. We can discuss your goals,
                    current systems, and where the biggest opportunities may
                    exist.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card
            variant="elevated"
            padding="none"
            className="overflow-hidden"
          >
            <Accordion className="w-full">
              {faqs.map(
                (faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${index + 1}`}
                    className="border-border px-6 last:border-b-0 sm:px-7"
                  >
                    <AccordionTrigger className="py-6 text-left font-heading text-base font-semibold leading-6 text-brand hover:no-underline sm:text-lg">
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent className="max-w-2xl pb-6 pr-6 text-base leading-7 text-muted">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ),
              )}
            </Accordion>
          </Card>
        </div>
      </Container>
    </Section>
  );
}