import {
  Quote,
  Star,
} from "lucide-react";

import {
  Card,
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  services?: readonly string[];
  rating?: number;
  className?: string;
};

const testimonials = [
  {
    quote:
      "JS Solutions rebuilt our online presence into something that actually generates inquiries. The site is faster, clearer, and finally positioned for local search.",
    name: "Kevin",
    role: "Owner",
    company: "Tha Shop",
    services: [
      "Local SEO",
      "Web Design",
      "Social Media Management",
      "Google Ads",
    ],
    rating: 5,
  },
  {
    quote:
      "They approached our website like a product, not a brochure. Performance, structure, and lead flow were all designed with growth in mind.",
    name: "Casey Jones",
    role: "Owner",
    company: "Crazy Eight Customs",
    services: [
      "Web Development",
      "Marketing",
      "Local SEO",
    ],
    rating: 5,
  },
] as const;

export function TestimonialCard({
  quote,
  name,
  role,
  company,
  services = [],
  rating = 5,
  className,
}: TestimonialCardProps) {
  const safeRating =
    Math.min(
      Math.max(
        rating,
        0,
      ),
      5,
    );

  const attribution =
    [role, company]
      .filter(Boolean)
      .join(" • ");

  return (
    <Card
      as="figure"
      variant="elevated"
      padding="lg"
      interactive
      className={cn(
        "group flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex gap-1"
          aria-label={`${safeRating} out of 5 stars`}
        >
          {Array.from(
            {
              length: 5,
            },
            (_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={cn(
                  "size-4",
                  index < safeRating
                    ? "fill-brand-blue text-brand-blue"
                    : "fill-transparent text-border",
                )}
              />
            ),
          )}
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue transition duration-200 group-hover:bg-brand-blue group-hover:text-white">
          <Quote
            aria-hidden="true"
            className="size-5"
          />
        </div>
      </div>

      <blockquote className="mt-6 flex-1 text-lg leading-8 text-foreground">
        “{quote}”
      </blockquote>

      <figcaption className="mt-8 border-t border-border pt-6">
        <p className="font-heading text-lg font-semibold text-brand">
          {name}
        </p>

        {attribution ? (
          <p className="mt-1 text-sm text-muted">
            {attribution}
          </p>
        ) : null}

        {services.length > 0 ? (
          <ul
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Services provided"
          >
            {services.map((service) => (
              <li key={service}>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3 py-1 font-medium text-brand-blue"
                >
                  {service}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
    </Card>
  );
}

export function TestimonialsSection() {
  return (
    <Section className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 -z-10 size-[30rem] -translate-y-1/3 translate-x-1/4 rounded-full bg-brand-blue/[0.035] blur-3xl"
      />

      <Container>
        <SectionHeader
          eyebrow="Testimonials"
          title="Trusted by businesses ready to grow."
          description="Real feedback from owners and operators who needed a sharper website, stronger local visibility, and systems that actually support the work."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
          {testimonials.map(
            (testimonial) => (
              <TestimonialCard
                key={
                  testimonial.name
                }
                quote={
                  testimonial.quote
                }
                name={
                  testimonial.name
                }
                role={
                  testimonial.role
                }
                company={
                  testimonial.company
                }
                services={
                  testimonial.services
                }
                rating={
                  testimonial.rating
                }
              />
            ),
          )}
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm leading-7 text-muted">
            Every engagement is built around the same goal: better systems,
            clearer visibility, and technology that creates measurable value
            for the business.
          </p>
        </div>
      </Container>
    </Section>
  );
}