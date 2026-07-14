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
  
  const websiteFaqs = [
    {
      question: "How much does a custom website cost?",
      answer:
        "Website pricing depends on the number of pages, content requirements, integrations, design complexity, SEO needs, and custom functionality. After discovery, JS Solutions provides a clear scope and project estimate based on what your business actually needs.",
    },
    {
      question: "How long does it take to build a website?",
      answer:
        "Most timelines depend on project size, content readiness, feedback, integrations, and technical requirements. A focused small-business website may take several weeks, while larger or more customized platforms can take longer. You will receive a project plan before development begins.",
    },
    {
      question: "Will I own the website?",
      answer:
        "Yes. Unless a separate agreement states otherwise, you will own the website content and custom work created for your project. We will also explain the accounts, services, domains, and third-party tools connected to the website.",
    },
    {
      question: "Can you redesign my existing website?",
      answer:
        "Yes. We can evaluate your current website for performance, SEO, usability, accessibility, content quality, technical limitations, and conversion issues. Based on that review, we may recommend improving the current site or rebuilding it on a stronger foundation.",
    },
    {
      question: "Do I need to provide all of the website content?",
      answer:
        "You can provide existing content, business information, service details, photos, and brand materials. JS Solutions can also help organize, rewrite, improve, or create conversion-focused and SEO-friendly website content when included in the project scope.",
    },
    {
      question: "Will the website work on mobile devices?",
      answer:
        "Yes. Every website is designed mobile-first and tested across common screen sizes. Navigation, forms, buttons, content, and calls to action are built to remain usable on phones, tablets, laptops, and desktop displays.",
    },
    {
      question: "Is SEO included with the website?",
      answer:
        "Every website includes a strong technical SEO foundation, including semantic structure, metadata, crawlable pages, performance considerations, internal linking, and search-friendly architecture. Ongoing Local SEO, content creation, link building, and Google Business Profile work may be provided as separate services.",
    },
    {
      question: "Do you provide hosting and maintenance?",
      answer:
        "JS Solutions can manage deployment, hosting configuration, monitoring, updates, technical support, and ongoing improvements. The exact maintenance and support arrangement depends on the needs of your website and business.",
    },
    {
      question: "Can the website connect to my existing business tools?",
      answer:
        "Yes. Depending on the platform and available integrations, the website can connect with CRMs, scheduling tools, email platforms, payment systems, analytics, databases, customer communication tools, and automation workflows.",
    },
    {
      question: "Can we add more features later?",
      answer:
        "Yes. The website is built with reusable components and scalable architecture so it can expand with new service pages, locations, forms, scheduling, customer portals, dashboards, reporting, automation, and other functionality.",
    },
  ] as const;
  
  export function WebsiteFAQSection() {
    return (
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeader
              eyebrow="Website FAQs"
              title="What to know before starting your website project."
              description="Clear answers about pricing, timelines, ownership, content, SEO, maintenance, integrations, and future growth."
            />
  
            <Accordion className="w-full">
              {websiteFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`website-faq-${index + 1}`}
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