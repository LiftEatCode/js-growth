import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Search,
} from "lucide-react";

import { MegaMenu } from "@/components/layout/mega-menu";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-6">
        <Link
          href="/"
          aria-label="JS Solutions homepage"
          className="group flex shrink-0 items-center gap-3"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition duration-200 group-hover:bg-brand-blue group-hover:shadow-md">
            <Code2
              aria-hidden="true"
              className="size-5"
            />
          </span>

          <span className="whitespace-nowrap font-heading text-lg font-bold tracking-tight text-brand">
            {siteConfig.name}
          </span>
        </Link>

        <MegaMenu
          navigation={
            siteConfig.navigation
          }
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Search JS Solutions"
            title="Search coming soon"
            className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-brand xl:flex"
          >
            <Search
              aria-hidden="true"
              className="size-4"
            />

            <span>
              Search
            </span>

            <span className="ml-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ⌘K
            </span>
          </button>

          <Button
            className="group hidden h-9 rounded-xl px-4 shadow-sm sm:inline-flex"
            nativeButton={false}
            render={
              <Link
                href={
                  siteConfig
                    .primaryCta
                    .href
                }
              />
            }
          >
            {
              siteConfig
                .primaryCta.name
            }

            <ArrowRight
              aria-hidden="true"
              className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Button>

          <MobileNavigation />
        </div>
      </Container>
    </header>
  );
}