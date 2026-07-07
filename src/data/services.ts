import {
    Bot,
    Globe,
    LineChart,
    MapPin,
    Megaphone,
    Workflow,
  } from "lucide-react";
  
  export const services = [
    {
      title: "Custom Website Development",
      description: "Fast, modern websites built to turn visitors into leads.",
      icon: Globe,
    },
    {
      title: "Local SEO",
      description: "Improve local rankings and get found by customers near you.",
      icon: MapPin,
    },
    {
      title: "AI Integration",
      description: "Add AI tools that save time, improve follow-up, and automate work.",
      icon: Bot,
    },
    {
      title: "Business Automation",
      description: "Replace repetitive manual tasks with clean software workflows.",
      icon: Workflow,
    },
    {
      title: "Content Marketing",
      description: "Create consistent content that builds trust and drives traffic.",
      icon: Megaphone,
    },
    {
      title: "Analytics & Reporting",
      description: "Track leads, traffic, rankings, campaigns, and what is working.",
      icon: LineChart,
    },
  ] as const;