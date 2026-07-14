"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-brand transition hover:bg-slate-100 md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-sm p-0">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="font-heading text-xl text-brand">
            {siteConfig.name}
          </SheetTitle>

          <SheetDescription>
            Websites, Local SEO, AI, and automation for growing businesses.
          </SheetDescription>
        </SheetHeader>

        <nav
          aria-label="Mobile navigation"
          className="flex h-[calc(100%-7rem)] flex-col px-6 py-6"
        >
          <ul className="space-y-1">
            {siteConfig.navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl px-4 py-3 font-medium text-brand transition hover:bg-slate-100"
                >
                  {item.name}

                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-muted"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto border-t border-border pt-6">
            <Button
              className="w-full"
              size="lg"
              nativeButton={false}
              render={<Link href="/contact" onClick={closeMenu} />}
            >
              Get a Growth Plan
              <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </Button>

            <p className="mt-4 text-center text-xs leading-5 text-muted">
              Grow Your Business. We Build Solutions.
            </p>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}