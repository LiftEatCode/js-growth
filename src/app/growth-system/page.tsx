import type { Metadata } from "next";
import {
  BarChart3,
  Bot,
  ChartNoAxesCombined,
  Globe,
  MapPin,
  MessagesSquare,
  Rocket,
  Workflow,
} from "lucide-react";

import {
  BenefitsSection,
  BusinessProblemsSection,
  CTASection,
  GrowthSystemVisual,
  PageHero,
  ProcessSection,
} from "@/components/marketing";
import { Container, Section, SectionHeader } from "@/components/ui";
import { businessProblems } from "@/content/home";

export const metadata: Metadata = {
  title: "The JS Growth System",
  description:
    "Discover how JS Solutions connects websites, Local SEO, lead generation, AI automation, business workflows, and analytics into one complete growth system.",
};

const growthBenefits = {
  eyebrow: "Why It Works",
  title: "Growth comes from connected systems.",
  description:
    "Individual tools can help your business, but the strongest results happen when every part of your digital presence supports the next.",
  items: [
    {
      title: "Build Trust",
      description:
        "A professional website gives customers confidence in your business and clearly explains why they should choose you.",
      icon: Globe,
    },
    {
      title: "Increase Visibility",
      description:
        "Local SEO helps nearby customers find your business when they are actively searching for your services.",
      icon: MapPin,
    },
    {
      title: "Capture Opportunities",
      description:
        "Clear calls to action and conversion-focused pages turn website traffic into calls, messages, and qualified leads.",
      icon: MessagesSquare,
    },
    {
      title: "Respond Faster",
      description:
        "AI-assisted communication and automated follow-up help your business respond before opportunities disappear.",
      icon: Bot,
    },
    {
      title: "Improve Operations",
      description:
        "Connected workflows reduce repetitive work and help your team manage customers, tasks, and information consistently.",
      icon: Workflow,
    },
    {
      title: "Measure Growth",
      description:
        "Analytics reveal which channels, pages, campaigns, and systems are producing meaningful business results.",
      icon: BarChart3,
    },
  ],
};

const growthProcess = {
  eyebrow: "The Framework",
  title: "How the JS Growth System works.",
  description:
    "Each stage strengthens the next, creating a connected system that attracts customers, improves follow-up, and supports long-term growth.",
  items: [
    {
      number: "01",
      title: "Build the Foundation",
      description:
        "Create a fast, credible, conversion-focused website that clearly communicates your services and value.",
      icon: Globe,
    },
    {
      number: "02",
      title: "Increase Visibility",
      description:
        "Improve search visibility through Local SEO, technical optimization, content, and location-focused strategies.",
      icon: MapPin,
    },
    {
      number: "03",
      title: "Capture Leads",
      description:
        "Give visitors clear paths to call, request information, schedule service, or begin a conversation.",
      icon: MessagesSquare,
    },
    {
      number: "04",
      title: "Improve Follow-Up",
      description:
        "Use AI and automation to respond faster, qualify opportunities, and keep leads from being forgotten.",
      icon: Bot,
    },
    {
      number: "05",
      title: "Connect Operations",
      description:
        "Integrate customer information, internal workflows, communication, and reporting into dependable systems.",
      icon: Workflow,
    },
    {
      number: "06",
      title: "Measure Performance",
      description:
        "Track visibility, traffic, conversions, leads, and operational results to identify what is driving growth.",
      icon: ChartNoAxesCombined,
    },
    {
      number: "07",
      title: "Optimize and Scale",
      description:
        "Use real performance data to improve the system, remove bottlenecks, and support continued expansion.",
      icon: Rocket,
    },
  ],
};

export default function GrowthSystemPage() {
  return (
    <>
      <PageHero
        eyebrow="The JS Growth System"
        title="More than marketing. A connected system for business growth."
        description="JS Solutions connects your website, search visibility, lead generation, AI automation, business workflows, and analytics so every part of your digital presence works toward the same goal."
      />

      <Section>
        <Container>
          <SectionHeader
            eyebrow="The Complete System"
            title="Turn disconnected digital tools into one growth engine."
            description="Your website should support your SEO. Your SEO should create opportunities. Your follow-up should convert those opportunities. Your data should show where to improve."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mx-auto mt-12 max-w-5xl">
            <GrowthSystemVisual />
          </div>
        </Container>
      </Section>

      <BenefitsSection {...growthBenefits} />

      <ProcessSection {...growthProcess} theme="dark" />

      <BusinessProblemsSection {...businessProblems} />

      <CTASection
        title="Build the right growth system for your business."
        description="Let’s identify your strongest opportunities, biggest bottlenecks, and the digital systems that can create the greatest impact."
        primaryLabel="Plan Your Growth"
      />
    </>
  );
}