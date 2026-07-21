import { Container, Section, SectionHeader } from "@/components/ui";

import type { IndustriesSectionProps } from "./types";

export function IndustriesSection({
  eyebrow,
  title,
  description,
  items,
  className,
}: IndustriesSectionProps) {
  return (
    <Section className={className}>
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-lg"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </div>

                <h3 className="font-heading text-xl font-semibold tracking-tight text-brand">
                  {item.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-muted">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}