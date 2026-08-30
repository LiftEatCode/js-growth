/**
 * Website redesign SEO blog publish contracts.
 * Distinct from ranking-diagnosis and SEO-cost posts: migration / rebuild
 * preservation angle. No new opportunity or content-plan seeds.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { blogPosts, getBlogPost } from "@/content/blog/posts";
import { evaluateClaimSafety } from "@/lib/growth/content-intelligence";
import { SEARCH_BLOG_INVENTORY } from "@/lib/growth/search-intelligence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const slug = "how-to-redesign-your-website-without-losing-seo";
const path = `/blog/${slug}`;

const post = getBlogPost(slug);
assert(post, "post registered");
assert(
  post?.title === "How to Redesign Your Website Without Losing SEO Rankings",
  "h1 title",
);
assert(
  post?.seoTitle === "How to Redesign a Website Without Losing SEO",
  "seo title without brand suffix",
);
assert(!post?.seoTitle?.includes("|"), "seo title does not double brand");
assert(
  post?.description.includes("protect SEO rankings, URLs, backlinks"),
  "meta description",
);
assert(post?.category === "SEO", "category");
assert(post?.publishedAtIso === "2026-08-30", "publish date");
assert(blogPosts[0]?.slug === slug, "newest post first in registry");
assert(blogPosts.length === SEARCH_BLOG_INVENTORY.length, "inventory matches registry");

assert(
  SEARCH_BLOG_INVENTORY.some((b) => b.slug === slug && b.path === path),
  "search blog inventory",
);
assert(
  SEARCH_BLOG_INVENTORY.find((b) => b.slug === slug)?.intent ===
    "PROBLEM_SOLUTION",
  "problem-solution intent",
);
assert(
  SEARCH_BLOG_INVENTORY.find((b) => b.slug === slug)?.relatedServicePath ===
    "/websites",
  "supports website development",
);

const articleSrc = readFileSync(
  join(here, "../../content/blog/how-to-redesign-your-website-without-losing-seo.tsx"),
  "utf8",
);

assert(articleSrc.includes('href="/websites"'), "link websites");
assert(articleSrc.includes('href="/seo"'), "link seo");
assert(articleSrc.includes('href="/local-seo"'), "link local-seo");
assert(articleSrc.includes('href="/website-audit"'), "link audit");
assert(articleSrc.includes('href="/contact"'), "link contact");
assert(
  articleSrc.includes('href="/projects/tha-shop-website-redesign"'),
  "link tha shop case study",
);
assert(
  articleSrc.includes("See the Tha Shop website redesign case study"),
  "case study anchor",
);
assert(
  articleSrc.includes(
    'href="/blog/why-most-small-business-websites-dont-generate-leads"',
  ),
  "related leads article",
);

assert(articleSrc.includes("https://thashops.com"), "live tha shop url");
assert(
  /href="https:\/\/thashops\.com"[\s\S]*?rel="noopener noreferrer"/.test(
    articleSrc,
  ),
  "tha shop external link safety",
);
assert(
  articleSrc.includes(
    "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
  ),
  "google site-move citation",
);
assert(
  /href="https:\/\/developers\.google\.com\/search\/docs\/crawling-indexing\/site-move-with-url-changes"[\s\S]*?rel="noopener noreferrer"/.test(
    articleSrc,
  ),
  "google docs external link safety",
);

assert(articleSrc.includes("Run My Free Website Audit"), "primary CTA copy");
assert(articleSrc.includes("Talk About My Website"), "secondary CTA copy");
assert(articleSrc.includes("Can Redesigning a Website Hurt SEO?"), "hurt seo h2");
assert(articleSrc.includes("Build an Old-to-New URL Map"), "url map h2");
assert(articleSrc.includes("Use Permanent Redirects Correctly"), "redirects h2");
assert(articleSrc.includes("A Real Example: Tha Shop Website Migration"), "tha shop h2");
assert(articleSrc.includes("Expect Some Search Fluctuation"), "fluctuation h2");
assert(
  articleSrc.includes("the new site has only just launched") ||
    articleSrc.includes("The new site has only just launched"),
  "no premature performance claims framing",
);

assert(
  !/FAQPage|aggregateRating|guaranteed ranking|#1 on Google|preserves 100%/i.test(
    articleSrc,
  ),
  "no unsafe schema/hype",
);
assert(evaluateClaimSafety(articleSrc).ok, "claim safety patterns");

const sitemap = readFileSync(join(here, "../../app/sitemap.ts"), "utf8");
assert(sitemap.includes("blogPosts"), "sitemap uses blog registry");

const blogPage = readFileSync(join(here, "../../app/blog/[slug]/page.tsx"), "utf8");
assert(blogPage.includes("getBlogPostingSchema"), "BlogPosting schema");
assert(blogPage.includes("getBreadcrumbSchema"), "breadcrumb schema");
assert(blogPage.includes("seoTitle"), "metadata uses seoTitle");

const caseStudy = readFileSync(
  join(here, "../../content/projects/tha-shop-website-redesign.tsx"),
  "utf8",
);
assert(caseStudy.includes("tha-shop-website-redesign"), "case study slug exists");

const contentMatch = articleSrc.match(/content:\s*\(([\s\S]*)\)\s*,\s*\n\s*\};/);
const articleBody = contentMatch?.[1];
assert(articleBody, "article content extracted");
const bodyText = articleBody
  .replace(/<[^>]+>/g, " ")
  .replace(/\{[^}]*\}/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const wordCount = bodyText.split(" ").filter(Boolean).length;
assert(
  wordCount >= 1500 && wordCount <= 2600,
  `article word count in range (got ${wordCount})`,
);

console.log(`website-redesign-seo-blog.verify.ts PASS (${wordCount} words)`);
