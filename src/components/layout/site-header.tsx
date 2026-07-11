import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-xl font-bold text-brand">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition hover:text-brand"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <Button className="hidden md:inline-flex">Get Started</Button>
      </div>
    </header>
  );
}  