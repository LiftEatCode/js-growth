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
    <Section className="bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeader
            eyebrow="Google Business Profile"
            title="Turn your Google listing into a stronger customer touchpoint."
            description="Your Google Business Profile is often the first place a local customer sees your business. We improve the information, content, trust signals, and conversion paths that influence whether they call, visit, or choose a competitor."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {profileImprovements.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue transition duration-300 group-hover:bg-brand-blue group-hover:text-white">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-semibold text-brand">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}