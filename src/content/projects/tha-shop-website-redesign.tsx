import Link from "next/link";

import type { ProjectCaseStudy } from "./types";

export const thaShopWebsiteRedesign: ProjectCaseStudy = {
  slug: "tha-shop-website-redesign",
  client: "Tha Shop",
  title:
    "Tha Shop Website Redesign: From GoDaddy to a Modern Next.js Growth Platform",
  seoTitle: "Tha Shop Website Redesign Case Study",
  description:
    "See how JS Growth rebuilt Tha Shop's GoDaddy website into a modern Next.js site with improved SEO architecture, lead generation, content, and Vercel hosting.",
  cardSummary:
    "Modernized an established local automotive website from GoDaddy hosting to a custom Next.js platform built for SEO, lead generation, content, and continued growth.",
  industry: "Automotive Repair",
  location: "Magnolia, TX",
  projectTypes: [
    "Website Redesign & Modernization",
    "SEO Migration",
    "Lead Generation",
    "Local Business Website",
  ],
  liveUrl: "https://thashops.com",
  liveUrlLabel: "Visit Live Website",
  liveSiteId: "tha-shop",
  featured: true,
  published: true,
  publishedAtIso: "2026-08-30",
  hero: {
    eyebrow: "Client Work",
    title:
      "Tha Shop Website Redesign: From GoDaddy to a Modern Next.js Growth Platform",
    description:
      "JS Growth replaced an older GoDaddy-hosted website with a custom Next.js site built for search, service content, appointment leads, and future growth — without throwing away the equity already earned on thashops.com.",
  },
  overview: {
    client: "Tha Shop",
    industry: "Automotive Repair, Custom Builds, Motorcycle Service & Fabrication",
    location: "Magnolia, Texas",
    projectTypes: [
      "Website Redesign & Modernization",
      "SEO Migration",
      "Lead Generation",
      "Local Business Website",
    ],
  },
  challenge: {
    eyebrow: "The Challenge",
    title: "The business had outgrown its older website setup.",
    description: (
      <>
        <p>
          Tha Shop is a local automotive business serving Magnolia, Texas and
          surrounding communities. The shop handles general auto repair,
          diagnostics, brakes, vehicle A/C, maintenance, motorcycle service,
          fabrication, classic and custom vehicles, and Crazy Eight Customs
          projects.
        </p>
        <p>
          The existing website was built and hosted through GoDaddy. That setup
          had gotten the business online, but it was no longer the right
          foundation for the level of flexibility the shop needed.
        </p>
        <p>
          This was not a request to make the homepage look newer. The site
          needed to become infrastructure for search, content, leads, and
          ongoing development.
        </p>
      </>
    ),
    points: [
      "Stronger organic search visibility and local SEO",
      "Service-specific content that searchers and customers can actually use",
      "A clearer path from visit to appointment request",
      "Better mobile usability and technical performance",
      "Room to publish, expand, and measure over time",
      "Easier development without tying the website to a site-builder host",
    ],
  },
  solution: {
    eyebrow: "The Solution",
    title: "A custom Next.js website built as a growth platform.",
    description: (
      <>
        <p>
          JS Growth designed and developed a custom{" "}
          <Link href="/websites">Next.js website</Link> for Tha Shop. The
          thashops.com domain stayed in place. Website hosting moved off
          GoDaddy and onto Vercel, so domain ownership and site hosting are no
          longer tied to the same builder.
        </p>
        <p>
          The new site is a TypeScript Next.js application with a responsive
          frontend, GitHub source control, Resend for appointment email
          delivery, and a structured{" "}
          <Link href="/seo">SEO architecture</Link> instead of a static
          brochure.
        </p>
      </>
    ),
    items: [
      {
        title: "Custom Next.js website",
        description:
          "A modern, responsive site that can add pages, services, and features without starting over in a website builder.",
      },
      {
        title: "SEO-ready information architecture",
        description: (
          <>
            Search-friendly URLs, internal linking, canonical tags, sitemap,
            robots, and structured data — the foundations covered in our{" "}
            <Link href="/seo">SEO work</Link>.
          </>
        ),
      },
      {
        title: "Local business structure",
        description: (
          <>
            Location, services, and content organized so nearby customers can
            understand what Tha Shop does and where it operates. See{" "}
            <Link href="/local-seo">Local SEO</Link>.
          </>
        ),
      },
      {
        title: "Appointment lead system",
        description:
          "Customers can request service with the details the shop actually needs — not just a generic contact form.",
      },
      {
        title: "Reusable blog and content system",
        description:
          "Educational articles live in the same Next.js app, so content can keep supporting search and customer education.",
      },
      {
        title: "Conversion-event architecture",
        description:
          "The site can record appointment, phone, and directions events as measurement is put to work after launch.",
      },
    ],
  },
  liveExamples: {
    eyebrow: "Live Website",
    title: "Explore the Live Website",
    description:
      "The best way to see the difference is to explore the finished site. Here are a few areas of the new Tha Shop website that demonstrate the structure, content, and lead-generation system built for the business.",
    items: [
      {
        title: "Homepage",
        description:
          "See the redesigned homepage, service positioning, local messaging, and conversion-focused calls to action.",
        url: "https://thashops.com",
        linkLabel: "Visit the homepage",
      },
      {
        title: "Automotive Services",
        description:
          "Explore the service architecture created to help customers understand what Tha Shop offers while supporting future organic search growth.",
        url: "https://thashops.com/auto-services",
        linkLabel: "Automotive Services",
      },
      {
        title: "Motorcycle Services",
        description:
          "See how a separate service area was structured for Tha Shop's motorcycle repair, maintenance, and custom work.",
        url: "https://thashops.com/motorcycle-services",
        linkLabel: "Motorcycle Services",
      },
      {
        title: "SEO Content System",
        description:
          "Explore the content system built to support educational automotive content, internal linking, and continued search visibility growth.",
        url: "https://thashops.com/blog",
        linkLabel: "Explore the Blog",
      },
      {
        title: "Lead Generation",
        description:
          "See the customer contact and appointment experience built to turn website visitors into real service inquiries.",
        url: "https://thashops.com/contact#appointment",
        linkLabel: "Contact Tha Shop",
      },
    ],
  },
  sections: [
    {
      id: "seo-migration",
      eyebrow: "SEO Migration",
      title: "Preserve search equity. Then improve the foundation.",
      description: (
        <>
          <p>
            Replacing a live website can erase years of indexed URLs if the
            migration is treated as a redesign-only project. This one was not.
            The work focused on keeping useful search equity on thashops.com
            while giving the new site a cleaner structure.
          </p>
          <p>
            Rankings and traffic are not being claimed here. The new site has
            only just launched. The point of the migration was to avoid starting
            from zero.
          </p>
        </>
      ),
      points: [
        "Identified existing indexed URLs before cutover",
        "Preserved important URLs where they still matched the new site",
        "Created permanent redirects for retired URLs",
        "Migrated useful evergreen blog content",
        "Redirected obsolete event content instead of leaving dead ends",
        "Added canonical URLs, an XML sitemap, and robots configuration",
        "Implemented structured data, including BlogPosting and breadcrumb schema",
        "Built local business and service SEO structure with internal linking",
      ],
    },
    {
      id: "content-system",
      eyebrow: "Content System",
      title: "A blog the business can keep growing.",
      description: (
        <>
          <p>
            A reusable blog and content system was built directly in the Next.js
            application. That is different from a brochure site that rarely
            changes after launch.
          </p>
          <p>
            Existing and new articles cover practical topics around brake
            repair, automotive A/C, classic vehicles, motorcycle service and
            performance, restoration, and local automotive education. That
            library is a starting point for continued{" "}
            <Link href="/seo">search visibility work</Link>, not a finished
            content project.
          </p>
        </>
      ),
    },
    {
      id: "lead-generation",
      eyebrow: "Lead Generation",
      title: "Appointment requests the shop can actually use.",
      description: (
        <>
          <p>
            The site now has an appointment lead system instead of a thin
            contact form. Customers can describe the service they need, how
            they prefer to be reached, a preferred date, vehicle details, and a
            message. They can attach an optional photo. The submission also
            records the page it came from so the shop knows what the visitor
            was looking at.
          </p>
          <p>
            Requests are validated before they go out and delivered to the
            business through Resend. Lightweight spam and abuse controls sit in
            front of that delivery so junk is less likely to land in the inbox.
          </p>
        </>
      ),
      points: [
        "Service needed",
        "Customer contact information",
        "Preferred contact method",
        "Preferred date",
        "Vehicle information",
        "Message and optional photo attachment",
        "Source-page tracking on each request",
      ],
    },
    {
      id: "conversion-tracking",
      eyebrow: "Conversion Tracking",
      title: "Measurement is in place. Results are still ahead.",
      description: (
        <>
          <p>
            The architecture supports tracking events such as appointment
            started, appointment submitted, phone clicks, and directions
            clicks. That is the instrumentation, not a report of results.
          </p>
          <p>
            Launch is the start of measurement, not proof that the new site is
            already outperforming the old one.
          </p>
        </>
      ),
    },
    {
      id: "deployment",
      eyebrow: "Deployment",
      title: "Hosted on Vercel, shipped from GitHub.",
      description: (
        <>
          <p>
            Tha Shop’s website now deploys through Vercel from GitHub. That
            gives the project a modern deployment workflow, CDN delivery,
            automatic HTTPS, and a cleaner split between domain ownership and
            website hosting.
          </p>
          <p>
            Changes can be reviewed, shipped, and improved without logging into
            a site builder. Performance numbers are not being published here
            because launch is too recent for that to be useful.
          </p>
        </>
      ),
    },
  ],
  beforeAfter: {
    beforeTitle: "Before",
    afterTitle: "After",
    before: [
      "GoDaddy-hosted website",
      "Limited development flexibility",
      "Older content structure",
      "Basic lead and contact flow",
      "Limited SEO expansion architecture",
      "Website hosting tied closely to the site builder",
    ],
    after: [
      "Custom Next.js application",
      "Vercel hosting and GitHub deployments",
      "Structured SEO architecture",
      "Reusable content and blog system",
      "Service-focused internal linking",
      "Appointment lead delivery",
      "Conversion-event architecture",
      "Permanent migration redirects",
      "Expandable foundation for services and marketing",
    ],
  },
  technologies: [
    {
      name: "Next.js",
      outcome: "A custom site that can add pages, content, and features over time.",
    },
    {
      name: "React",
      outcome: "A consistent experience across phones, tablets, and desktops.",
    },
    {
      name: "TypeScript",
      outcome: "More reliable development as the website continues to expand.",
    },
    {
      name: "Vercel",
      outcome: "Modern hosting, HTTPS, and a deployment workflow the business can grow with.",
    },
    {
      name: "GitHub",
      outcome: "Version-controlled changes instead of a locked site builder.",
    },
    {
      name: "Resend",
      outcome: "Validated appointment requests delivered to the shop by email.",
    },
    {
      name: "Schema.org structured data",
      outcome: "Clearer page, article, and local-business signals for search engines.",
    },
  ],
  nextSteps: {
    eyebrow: "Built for What Comes Next",
    title: "Launch established the foundation. Growth work continues.",
    description: (
      <>
        <p>
          The new site is live. That is a technical and marketing starting
          point, not a finished growth report. Ongoing work can now happen on
          a platform that supports it.
        </p>
        <p>
          If your current website is in a similar place — online, but hard to
          improve — a{" "}
          <Link href="/website-audit">Website Growth Audit</Link> is a practical
          first look at what is holding it back.
        </p>
      </>
    ),
    points: [
      "Service-specific SEO pages",
      "Local SEO expansion",
      "Additional educational content",
      "Conversion optimization",
      "Google Business Profile optimization",
      "Analytics measurement",
      "Continued search visibility improvements",
    ],
  },
  relatedServices: [
    {
      title: "Website Development",
      description:
        "Custom sites built for leads, search, and the next round of changes — not a one-time brochure.",
      href: "/websites",
    },
    {
      title: "SEO",
      description:
        "Technical foundations, content structure, and measurement without ranking guarantees.",
      href: "/seo",
    },
    {
      title: "Local SEO",
      description:
        "Help nearby customers find the business when they search for services in their area.",
      href: "/local-seo",
    },
    {
      title: "Website Growth Audit",
      description:
        "See what is holding an existing website back before you rebuild or migrate.",
      href: "/website-audit",
    },
    {
      title: "Growth System",
      description:
        "Connect the website, search, leads, and follow-up so they work as one system.",
      href: "/growth-system",
    },
  ],
  cta: {
    title: "Outgrown Your Current Website?",
    description:
      "JS Growth can evaluate an existing website, identify technical, SEO, and conversion limitations, and build a migration plan that keeps the search equity you have already earned.",
    primaryLabel: "Run My Free Website Audit",
    primaryHref: "/website-audit",
    secondaryLabel: "Talk About My Website",
    secondaryHref: "/contact",
  },
};
