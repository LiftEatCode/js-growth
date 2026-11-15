import type { Metadata } from "next";
import Link from "next/link";

import { Container, Section } from "@/components/ui";
import { FREE_CHECK_LABEL, FREE_CHECK_PATH } from "@/content/free-check";
import { FreeCheckForm } from "./free-check-form";

export const metadata: Metadata = {
  title: FREE_CHECK_LABEL,
  description: "Get a personal website and Google Business Profile review from JS Solutions in the Magnolia area.",
  alternates: { canonical: FREE_CHECK_PATH },
};

export default function FreeCheckPage() {
  return (
    <Section className="bg-slate-50">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-brand sm:text-5xl">
              {FREE_CHECK_LABEL}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-700">
              I’ll look at how customers find you on Google and how easily they can call or request a quote.
              I’ll email you a short walkthrough of one thing I’d fix first.
            </p>
            <p className="mt-4 text-slate-600">
              For repair shops, contractors, and fabricators around Magnolia, Tomball, and The Woodlands.
              You can request a check if you’re still getting your first website up.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-2xl font-semibold text-brand">Local Visibility Sprint · $750</h2>
              <p className="mt-3 leading-7 text-slate-700">
                If you’d like us to handle the work, we’ll agree on three website or Google profile fixes.
                Pay $375 to start and $375 at delivery. We’ll deliver within five business days once the
                deposit and required access are in place.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <FreeCheckForm />
            <p className="mt-5 text-sm text-slate-600">
              <Link href="/privacy" className="underline underline-offset-4">Privacy policy</Link>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
