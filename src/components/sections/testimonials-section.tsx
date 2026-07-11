import { Quote, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";
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
    services: ["Local SEO", "Web Design", "Social Media Management", "Google Ads"],
    rating: 5,
  },
  {
    quote:
      "They approached our website like a product, not a brochure. Performance, structure, and lead flow were all designed with growth in mind.",
    name: "Casey Jones",
    role: "Owner",
    company: "Crazy Eight Customs",
    services: ["Web Development", "Marketing", "Local SEO"],
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
  const safeRating = Math.min(Math.max(rating, 0), 5);
  const attribution = [role, company].filter(Boolean).join(" • ");

  return (
    <figure
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-card",
        "transition duration-300 hover:-translate-y-1 hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex gap-1"
          aria-label={`${safeRating} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, index) => (
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
          ))}
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-brand-blue transition duration-300 group-hover:bg-brand-blue group-hover:text-white">
          <Quote aria-hidden="true" className="size-5" />
        </div>
      </div>

      <blockquote className="mt-6 flex-1 text-base leading-8 text-foreground">
        “{quote}”
      </blockquote>

      <figcaption className="mt-8 border-t border-border pt-6">
        <p className="font-heading text-lg font-semibold text-brand">
          {name}
        </p>

        {attribution ? (
          <p className="mt-1 text-sm text-muted">{attribution}</p>
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
                  className="rounded-full px-3 py-1 font-medium"
                >
                  {service}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection() {
  return (
    <Section className="bg-white">
      <Container>
        <SectionHeader
          eyebrow="Testimonials"
          title="Trusted by local businesses ready to grow."
          description="Real feedback from owners and operators who needed a sharper website, stronger local visibility, and systems that actually support the work."
          align="center"
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              company={testimonial.company}
              services={testimonial.services}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
