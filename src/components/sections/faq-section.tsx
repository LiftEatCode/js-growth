import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const faqs = [
    {
      question: "What types of businesses does JS Solutions work with?",
      answer:
        "JS Solutions primarily works with local and service-based businesses, including automotive shops, contractors, restaurants, medical offices, professional services, and companies that want to generate more leads online.",
    },
    {
      question: "What makes JS Solutions different from a traditional marketing agency?",
      answer:
        "JS Solutions combines marketing strategy with senior-level software engineering. We do not just run campaigns. We build high-performance websites, automation systems, AI integrations, analytics, and scalable digital infrastructure around your business.",
    },
    {
      question: "Can you improve my existing website?",
      answer:
        "Yes. We can evaluate your existing website for performance, usability, SEO, accessibility, conversion issues, and technical problems. Depending on its condition, we may recommend optimizing it or rebuilding it on a stronger foundation.",
    },
    {
      question: "How does Local SEO help my business?",
      answer:
        "Local SEO helps your business appear when nearby customers search for your services. This includes improving your website, service pages, location relevance, Google Business Profile, citations, reviews, and overall local search visibility.",
    },
    {
      question: "What kinds of AI and automation solutions do you build?",
      answer:
        "We build practical systems such as lead follow-up workflows, customer communication tools, internal business automation, AI-assisted content processes, reporting systems, CRM integrations, and custom workflows designed around how your business operates.",
    },
    {
      question: "Will I be able to expand the website later?",
      answer:
        "Yes. The website is being built with clean architecture and reusable components so it can expand into client portals, dashboards, scheduling, CRM integrations, reporting systems, secure authentication, and other future features.",
    },
    {
      question: "How long does a website project take?",
      answer:
        "The timeline depends on the size, content, integrations, and technical requirements of the project. After the discovery phase, we provide a clear scope, project plan, and estimated timeline before development begins.",
    },
    {
      question: "Do you provide ongoing support and marketing services?",
      answer:
        "Yes. JS Solutions can provide ongoing website improvements, Local SEO, content marketing, social media management, analytics, automation support, and digital strategy after the initial project launches.",
    },
  ] as const;
  
  export function FAQSection() {
    return (
      <Section className="bg-background">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeader
              eyebrow="Frequently Asked Questions"
              title="Clear answers before we get started."
              description="Learn more about how JS Solutions builds websites, marketing systems, AI integrations, and automation for growing businesses."
            />
  
            <Accordion
              className="w-full"
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index + 1}`}
                  className="border-border"
                >
                  <AccordionTrigger className="text-left font-heading text-base font-semibold text-brand hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
  
                  <AccordionContent className="pr-6 text-base leading-7 text-muted">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>
    );
  }