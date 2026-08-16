import type { ReactNode } from "react";

import { Container, Section } from "@/components/ui";
import {
  POLICY_LAST_UPDATED_DISPLAY,
  POLICY_LAST_UPDATED_ISO,
} from "@/content/legal/policy-meta";

interface LegalDocumentProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export function LegalDocument({ title, intro, children }: LegalDocumentProps) {
  return (
    <Section spacing="sm" className="bg-slate-50/50">
      <Container>
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-border pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Legal
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-brand sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-muted">
              Last updated:{" "}
              <time dateTime={POLICY_LAST_UPDATED_ISO}>
                {POLICY_LAST_UPDATED_DISPLAY}
              </time>
            </p>
            <p className="mt-6 text-base leading-7 text-muted">{intro}</p>
          </header>
          <div className="mt-10 space-y-10">{children}</div>
        </article>
      </Container>
    </Section>
  );
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2
        id={id}
        className="font-heading text-2xl font-semibold tracking-tight text-brand"
      >
        {title}
      </h2>
      <div className="space-y-4 text-base leading-7 text-muted">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
    >
      {children}
    </a>
  );
}
