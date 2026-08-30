/**
 * SEO cost small-business blog publish contracts.
 * Collision: RELATED_EXISTING_CONTENT (website-cost + commercial-investigation blogs)
 * resolved by SEO purchasing / pricing-education angle.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { blogPosts, getBlogPost } from "@/content/blog/posts";
import {
  SEO_COST_SMALL_BUSINESS_PLAN_SEED,
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
const slug = "how-much-does-seo-cost-small-business";
const path = `/blog/${slug}`;

const post = getBlogPost(slug);
assert(post, "post registered");
assert(post?.seoTitle?.includes("JS Solutions"), "seo title brand");
assert(post?.title.includes("How Much Does SEO Cost"), "h1 title");
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

const opportunity = SEARCH_OPPORTUNITY_SEEDS.find(
  (s) => s.slug === "seo-cost-small-business",
);
assert(opportunity, "search opportunity seed");
assert(opportunity?.currentPagePath === path, "opportunity path");
assert(opportunity?.topic === "SEO", "opportunity topic");

assert(
  SEO_COST_SMALL_BUSINESS_PLAN_SEED.slug === "seo-cost-small-business-v1",
  "content plan seed slug",
);
assert(SEO_COST_SMALL_BUSINESS_PLAN_SEED.contentType === "BLOG", "blog type");
assert(SEO_COST_SMALL_BUSINESS_PLAN_SEED.sourceType === "CONTENT_GAP", "gap mode");
assert(
  SEO_COST_SMALL_BUSINESS_PLAN_SEED.targetServicePath === "/seo",
  "supports /seo",
);

const collision = detectContentCollision({
  contentType: "BLOG",
  topic: "SEO",
  searchIntent: "COMMERCIAL_INVESTIGATION",
  targetPath: path,
  sourceType: "CONTENT_GAP",
});
assert(
  collision.state === "RELATED_EXISTING_CONTENT",
  "collision related (not blind clear)",
);
assert(
  collision.notes.some((n) =>
    /how-much-does-a-small-business-website-cost|local-seo-checklist|how-much-does-seo-cost/i.test(
      n,
    ),
  ),
  "collision notes mention related cost/commercial blogs",
);

const articleSrc = readFileSync(
  join(here, "../../content/blog/how-much-does-seo-cost-small-business.tsx"),
  "utf8",
);
assert(articleSrc.includes('href="/seo"'), "link seo");
assert(articleSrc.includes('href="/local-seo"'), "link local-seo");
assert(articleSrc.includes('href="/website-audit"'), "link audit");
assert(articleSrc.includes('href="/websites"'), "link websites");
assert(articleSrc.includes("Website Growth Audit"), "primary CTA copy");
assert(articleSrc.includes("SEO services"), "secondary CTA");
assert(
  /market observations|industry surveys/i.test(articleSrc),
  "pricing labeled as market observation",
);
assert(
  /depends on scope/i.test(articleSrc),
  "no invented JS Solutions package prices",
);
assert(
  !/FAQPage|aggregateRating|guaranteed ranking|#1 on Google/i.test(articleSrc),
  "no unsafe schema/hype",
);
assert(evaluateClaimSafety(articleSrc).ok, "claim safety patterns");

assert(
  SEARCH_INTERNAL_LINK_RECS.some(
    (r) => r.fromPath === path && r.toPath === "/seo",
  ),
  "outbound link rec",
);
assert(
  SEARCH_INTERNAL_LINK_RECS.some(
    (r) => r.fromPath === "/seo" && r.toPath === path,
  ),
  "inbound from /seo planned",
);

const seoPage = readFileSync(join(here, "../../app/seo/page.tsx"), "utf8");
assert(
  seoPage.includes("/blog/how-much-does-seo-cost-small-business"),
  "seo inbound link implemented",
);

const websiteCost = readFileSync(
  join(here, "../../content/blog/how-much-does-a-small-business-website-cost.tsx"),
  "utf8",
);
assert(
  websiteCost.includes("/blog/how-much-does-seo-cost-small-business"),
  "website-cost inbound link implemented",
);

const sitemap = readFileSync(join(here, "../../app/sitemap.ts"), "utf8");
assert(sitemap.includes("blogPosts"), "sitemap uses blog registry");

const perf = performanceStateAfterPublish({
  previous: null,
  publishedAt: new Date(),
  publicContentSlug: "how_much_does_seo_cost_small_business",
  recommendedLinks: ["/seo", "/local-seo", "/website-audit", "/websites"],
  implementedLinks: ["/seo", "/local-seo", "/website-audit", "/websites"],
});
assert(
  perf.measurementState === "PUBLISHED_AWAITING_DATA",
  "awaiting data after publish",
);
assert(CONTENT_REVIEW_WINDOWS.DAY_28_REVIEW === 28, "review window");

const research = readFileSync(
  join(here, "../../../docs/research/small-business-seo-cost-2026.md"),
  "utf8",
);
assert(research.includes("MARKET_OBSERVATION"), "research claim classes");
assert(research.includes("OFFICIAL_GOOGLE"), "google provenance");

console.log("seo-cost-small-business-blog.verify.ts PASS");
