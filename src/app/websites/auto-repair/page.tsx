import type { Metadata } from "next";
import Link from "next/link";

import { AcquisitionCaptureBeacon } from "@/components/growth/growth-page-beacon";
import { Button, Container, Section } from "@/components/ui";
import { AUTO_REPAIR_WEBSITE_PATH } from "@/content/auto-repair-websites";
import { FREE_CHECK_PATH } from "@/content/free-check";

export const metadata: Metadata = {
  title: "Website Design for Auto Repair Shops | JS Solutions",
  description: "See how JS Solutions rebuilt Tha Shop’s website in Magnolia, Texas, and how we can help customers find your services and request an appointment.",
  alternates: { canonical: AUTO_REPAIR_WEBSITE_PATH },
};

const walkthrough = [
  { title: "Find the shop", href: "https://thashops.com/", description: "Start on the homepage and see how the shop introduces its work and location." },
  { title: "Find the right service", href: "https://thashops.com/auto-services", description: "Open Automotive Services and see what the shop handles before calling." },
  { title: "Request an appointment", href: "https://thashops.com/contact#appointment", description: "Open the appointment section to see how customers can share vehicle and service details." },
];

export default function AutoRepairWebsitesPage() {
  return (
    <>
      <AcquisitionCaptureBeacon />
      <Section className="bg-brand text-white">
        <Container>
          <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight sm:text-6xl">
            Website design for auto repair shops
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Help drivers see what you fix, call from their phone, and request an appointment.
            JS Solutions builds websites for independent shops around Magnolia, Tomball, and The Woodlands.
          </p>
          <Button className="mt-7" size="lg" nativeButton={false} render={<Link href={FREE_CHECK_PATH} />}>
            Get a Free Website &amp; Google Check
          </Button>
        </Container>
      </Section>
      <Section className="bg-slate-50">
        <Container>
          <h2 className="font-heading text-3xl font-bold text-brand">Walk through Tha Shop’s live website</h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            We rebuilt the Magnolia shop’s site with dedicated service pages and an appointment request flow.
            Open each step on your phone to see the same screens customers use.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {walkthrough.map(({ title, href, description }) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-brand">
                  <a className="underline underline-offset-4" href={href} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                </h3>
                <p className="mt-3 leading-7 text-muted">{description}</p>
              </li>
            ))}
          </ol>
          <Link className="mt-6 inline-block font-semibold text-brand underline underline-offset-4" href="/projects/tha-shop-website-redesign">
            Read the Tha Shop case study
          </Link>
        </Container>
      </Section>
      <Section>
        <Container>
          <h2 className="font-heading text-3xl font-bold text-brand">What we build for your shop</h2>
          <ul className="mt-5 max-w-3xl list-disc space-y-3 pl-5 leading-7 text-muted">
            <li>Dedicated pages for the work you want more of, such as brakes, diagnostics, and maintenance.</li>
            <li>Tap-to-call and appointment requests that ask for the details your service team needs.</li>
            <li>A clear path from your Google Business Profile to your services and contact options.</li>
          </ul>
        </Container>
      </Section>
    </>
  );
}
