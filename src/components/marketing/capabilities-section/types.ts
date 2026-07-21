import type { LucideIcon } from "lucide-react";

export type CapabilityItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type CapabilitiesSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly CapabilityItem[];
  className?: string;
};