import {
  BarChart3,
  Camera,
  ClipboardList,
  MapPinned,
  MessageSquareText,
  RefreshCw,
  Settings2,
  Star,
} from "lucide-react";

import {
  Container,
  FeatureCard,
  Section,
  SectionHeader,
} from "@/components/ui";

const profileImprovements = [
  {
    title: "Business Information",
    description:
      "Keep your name, address, phone number, hours, website, service areas, and business details accurate and consistent.",
    icon: MapPinned,
  },
  {
    title: "Primary and Secondary Categories",
    description:
      "Select the most relevant categories so Google better understands what your business offers and which searches it should appear for.",
    icon: Settings2,
  },
  {
    title: "Services and Products",
    description:
      "Organize your services, descriptions, and offerings so potential customers can quickly understand how your business can help them.",
    icon: ClipboardList,
  },
  {
    title: "Photos and Visual Content",
    description:
      "Use high-quality photos of your work, team, location, products, and customer experience to build trust and improve engagement.",
    icon: Camera,
  },
  {
    title: "Posts and Updates",
    description:
      "Publish useful updates, promotions, events, service highlights, and educational content to keep the profile active and informative.",
    icon: RefreshCw,
  },
  {
    title: "Review Strategy",
    description:
      "Build a consistent process for requesting, monitoring, and responding to customer reviews professionally.",
    icon: Star,
  },
  {
    title: "Customer Communication",
    description:
      "Improve calls, messages, questions, appointment actions, and other ways customers interact with your business through Google.",
    icon: MessageSquareText,
  },
  {
    title: "Performance Tracking",
    description:
      "Monitor searches, views, calls, website visits, direction requests, and other actions that show how customers find and engage with your profile.",
    icon: BarChart3,
  },
] as const;

export function GoogleBusinessProfileSection() {
  return (
    <Section className="border-y border-border bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              eyebrow="Google Business Profile"
              title="Turn your Google listing into a stronger customer touchpoint."
              description="Your Google Business Profile is often the first place a local customer sees your business. We improve the information, content, trust signals, and conversion paths that influence whether they call, visit, or choose a competitor."
            />

            <div className="mt-8 rounded-2xl border border-brand-blue/10 bg-brand-blue/[0.035] p-5">
              <p className="text-sm font-semibold text-brand">
                Your profile is part of the customer journey.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Accurate information, reviews, photos, services, and customer
                actions all work together to influence trust and local
                visibility.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {profileImprovements.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone="default"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}