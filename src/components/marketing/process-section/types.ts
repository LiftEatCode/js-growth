import type { LucideIcon } from "lucide-react";

export type ProcessItem = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ProcessSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly ProcessItem[];
  className?: string;
  theme?: "light" | "dark";
};