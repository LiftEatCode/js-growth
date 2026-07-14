import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          aria-label="JS Solutions homepage"
          className="group flex items-center gap-3"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition group-hover:bg-brand-blue">
            <Code2 aria-hidden="true" className="size-5" />
          </span>

          <span className="font-heading text-lg font-bold tracking-tight text-brand">
            {siteConfig.name}
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-brand"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            className="group hidden shadow-sm md:inline-flex"
            nativeButton={false}
            render={<Link href="/contact" />}
          >
            Get Started

            <ArrowRight
              aria-hidden="true"
              className="ml-2 size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Button>

          <MobileNavigation />
        </div>
      </Container>
    </header>
  );
}