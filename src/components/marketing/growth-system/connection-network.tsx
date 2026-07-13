import { motion } from "motion/react";

type ConnectionNetworkProps = {
  prefersReducedMotion: boolean | null;
};

export function ConnectionNetwork({
  prefersReducedMotion,
}: ConnectionNetworkProps) {
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
        initial={
          prefersReducedMotion
            ? false
            : {
                pathLength: 0,
                opacity: 0,
              }
        }
        animate={{
          pathLength: 1,
          opacity: 1,
        }}
        transition={{
          duration: 1.3,
          delay: 0.4,
        }}
      />

      <motion.path
        d="M280 142 C 390 142, 390 238, 516 238"
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth="1.5"
        strokeDasharray="7 10"
        initial={
          prefersReducedMotion
            ? false
            : {
                pathLength: 0,
                opacity: 0,
              }
        }
        animate={{
          pathLength: 1,
          opacity: 1,
        }}
        transition={{
          duration: 1.3,
          delay: 0.7,
        }}
      />

      {!prefersReducedMotion ? (
        <>
          <motion.circle
            r="3.5"
            fill="#22d3ee"
            initial={{
              offsetDistance: "0%",
              opacity: 0,
            }}
            animate={{
              offsetDistance: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
            }}
            style={{
              offsetPath:
                'path("M46 48 C 180 48, 180 142, 280 142")',
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
            initial={{
              offsetDistance: "0%",
              opacity: 0,
            }}
            animate={{
              offsetDistance: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
            }}
            style={{
              offsetPath:
                'path("M280 142 C 390 142, 390 238, 516 238")',
            }}
            transition={{
              duration: 2.8,
              delay: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </>
      ) : null}
    </svg>
  );
}