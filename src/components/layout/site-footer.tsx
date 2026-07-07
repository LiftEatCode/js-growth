import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="font-heading text-lg font-bold text-brand">
            {siteConfig.name}
          </Link>
          <p className="mt-2 text-sm text-muted">{siteConfig.tagline}</p>
        </div>

        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}