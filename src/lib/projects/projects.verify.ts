/**
 * Client case-study system contracts.
 * Keeps /projects data-driven, indexable, and free of fabricated proof.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECT_REDIRECTS,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectPath,
  getPublishedProjects,
  projects,
} from "@/content/projects";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const slug = "tha-shop-website-redesign";
const path = getProjectPath(slug);

const project = getProjectBySlug(slug);
assert(project, "Tha Shop case study registered");
assert(project?.published, "Tha Shop case study published");
assert(project?.featured, "Tha Shop featured");
assert(project?.liveUrl === "https://thashops.com", "live site URL");
assert(project?.seoTitle.includes("Tha Shop Website Redesign"), "seo title");
assert(
  project?.description.includes("GoDaddy") &&
    project.description.includes("Next.js"),
  "meta description covers migration",
);
assert(
  projects.some((item) => item.slug === slug),
  "project in registry",
);
assert(
  getPublishedProjects().some((item) => item.slug === slug),
  "published list includes Tha Shop",
);
assert(
  getFeaturedProjects().some((item) => item.slug === slug),
  "featured list includes Tha Shop",
);
assert(path === "/projects/tha-shop-website-redesign", "canonical path");

const redirect = PROJECT_REDIRECTS.find(
  (item) => item.source === "/projects/tha-shop",
);
assert(redirect, "legacy slug redirect defined");
assert(redirect?.destination === path, "legacy slug points at new case study");

const nextConfig = readFileSync(join(repoRoot, "next.config.ts"), "utf8");
assert(
  nextConfig.includes('source: "/projects/tha-shop"'),
  "next.config redirects old Tha Shop URL",
);
assert(
  nextConfig.includes('destination: "/projects/tha-shop-website-redesign"'),
  "next.config destination is new slug",
);
assert(nextConfig.includes("permanent: true"), "legacy URL is a 308/301");

const sitemap = readFileSync(join(repoRoot, "src/app/sitemap.ts"), "utf8");
assert(sitemap.includes("getPublishedProjects"), "sitemap uses project registry");
assert(!sitemap.includes('getAbsoluteUrl("/projects/tha-shop")'), "old slug not in sitemap");

const caseStudyPage = readFileSync(
  join(repoRoot, "src/app/projects/[slug]/page.tsx"),
  "utf8",
);
assert(caseStudyPage.includes("generateMetadata"), "case study metadata");
assert(caseStudyPage.includes("canonical"), "canonical URLs");
assert(caseStudyPage.includes("openGraph"), "open graph");
assert(caseStudyPage.includes("twitter"), "twitter metadata");
assert(caseStudyPage.includes("getCaseStudyWebPageSchema"), "WebPage schema");
assert(caseStudyPage.includes("getCaseStudyBreadcrumbSchema"), "breadcrumb schema");
assert(!caseStudyPage.includes("AggregateRating"), "no review rating schema");
assert(!caseStudyPage.includes("Review"), "no Review schema");

const seoLib = readFileSync(join(repoRoot, "src/lib/seo.ts"), "utf8");
assert(seoLib.includes("getCaseStudyWebPageSchema"), "case study schema helper");
assert(!seoLib.includes('"@type": "Review"'), "seo helpers omit Review");

const testimonials = readFileSync(
  join(repoRoot, "src/components/sections/testimonials-section.tsx"),
  "utf8",
);
assert(!testimonials.includes("Kevin"), "no fabricated Tha Shop testimonial");
assert(
  !testimonials.includes("Casey Jones"),
  "no fabricated Crazy Eight Customs testimonial",
);

const homepage = readFileSync(
  join(repoRoot, "src/components/sections/featured-projects-section.tsx"),
  "utf8",
);
assert(homepage.includes("getFeaturedProjects"), "homepage reads registry");
assert(homepage.includes("Recent Work"), "homepage recent work eyebrow");

const relatedHrefs = project?.relatedServices.map((service) => service.href) ?? [];
const expectedRelated = [
  "/websites",
  "/seo",
  "/local-seo",
  "/website-audit",
  "/growth-system",
];
for (const href of expectedRelated) {
  assert(relatedHrefs.includes(href), `related service ${href}`);
  const appPage = join(repoRoot, "src/app", href.slice(1), "page.tsx");
  assert(existsSync(appPage), `route exists for ${href}`);
}

assert(
  existsSync(join(repoRoot, "src/app/contact/page.tsx")),
  "contact CTA route exists",
);
assert(
  project?.cta.primaryHref === "/website-audit",
  "primary CTA is website audit",
);
assert(project?.cta.secondaryHref === "/contact", "secondary CTA is contact");

const caseStudySource = readFileSync(
  join(repoRoot, "src/content/projects/tha-shop-website-redesign.tsx"),
  "utf8",
);
assert(!/testimonial/i.test(caseStudySource), "no testimonial block");
assert(!/ranking increased|traffic increased|PageSpeed|Lighthouse \d/i.test(caseStudySource), "no fabricated performance claims");
assert(!/Kevin/.test(caseStudySource), "no fabricated quote attribution");
assert(caseStudySource.includes("thashops.com"), "live domain mentioned");
assert(!caseStudySource.includes("target=\"_blank\""), "external link safety belongs in the view, not overused in copy");

const caseStudyView = readFileSync(
  join(repoRoot, "src/components/projects/case-study-view.tsx"),
  "utf8",
);
assert(caseStudyView.includes('target="_blank"'), "live site opens in a new tab");
assert(caseStudyView.includes('rel="noopener noreferrer"'), "external link is safe");

const footer = readFileSync(
  join(repoRoot, "src/components/layout/site-footer.tsx"),
  "utf8",
);
assert(footer.includes('href: "/projects"'), "footer exposes Work");

console.log("projects.verify PASS");
