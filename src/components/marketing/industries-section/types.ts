import type { LucideIcon } from "lucide-react";

export type IndustryItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type IndustriesSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly IndustryItem[];
  className?: string;
};