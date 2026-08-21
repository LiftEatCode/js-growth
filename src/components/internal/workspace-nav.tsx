"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/reports",
    label: "Reports",
    match: (pathname: string) =>
      pathname === "/reports" ||
      (pathname.startsWith("/reports/") &&
        !pathname.startsWith("/reports/prospecting") &&
        !pathname.startsWith("/reports/opportunities")),
  },
  {
    href: "/reports/prospecting",
    label: "Prospecting",
    match: (pathname: string) => pathname.startsWith("/reports/prospecting"),
  },
  {
    href: "/reports/opportunities",
    label: "Opportunities",
    match: (pathname: string) => pathname.startsWith("/reports/opportunities"),
  },
] as const;

export function InternalWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Internal workspace" className="flex items-center gap-1">
      {links.map((link) => {
        const active = link.match(pathname);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-brand-blue/[0.08] text-brand-blue"
                : "text-muted hover:bg-slate-50 hover:text-brand",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
