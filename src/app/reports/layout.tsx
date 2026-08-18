import {
  LogOut,
  ShieldCheck,
} from "lucide-react";

import { internalLogout } from "@/app/internal-login/actions";
import { InternalWorkspaceNav } from "@/components/internal/workspace-nav";
import {
  Button,
} from "@/components/ui";
import { requireInternalSession } from "@/lib/internal-auth";

interface ReportsLayoutProps {
  children: React.ReactNode;
}

export default async function ReportsLayout({
  children,
}: ReportsLayoutProps) {
  const session = await requireInternalSession();

  return (
    <>
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.06] text-brand-blue">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-blue">
                Internal Workspace
              </p>

              <p className="truncate text-xs text-muted">{session.email}</p>
            </div>
          </div>

          <InternalWorkspaceNav />

          <form action={internalLogout}>
            <Button type="submit" size="sm" variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {children}
    </>
  );
}
