/**
 * Local SEO checklist blog publish contracts.
 * Collision: RELATED_EXISTING_CONTENT (definition + diagnosis posts) resolved by checklist angle.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { blogPosts, getBlogPost } from "@/content/blog/posts";
import {
  LOCAL_SEO_CHECKLIST_PLAN_SEED,
  detectContentCollision,
  evaluateClaimSafety,
} from "@/lib/growth/content-intelligence";
import {
  CONTENT_REVIEW_WINDOWS,
  performanceStateAfterPublish,
} from "@/lib/growth/content-performance";
import {
  SEARCH_BLOG_INVENTORY,
  SEARCH_INTERNAL_LINK_RECS,
  SEARCH_OPPORTUNITY_SEEDS,
} from "@/lib/growth/search-intelligence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const slug = "local-seo-checklist-small-business";
const path = `/blog/${slug}`;

const post = getBlogPost(slug);
assert(post, "post registered");
assert(post?.seoTitle?.includes("2026"), "seo title year");
assert(post?.title.includes("Local SEO Checklist"), "h1 title");
assert(
  blogPosts.some((p) => p.slug === slug),
  "post in registry",
);

assert(
  SEARCH_BLOG_INVENTORY.some((b) => b.slug === slug),
  "search blog inventory",
);
assert(
  SEARCH_BLOG_INVENTORY.find((b) => b.slug === slug)?.intent ===
    "COMMERCIAL_INVESTIGATION",
  "commercial investigation intent",
);

const opportunity = SEARCH_OPPORTUNITY_SEEDS.find((s) => s.slug === slug);
assert(opportunity, "search opportunity seed");
assert(opportunity?.currentPagePath === path, "opportunity path");

assert(
  LOCAL_SEO_CHECKLIST_PLAN_SEED.slug === "local-seo-checklist-small-business-v1",
  "content plan seed slug",
);
assert(LOCAL_SEO_CHECKLIST_PLAN_SEED.contentType === "BLOG", "blog type");
assert(LOCAL_SEO_CHECKLIST_PLAN_SEED.sourceType === "CONTENT_GAP", "gap mode");

const collision = detectContentCollision({
  contentType: "BLOG",
  topic: "LOCAL_SEO",
  searchIntent: "COMMERCIAL_INVESTIGATION",
  targetPath: path,
  sourceType: "CONTENT_GAP",
});
assert(
  collision.state === "RELATED_EXISTING_CONTENT",
  "collision related (not blind clear)",
);
assert(
  collision.notes.some((n) => /what-is-local-seo|local-seo-checklist/i.test(n)),
  "collision notes mention related local blogs",
);

const articleSrc = readFileSync(
  join(here, "../../content/blog/local-seo-checklist-small-business.tsx"),
  "utf8",
);
assert(articleSrc.includes('href="/local-seo"'), "link local-seo");
assert(articleSrc.includes('href="/seo"'), "link seo");
assert(articleSrc.includes('href="/website-audit"'), "link audit");
assert(articleSrc.includes('href="/websites"'), "link websites");
assert(articleSrc.includes("Website Growth Audit"), "primary CTA copy");
assert(articleSrc.includes("Local SEO services"), "secondary CTA");
assert(!/FAQPage|aggregateRating|guaranteed ranking|#1 on Google/i.test(articleSrc), "no unsafe schema/hype");
assert(
  evaluateClaimSafety(articleSrc).ok,
  "claim safety patterns",
);

assert(
  SEARCH_INTERNAL_LINK_RECS.some(
    (r) => r.fromPath === path && r.toPath === "/local-seo",
  ),
  "outbound link rec",
);
assert(
  SEARCH_INTERNAL_LINK_RECS.some(
    (r) =>
      r.fromPath === "/local-seo" && r.toPath === path,
  ),
  "inbound from local-seo planned",
);

const localSeoPage = readFileSync(
  join(here, "../../app/local-seo/page.tsx"),
  "utf8",
);
assert(
  localSeoPage.includes("/blog/local-seo-checklist-small-business"),
  "local-seo inbound link implemented",
);

const sitemap = readFileSync(join(here, "../../app/sitemap.ts"), "utf8");
assert(sitemap.includes("blogPosts"), "sitemap uses blog registry");

const perf = performanceStateAfterPublish({
  previous: null,
  publishedAt: new Date(),
  publicContentSlug: "local_seo_checklist_small_business",
  recommendedLinks: ["/local-seo", "/seo", "/website-audit", "/websites"],
  implementedLinks: ["/local-seo", "/seo", "/website-audit", "/websites"],
});
assert(
  perf.measurementState === "PUBLISHED_AWAITING_DATA",
  "awaiting data after publish",
);
assert(CONTENT_REVIEW_WINDOWS.DAY_28_REVIEW === 28, "review window");

const index = readFileSync(join(here, "../../content/blog/index.ts"), "utf8");
assert(index.includes("posts") || index.includes("blogPosts"), "blog barrel");

console.log("local-seo-checklist-blog.verify.ts PASS");
