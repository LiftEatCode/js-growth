import { whatIsLocalSeoPost } from "./what-is-local-seo";
import type { BlogPost } from "./types";
import { whyLocalBusinessesNeedMoreThanAWebsitePost } from "./why-local-businesses-need-more-than-a-website";

export type { BlogPost } from "./types";

export const blogPosts: BlogPost[] = [
  whyLocalBusinessesNeedMoreThanAWebsitePost,
  whatIsLocalSeoPost,
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured);
}

export function getRelatedPosts(
  currentSlug: string,
  limit = 3,
): BlogPost[] {
  const currentPost = getBlogPost(currentSlug);

  if (!currentPost) {
    return [];
  }

  const sameCategoryPosts = blogPosts.filter(
    (post) =>
      post.slug !== currentSlug && post.category === currentPost.category,
  );

  const otherPosts = blogPosts.filter(
    (post) =>
      post.slug !== currentSlug && post.category !== currentPost.category,
  );

  return [...sameCategoryPosts, ...otherPosts].slice(0, limit);
}