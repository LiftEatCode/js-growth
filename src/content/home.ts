import {
  BarChart3,
  Bot,
  Globe,
  MapPin,
  MessagesSquare,
  Workflow,
} from "lucide-react";

import type { BusinessProblemItem } from "@/components/marketing";

export const businessProblems = {
  eyebrow: "Where Are You Getting Stuck?",
  title: "Your business does not need another disconnected tool.",
  description:
    "Start with the challenge creating the most friction. We will help identify the right solution and connect it to the rest of your growth system.",
  items: [
    {
      title: "Our website looks outdated.",
      description:
        "Your website no longer reflects the quality of your business, performs poorly, or fails to turn visitors into customers.",
      solution: "Website Development",
      href: "/websites",
      icon: Globe,
    },
    {
      title: "Customers cannot find us.",
      description:
        "Your business is not appearing prominently when nearby customers search Google for the services you provide.",
      solution: "Local SEO",
      href: "/local-seo",
      icon: MapPin,
    },
    {
      title: "We are not generating enough leads.",
      description:
        "Traffic is not consistently turning into calls, form submissions, appointments, or qualified opportunities.",
      solution: "Growth System",
      href: "/growth-system",
      icon: MessagesSquare,
    },
    {
      title: "We respond too slowly.",
      description:
        "Leads and customer questions are being delayed, missed, or handled inconsistently across your team.",
      solution: "AI Automation",
      href: "/ai-automation",
      icon: Bot,
    },
    {
      title: "We do too much manually.",
      description:
        "Repetitive administrative work is consuming time that could be spent serving customers and growing the business.",
      solution: "Business Automation",
      href: "/ai-automation",
      icon: Workflow,
    },
    {
      title: "We do not know what is working.",
      description:
        "Your website, marketing, lead sources, and business systems are not producing clear, actionable reporting.",
      solution: "Analytics & Reporting",
      href: "/services",
      icon: BarChart3,
    },
  ] satisfies readonly BusinessProblemItem[],
};