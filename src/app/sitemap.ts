import type { MetadataRoute } from "next";

import { blogPosts } from "@/content/blog/posts";
import { getAbsoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "",
  "/about",
  "/ai-automation",
  "/blog",
  "/contact",
  "/growth-system",
  "/investment",
  "/local-seo",
  "/projects",
  "/projects/tha-shop",
  "/services",
  "/websites",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: getAbsoluteUrl(route || "/"),
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1
        : route === "/services" ||
            route === "/websites" ||
            route === "/local-seo" ||
            route === "/ai-automation"
          ? 0.9
          : 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: getAbsoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.publishedAtIso),
    changeFrequency: "monthly",
    priority: post.featured ? 0.8 : 0.7,
  }));

  return [...staticPages, ...blogPages];
}