import {
    Bot,
    Globe2,
    Search,
    type LucideIcon,
  } from "lucide-react";
  
  export type GrowthSystemItem = {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    status: string;
    progress: string;
  };
  
  export const growthSystems: readonly GrowthSystemItem[] = [
    {
      title: "Website",
      subtitle: "Performance & conversion",
      icon: Globe2,
      status: "Optimized",
      progress: "84%",
    },
    {
      title: "Local SEO",
      subtitle: "Visibility & rankings",
      icon: Search,
      status: "Growing",
      progress: "90%",
    },
    {
      title: "AI Automation",
      subtitle: "Follow-up & workflows",
      icon: Bot,
      status: "Connected",
      progress: "96%",
    },
  ] as const;