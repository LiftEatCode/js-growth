"use client";

import type { PointerEvent } from "react";
import {
  BarChart3,
  Workflow,
} from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";

import { systemContainerVariants } from "./animations";
import { ConnectionNetwork } from "./connection-network";
import { DashboardCard } from "./dashboard-card";
import { growthSystems } from "./growth-system-data";
import { SystemCard } from "./system-card";

type GrowthSystemVisualProps = {
  className?: string;
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
      initial={
        prefersReducedMotion
          ? false
          : {
              opacity: 0,
              y: 24,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
        delay: 0.15,
      }}
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
          style={{
            background: spotlight,
          }}
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
            <ConnectionNetwork
              prefersReducedMotion={prefersReducedMotion}
            />

            <motion.div
              className="relative z-10 grid gap-3"
              variants={systemContainerVariants}
              initial={
                prefersReducedMotion
                  ? false
                  : "hidden"
              }
              animate="visible"
            >
              {growthSystems.map((system) => (
                <SystemCard
                  key={system.title}
                  system={system}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </motion.div>
          </div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-3"
            initial={
              prefersReducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 16,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
              delay: 0.7,
            }}
          >
            <DashboardCard
              icon={BarChart3}
              label="Strategy"
              title="Data informed"
              description="Decisions backed by analytics"
              prefersReducedMotion={prefersReducedMotion}
            />

            <DashboardCard
              icon={Workflow}
              label="Automation"
              title="Built to scale"
              description="Systems that grow with you"
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -left-4 hidden w-52 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xl sm:block"
        initial={
          prefersReducedMotion
            ? false
            : {
                opacity: 0,
                x: -20,
              }
        }
        animate={
          prefersReducedMotion
            ? {
                opacity: 1,
                x: 0,
              }
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
                : {
                    opacity: [0.5, 1, 0.5],
                  }
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
                : {
                    opacity: [1, 0.5, 1],
                  }
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