import { Check } from "lucide-react";
import { motion } from "motion/react";

import { systemCardVariants, smoothEase } from "./animations";
import type { GrowthSystemItem } from "./growth-system-data";

type SystemCardProps = {
  system: GrowthSystemItem;
  prefersReducedMotion: boolean | null;
};

export function SystemCard({
  system,
  prefersReducedMotion,
}: SystemCardProps) {
  const Icon = system.icon;

  return (
    <motion.article
      variants={systemCardVariants}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              x: 4,
              scale: 1.01,
            }
      }
      className="group/card relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.075]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent"
      />

      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-28 rounded-full bg-brand-blue/10 blur-2xl transition group-hover/card:bg-brand-blue/20"
      />

      <div className="relative flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-300 shadow-inner">
          <Icon aria-hidden="true" className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold text-white sm:text-base">
              {system.title}
            </h3>

            <span className="flex items-center gap-1 text-xs text-emerald-300">
              <Check aria-hidden="true" className="size-3.5" />
              {system.status}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {system.subtitle}
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue via-cyan-400 to-brand-cyan"
              initial={
                prefersReducedMotion
                  ? false
                  : {
                      width: "0%",
                    }
              }
              animate={{
                width: system.progress,
              }}
              transition={{
                duration: 1,
                delay: 0.55,
                ease: smoothEase,
              }}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}