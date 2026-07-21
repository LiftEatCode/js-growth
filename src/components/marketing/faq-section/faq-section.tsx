import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import { Container, Section, SectionHeader } from "@/components/ui";
  
  import type { FAQSectionProps } from "./types";
  
  export function FAQSection({
    eyebrow,
    title,
    description,
    items,
    className,
  }: FAQSectionProps) {
    return (
      <Section className={className}>
        <Container>
          <div className="mx-auto max-w-4xl">
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              align="center"
            />
  
            <Accordion className="mt-12 w-full">
              {items.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index + 1}`}
                  className="border-border"
                >
                  <AccordionTrigger className="text-left font-heading text-base font-semibold text-brand sm:text-lg">
                    {item.question}
                  </AccordionTrigger>
  
                  <AccordionContent className="pr-6 text-base leading-7 text-muted">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>
    );
  }