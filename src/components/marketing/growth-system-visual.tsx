"use client";

import type { PointerEvent } from "react";
import {
  BarChart3,
  Bot,
  Check,
  Globe2,
  Search,
  Workflow,
} from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

type GrowthSystemVisualProps = {
  className?: string;
};

const systems = [
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

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function GrowthSystemVisual({
  className,
}: GrowthSystemVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(320);
  const pointerY = useMotionValue(220);

  const smoothX = useSpring(pointerX, {
    stiffness: 180,
    damping: 28,
    mass: 0.4,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 180,
    damping: 28,
    mass: 0.4,
  });

  const spotlight = useMotionTemplate`
    radial-gradient(
      320px circle at ${smoothX}px ${smoothY}px,
      rgba(37, 99, 235, 0.18),
      rgba(6, 182, 212, 0.06) 38%,
      transparent 72%
    )
  `;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    pointerX.set(event.clientX - bounds.left);
    pointerY.set(event.clientY - bounds.top);
  }

  function handlePointerLeave() {
    pointerX.set(320);
    pointerY.set(220);
  }

  return (
    <motion.div
      className={cn(
        "relative mx-auto w-full max-w-xl lg:mx-0",
        className,
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-[3rem] bg-brand-blue/20 blur-3xl"
      />

      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-2xl sm:p-6"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"
        />

        <div className="relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="font-heading text-sm font-semibold text-white">
                JS Growth System
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Connected digital infrastructure
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>

              Systems online
            </div>
          </div>

          <div className="relative mt-5">
            <ConnectionNetwork />

            <motion.div
              className="relative z-10 grid gap-3"
              variants={containerVariants}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
            >
              {systems.map((system) => {
                const Icon = system.icon;

                return (
                  <motion.article
                    key={system.title}
                    variants={cardVariants}
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
                            <Check
                              aria-hidden="true"
                              className="size-3.5"
                            />
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
                                : { width: "0%" }
                            }
                            animate={{ width: system.progress }}
                            transition={{
                              duration: 1,
                              delay: 0.55,
                              ease: [0.22, 1, 0.36, 1] as const,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.7 }}
          >
            <DashboardCard
              icon={BarChart3}
              label="Strategy"
              title="Data informed"
              description="Decisions backed by analytics"
            />

            <DashboardCard
              icon={Workflow}
              label="Automation"
              title="Built to scale"
              description="Systems that grow with you"
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -left-4 hidden w-52 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xl sm:block"
        initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
        animate={
          prefersReducedMotion
            ? { opacity: 1, x: 0 }
            : {
                opacity: 1,
                x: 0,
                y: [0, -8, 0],
              }
        }
        transition={
          prefersReducedMotion
            ? {
                duration: 0.55,
                delay: 0.9,
              }
            : {
                opacity: {
                  duration: 0.55,
                  delay: 0.9,
                },
                x: {
                  duration: 0.55,
                  delay: 0.9,
                },
                y: {
                  duration: 4.5,
                  delay: 1.4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }
        }
      >
        <p className="text-xs text-slate-400">
          Growth architecture
        </p>

        <p className="mt-2 font-heading text-sm font-semibold text-white">
          Website + SEO + AI
        </p>

        <div className="mt-3 flex gap-1">
          <motion.span
            className="h-1.5 flex-1 rounded-full bg-brand-blue"
            animate={
              prefersReducedMotion
                ? undefined
                : { opacity: [0.5, 1, 0.5] }
            }
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          <motion.span
            className="h-1.5 flex-1 rounded-full bg-brand-cyan"
            animate={
              prefersReducedMotion
                ? undefined
                : { opacity: [1, 0.5, 1] }
            }
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          <span className="h-1.5 flex-1 rounded-full bg-emerald-400" />
        </div>
      </motion.div>
    </motion.div>
  );
}

type DashboardCardProps = {
  icon: typeof BarChart3;
  label: string;
  title: string;
  description: string;
};

function DashboardCard({
  icon: Icon,
  label,
  title,
  description,
}: DashboardCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
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

function ConnectionNetwork() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 290"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 hidden size-full opacity-60 sm:block"
    >
      <defs>
        <linearGradient
          id="connection-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
          <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d="M46 48 C 180 48, 180 142, 280 142"
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth="1.5"
        strokeDasharray="7 10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.4 }}
      />

      <motion.path
        d="M280 142 C 390 142, 390 238, 516 238"
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth="1.5"
        strokeDasharray="7 10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.7 }}
      />

      <motion.circle
        r="3.5"
        fill="#22d3ee"
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={{
          offsetDistance: ["0%", "100%"],
          opacity: [0, 1, 1, 0],
        }}
        style={{
          offsetPath: 'path("M46 48 C 180 48, 180 142, 280 142")',
        }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      <motion.circle
        r="3.5"
        fill="#60a5fa"
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={{
          offsetDistance: ["0%", "100%"],
          opacity: [0, 1, 1, 0],
        }}
        style={{
          offsetPath: 'path("M280 142 C 390 142, 390 238, 516 238")',
        }}
        transition={{
          duration: 2.8,
          delay: 1.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
    </svg>
  );
}