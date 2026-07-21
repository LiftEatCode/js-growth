import { FeatureCard } from "@/components/marketing/feature-card";
import { Container, Section, SectionHeader } from "@/components/ui";

import type { BenefitsSectionProps } from "./types";

export function BenefitsSection({
  eyebrow,
  title,
  description,
  items,
  className,
}: BenefitsSectionProps) {
  return (
    <Section className={className}>
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}