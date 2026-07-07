import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand px-6 py-28 text-white md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_top_left,rgba(6,182,212,0.2),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-200 backdrop-blur">
            <Sparkles className="size-4" />
            Websites • Local SEO • AI Automation
          </div>

          <h1 className="max-w-5xl font-heading text-5xl font-bold tracking-tight md:text-7xl">
            Growth systems built like software.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            JS Solutions helps local businesses grow with high-performance
            websites, Local SEO, AI automation, and data-driven marketing
            systems engineered by a Senior Software Engineer.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get a Growth Plan
              <ArrowRight className="ml-2 size-4" />
            </Link>

            <Link
              href="/services"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}