import type { BlogPost } from "@/content/blog/posts";
import type { ProjectCaseStudy } from "@/content/projects";

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

export function getServiceSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: getAbsoluteUrl(input.path),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "United States",
    },
  };
}

export function getServiceBreadcrumbSchema(input: {
  name: string;
  path: string;
}) {
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
        name: "Services",
        item: getAbsoluteUrl("/services"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: input.name,
        item: getAbsoluteUrl(input.path),
      },
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

export function getCaseStudyWebPageSchema(project: ProjectCaseStudy) {
  const pageUrl = getAbsoluteUrl(`/projects/${project.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: project.title,
    description: project.description,
    url: pageUrl,
    datePublished: project.publishedAtIso,
    dateModified: project.publishedAtIso,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      "@type": "Organization",
      name: project.client,
      ...(project.liveUrl ? { url: project.liveUrl } : {}),
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

export function getCaseStudyBreadcrumbSchema(project: ProjectCaseStudy) {
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
        name: "Work",
        item: getAbsoluteUrl("/projects"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.client,
        item: getAbsoluteUrl(`/projects/${project.slug}`),
      },
    ],
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}