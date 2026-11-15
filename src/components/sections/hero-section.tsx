import Link from "next/link";

import { Button, Container, GridPattern } from "@/components/ui";
import { FREE_CHECK_PATH } from "@/content/free-check";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-brand text-white">
      <GridPattern className="opacity-40" />
      <Container className="relative py-20 sm:py-28">
        <h1 className="max-w-4xl font-heading text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
          Get more calls and quote requests from your website.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
          JS Solutions helps repair shops, contractors, and fabricators around Magnolia, Tomball,
          and The Woodlands improve their websites and Google Business Profiles.
        </p>
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
          <Button size="xl" nativeButton={false} render={<Link href={FREE_CHECK_PATH} />}>
            Get My Free Website &amp; Google Check
          </Button>
          <Button
            size="xl"
            variant="outline"
            nativeButton={false}
            render={<Link href="#featured-work" />}
            className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            See Our Work
          </Button>
        </div>
      </Container>
    </section>
  );
}
