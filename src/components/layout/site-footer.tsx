import Link from "next/link";

import { siteConfig } from "@/config/site";

const footerLinks = [
  { href: "/website-audit", label: "Free Website Audit" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
] as const;

export function SiteFooter() {
  return (
    <footer className="print:hidden border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/" className="font-heading text-lg font-bold text-brand">
            {siteConfig.name}
          </Link>
          <p className="mt-2 max-w-md text-sm text-muted">
            {siteConfig.tagline} Websites, Local SEO, and practical growth
            systems for small businesses.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-brand hover:text-brand-blue"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
