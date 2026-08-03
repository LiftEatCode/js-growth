import type { BlogPost } from "@/content/blog/posts";

export const SITE_URL = "https://js-growth.com";
export const SITE_NAME = "JS Solutions";

export function getAbsoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function getBlogPostingSchema(post: BlogPost) {
  const articleUrl = getAbsoluteUrl(`/blog/${post.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAtIso,
    dateModified: post.publishedAtIso,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    url: articleUrl,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: getAbsoluteUrl("/logo.png"),
      },
    },
  };
}

export function getBreadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: getAbsoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: getAbsoluteUrl(`/blog/${post.slug}`),
      },
    ],
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: getAbsoluteUrl("/logo.png"),
    description:
      "Custom websites, Local SEO, AI automation, and digital growth solutions for local businesses.",
    sameAs: [
      "https://www.facebook.com/profile.php?id=61590770143173",
    ],
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Custom websites, Local SEO, AI automation, and digital growth solutions for local businesses.",
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}