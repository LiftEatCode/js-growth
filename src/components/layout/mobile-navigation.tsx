"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";

export function MobileNavigation() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [
    openSection,
    setOpenSection,
  ] =
    useState<string | null>(
      "Services",
    );

  function closeMenu() {
    setIsOpen(false);
  }

  function toggleSection(
    sectionName: string,
  ) {
    setOpenSection(
      (current) =>
        current === sectionName
          ? null
          : sectionName,
    );
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-brand transition hover:bg-slate-100 lg:hidden"
      >
        <Menu
          aria-hidden="true"
          className="size-5"
        />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="z-[100] h-dvh w-full max-w-sm overflow-y-auto border-l border-border bg-background p-0 text-foreground shadow-2xl"
      >
        <SheetHeader className="border-b border-border bg-background px-6 py-5 text-left">
          <SheetTitle className="font-heading text-xl text-brand">
            {siteConfig.name}
          </SheetTitle>

          <SheetDescription>
            Websites, Local SEO, AI,
            and automation for growing
            businesses.
          </SheetDescription>
        </SheetHeader>

        <nav
          aria-label="Mobile navigation"
          className="flex min-h-[calc(100dvh-7rem)] flex-col bg-background px-5 py-5"
        >
          <div className="space-y-2">
            {siteConfig.navigation.map(
              (group) => {
                const isSectionOpen =
                  openSection ===
                  group.name;

                return (
                  <div
                    key={
                      group.name
                    }
                    className="overflow-hidden rounded-xl border border-border/80"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSection(
                          group.name,
                        )
                      }
                      aria-expanded={
                        isSectionOpen
                      }
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold text-brand transition hover:bg-slate-50"
                    >
                      {
                        group.name
                      }

                      <ChevronDown
                        aria-hidden="true"
                        className={`size-4 text-muted transition-transform duration-200 ${
                          isSectionOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {isSectionOpen ? (
                      <div className="border-t border-border/70 bg-slate-50/50 p-2">
                        {group.items.map(
                          (
                            item,
                          ) => (
                            <Link
                              key={
                                item.href
                              }
                              href={
                                item.href
                              }
                              onClick={
                                closeMenu
                              }
                              className="group flex items-start justify-between gap-4 rounded-lg px-3 py-3 transition hover:bg-background"
                            >
                              <div>
                                <p className="text-sm font-medium text-brand">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted">
                                  {
                                    item.description
                                  }
                                </p>
                              </div>

                              <ArrowRight
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-blue"
                              />
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-6">
            <Button
              className="w-full"
              size="lg"
              nativeButton={false}
              render={
                <Link
                  href={
                    siteConfig
                      .primaryCta
                      .href
                  }
                  onClick={
                    closeMenu
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
                className="ml-2 size-4"
              />
            </Button>
          </div>

          <div className="mt-auto pt-8">
            <p className="border-t border-border pt-5 text-center text-xs leading-5 text-muted">
              {
                siteConfig.tagline
              }
            </p>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}