import type { BlogPost } from "@/content/blog/types";

const SITE_URL = "https://js-growth.com";

export function getAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function getBlogPostingSchema(post: BlogPost) {
  const url = getAbsoluteUrl(`/blog/${post.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAtIso,
    dateModified: post.publishedAtIso,
    mainEntityOfPage: url,
    url,
    publisher: {
      "@type": "Organization",
      name: "JS Solutions",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: getAbsoluteUrl("/logo.png"),
      },
    },
    author: {
      "@type": "Organization",
      name: "JS Solutions",
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JS Solutions",
    url: SITE_URL,
    logo: getAbsoluteUrl("/logo.png"),
    sameAs: [],
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: "JS Solutions",
    description:
      "Custom websites, Local SEO, AI automation, and digital growth solutions for local businesses.",
  };
}