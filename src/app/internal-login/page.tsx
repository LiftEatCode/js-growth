import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { InternalLoginForm } from "@/components/internal-login-form";
import {
  Card,
  Container,
  GridPattern,
} from "@/components/ui";
import { getInternalSession } from "@/lib/internal-auth";

export const metadata: Metadata = {
  title:
    "Internal Login",

  description:
    "Secure access to the JS Solutions internal growth intelligence dashboard.",

  robots: {
    index: false,
    follow: false,
  },
};

export default async function InternalLoginPage() {
  const session =
    await getInternalSession();

  if (session) {
    redirect(
      "/reports",
    );
  }

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-brand py-16 text-white">
      <GridPattern className="opacity-35" />

      <div
        aria-hidden="true"
        className="absolute -right-48 -top-40 -z-10 size-[38rem] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-48 -left-40 -z-10 size-[34rem] rounded-full bg-brand-cyan/10 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-cyan-300">
              <ShieldCheck
                aria-hidden="true"
                className="size-7"
              />
            </span>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <SearchCheck
                aria-hidden="true"
                className="size-3.5"
              />

              JS Solutions Internal
            </div>

            <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
              Growth Intelligence
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sign in to access website audits, leads, pipeline activity, follow-ups, and internal sales intelligence.
            </p>
          </div>

          <Card
            variant="elevated"
            padding="lg"
          >
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <LockKeyhole
                  aria-hidden="true"
                  className="size-4"
                />
              </span>

              <div>
                <p className="font-heading font-semibold text-brand">
                  Authorized access only
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  This area contains private lead and business information.
                </p>
              </div>
            </div>

            <InternalLoginForm />
          </Card>
        </div>
      </Container>
    </main>
  );
}