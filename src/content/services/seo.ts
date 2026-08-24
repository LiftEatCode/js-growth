import {
  BarChart3,
  ClipboardList,
  FileSearch,
  Link2,
  MapPin,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import type {
  BenefitItem,
  FAQItem,
  ProcessItem,
} from "@/types/marketing";

/**
 * Production SEO service page content.
 * Aligned to Sprint 6 brief/skeleton (diagnose-first, no ranking guarantees).
 * Canonical code implementation for /seo — not a raw JSON dump.
 */
export const seoPageMeta = {
  title: "SEO Services for Small Businesses",
  description:
    "Practical SEO for small businesses: clarity, technical foundations, content relevance, and measurement — without ranking guarantees.",
  canonicalPath: "/seo",
} as const;

export const seoBenefits = {
  eyebrow: "Search visibility that supports growth",
  title: "SEO that clarifies your offer and strengthens findability.",
  description:
    "JS Solutions approaches SEO as search visibility that supports qualified traffic, engagement, and inquiries — starting with evidence, not promises.",
  items: [
    {
      title: "Clearer service messaging",
      description:
        "Help searchers and customers understand what you do, who you serve, and what to do next.",
      icon: FileSearch,
    },
    {
      title: "Technical foundations",
      description:
        "Improve crawlability, indexability, page experience, and structural issues that block discovery.",
      icon: Wrench,
    },
    {
      title: "Content relevance",
      description:
        "Strengthen pages so they answer real questions with people-first usefulness — not keyword stuffing.",
      icon: Search,
    },
    {
      title: "Internal linking",
      description:
        "Connect services, resources, and conversion paths so people and crawlers can navigate what matters.",
      icon: Link2,
    },
    {
      title: "Honest measurement",
      description:
        "Use Search Console and analytics when data exists. Early sites may have insufficient query data — we keep that explicit.",
      icon: BarChart3,
    },
    {
      title: "No ranking guarantees",
      description:
        "Outcomes depend on competition, relevance, and factors outside anyone’s control. We focus on stronger foundations.",
      icon: ShieldAlert,
    },
  ] satisfies readonly BenefitItem[],
} as const;

export const seoProcess = {
  eyebrow: "Diagnose-first process",
  title: "Start with what is actually broken.",
  description:
    "SEO should not operate in a silo. Website quality, local signals, conversion paths, and measurement work together.",
  items: [
    {
      number: "01",
      title: "Evidence & audit",
      description:
        "Start with evidence — including the free Website Growth Audit when useful — to prioritize technical, content, and conversion issues.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Prioritize foundations",
      description:
        "Fix findability, clarity, and structural gaps before chasing vanity tactics or fabricated demand.",
      icon: Wrench,
    },
    {
      number: "03",
      title: "Improve pages & links",
      description:
        "Strengthen service pages, supporting content, metadata, and internal links with honest, useful copy.",
      icon: FileSearch,
    },
    {
      number: "04",
      title: "Measure & review",
      description:
        "Track impressions, clicks, landing engagement, and audit/contact actions. Average position alone is not enough.",
      icon: BarChart3,
    },
  ] satisfies readonly ProcessItem[],
} as const;

export const seoFaq = {
  eyebrow: "Common questions",
  title: "Straight answers about SEO.",
  description:
    "These FAQs are for readers on the page. We do not add FAQ rich-result schema for Search appearance chasing.",
  items: [
    {
      question: "Do you guarantee rankings?",
      answer:
        "No. Ranking outcomes depend on competition, relevance, and many factors outside anyone’s control. We focus on stronger foundations and honest measurement.",
    },
    {
      question: "How is this different from Local SEO?",
      answer:
        "Local SEO emphasizes nearby discovery, Maps, and Google Business Profile. This SEO service focuses on site-wide search clarity and technical/content foundations, often paired with Local SEO.",
    },
    {
      question: "Should SEO run separately from the website?",
      answer:
        "No. SEO should not operate in a silo. Page quality, conversion paths, local signals, and measurement belong in one growth system.",
    },
  ] satisfies readonly FAQItem[],
} as const;

export const seoVsLocal = {
  title: "SEO and Local SEO work together",
  body: "Maps and Google Business Profile matter for nearby discovery; the website still needs clear service pages and a crawlable structure. If nearby customers are the priority, start with Local SEO — and keep this SEO page for site-wide foundations.",
  localHref: "/local-seo",
  localLabel: "Explore Local SEO",
} as const;

export const seoHighlights = [
  {
    title: "Diagnose first",
    description:
      "Prioritize what is actually limiting visibility and conversion before guessing tactics.",
    icon: ClipboardList,
  },
  {
    title: "People-first pages",
    description:
      "Useful content for small-business owners — not doorway spam or keyword stuffing.",
    icon: Search,
  },
  {
    title: "Local awareness",
    description:
      "Coordinate with Maps/GBP work when nearby discovery matters.",
    icon: MapPin,
  },
  {
    title: "Measurable next steps",
    description:
      "Connect SEO work to audits, contacts, and clear review windows — without inventing results.",
    icon: BarChart3,
  },
] as const;
