import type { LucideIcon } from "lucide-react";

export type BusinessProblemItem = {
  title: string;
  description: string;
  solution: string;
  href: string;
  icon: LucideIcon;
};

export type BusinessProblemsSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: readonly BusinessProblemItem[];
};