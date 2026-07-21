import {
  BarChart3,
  ClipboardList,
  FileText,
  Link2,
  MapPin,
  MapPinCheck,
  MessageSquareText,
  Search,
  Star,
  Users,
  Wrench,
} from "lucide-react";

import type {
  BenefitItem,
  FAQItem,
  ProcessItem,
} from "@/components/marketing";
  

export const localSeoBenefits = {
  eyebrow: "Local Search Visibility",
  title: "Help nearby customers find and choose your business.",
  description:
    "Local SEO strengthens the connection between your website, Google Business Profile, service areas, customer reviews, and the searches people make near you.",
  items: [
    {
      title: "Higher Local Visibility",
      description:
        "Improve your visibility when nearby customers search for the services your business provides.",
      icon: Search,
    },
    {
      title: "Google Maps Presence",
      description:
        "Strengthen your business presence across Google Maps and location-based search results.",
      icon: MapPin,
    },
    {
      title: "More Qualified Leads",
      description:
        "Reach customers who are actively searching for your services in the areas you serve.",
      icon: Users,
    },
    {
      title: "Stronger Reputation",
      description:
        "Build trust through accurate business information, customer reviews, and consistent local signals.",
      icon: Star,
    },
    {
      title: "Clearer Customer Communication",
      description:
        "Make it easier for customers to understand your services, locations, hours, and contact options.",
      icon: MessageSquareText,
    },
    {
      title: "Measurable Performance",
      description:
        "Track rankings, website traffic, calls, form submissions, and local search improvements.",
      icon: BarChart3,
    },
  ] satisfies readonly BenefitItem[],
} as const;

export const localSeoProcess = {
  eyebrow: "Our Local SEO Process",
  title: "A structured approach to stronger local visibility.",
  description:
    "Local SEO works best when your website, Google Business Profile, reputation, content, and local signals all support the same strategy.",
  items: [
    {
      number: "01",
      title: "Local SEO Audit",
      description:
        "We review your website, Google Business Profile, local rankings, citations, reviews, competitors, and technical issues that may be limiting visibility.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Keyword & Competitor Research",
      description:
        "We identify how local customers search for your services, which locations matter most, and where competitors are currently outperforming you.",
      icon: Search,
    },
    {
      number: "03",
      title: "Website Optimization",
      description:
        "We improve page structure, service content, location relevance, metadata, internal linking, technical SEO, and conversion paths.",
      icon: Wrench,
    },
    {
      number: "04",
      title: "Google Business Profile Optimization",
      description:
        "We strengthen categories, services, business details, photos, posts, customer actions, and other important profile elements.",
      icon: MapPinCheck,
    },
    {
      number: "05",
      title: "Citations & Local Signals",
      description:
        "We improve consistency across directories, business listings, industry platforms, and other trusted local sources.",
      icon: Link2,
    },
    {
      number: "06",
      title: "Review Strategy",
      description:
        "We help create a dependable process for requesting reviews, responding professionally, and building stronger customer trust.",
      icon: Star,
    },
    {
      number: "07",
      title: "Local Content",
      description:
        "We create and improve service pages, location content, FAQs, blog articles, and supporting information around real customer searches.",
      icon: FileText,
    },
    {
      number: "08",
      title: "Reporting & Optimization",
      description:
        "We track rankings, traffic, calls, leads, profile actions, and search visibility, then use that data to guide ongoing improvements.",
      icon: BarChart3,
    },
  ] satisfies readonly ProcessItem[],
} as const;

export const localSeoFAQ = {
  eyebrow: "Local SEO FAQ",
  title: "Common questions about improving local search visibility.",
  description:
    "Local SEO involves your website, Google Business Profile, reviews, local content, business listings, and ongoing optimization.",
  items: [
    {
      question: "How long does Local SEO take to work?",
      answer:
        "Local SEO is a long-term strategy. Some improvements may appear within a few weeks, while stronger ranking, traffic, and lead growth usually develops over several months.",
    },
    {
      question: "Can you guarantee first-place Google rankings?",
      answer:
        "No reputable SEO provider can guarantee a specific ranking. Search results depend on competition, location, relevance, authority, website quality, reviews, and Google's algorithms.",
    },
    {
      question: "Do I need a Google Business Profile?",
      answer:
        "For most local businesses, yes. A properly optimized Google Business Profile is one of the most important tools for appearing in Google Maps and local search results.",
    },
    {
      question: "Can you optimize my existing website?",
      answer:
        "Yes. We can improve the technical foundation, service pages, location relevance, metadata, internal linking, content, calls to action, and other search signals on an existing website.",
    },
    {
      question: "Do reviews affect Local SEO?",
      answer:
        "Reviews help build trust and can support local visibility. Review quality, frequency, relevance, and professional responses all contribute to a stronger local presence.",
    },
    {
      question: "What are local citations?",
      answer:
        "Local citations are mentions of your business information across directories, maps, industry websites, and other platforms. Accurate and consistent information helps search engines verify your business.",
    },
    {
      question: "Do I need separate pages for each location?",
      answer:
        "Sometimes. Businesses serving multiple real locations or distinct markets may benefit from dedicated location pages, but they should provide meaningful, unique information rather than duplicated content.",
    },
    {
      question: "Will Local SEO bring more phone calls?",
      answer:
        "The goal is to increase qualified visibility and make it easier for nearby customers to call, visit, request directions, or submit a form. Results depend on demand, competition, and the strength of the overall strategy.",
    },
    {
      question: "What do you track?",
      answer:
        "We can track local rankings, organic traffic, Google Business Profile actions, calls, form submissions, website engagement, direction requests, and other meaningful conversion signals.",
    },
    {
      question: "Is Local SEO a one-time service?",
      answer:
        "Initial optimization is valuable, but ongoing work usually produces stronger results. Competitors, search behavior, business information, reviews, content, and Google systems continue to change.",
    },
  ] satisfies readonly FAQItem[],
} as const;
