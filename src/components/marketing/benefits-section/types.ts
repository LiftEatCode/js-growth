import type { LucideIcon } from "lucide-react";

export type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type BenefitsSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly BenefitItem[];
  className?: string;
};  