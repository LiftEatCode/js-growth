import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type DashboardCardProps = {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  prefersReducedMotion: boolean | null;
};

export function DashboardCard({
  icon: Icon,
  label,
  title,
  description,
  prefersReducedMotion,
}: DashboardCardProps) {
  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -3,
            }
      }
      className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 text-slate-400">
        <Icon aria-hidden="true" className="size-4" />

        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-3 font-heading text-base font-semibold text-white sm:text-lg">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </motion.div>
  );
}