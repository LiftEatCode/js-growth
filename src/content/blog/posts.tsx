import { howMuchDoesASmallBusinessWebsiteCostPost } from "@/content/blog/how-much-does-a-small-business-website-cost";
import { whatIsLocalSeoPost } from "@/content/blog/what-is-local-seo";
import { whyLocalBusinessesNeedMoreThanAWebsitePost } from "@/content/blog/why-local-businesses-need-more-than-a-website";
import { whyMostSmallBusinessWebsitesDontGenerateLeadsPost } from "@/content/blog/why-most-small-business-websites-dont-generate-leads";

import type { BlogPost } from "@/content/blog/types";

export type { BlogPost } from "@/content/blog/types";

export const blogPosts: BlogPost[] = [
  whyMostSmallBusinessWebsitesDontGenerateLeadsPost,
  howMuchDoesASmallBusinessWebsiteCostPost,
  whyLocalBusinessesNeedMoreThanAWebsitePost,
  whatIsLocalSeoPost,
];

export function getBlogPost(
  slug: string,
): BlogPost | undefined {
  return blogPosts.find(
    (post) => post.slug === slug,
  );
}

export function getFeaturedPost():
  | BlogPost
  | undefined {
  return blogPosts.find(
    (post) => post.featured,
  );
}

export function getRelatedPosts(
  currentSlug: string,
  limit = 3,
): BlogPost[] {
  const currentPost =
    getBlogPost(currentSlug);

  if (!currentPost) {
    return [];
  }

  const sameCategoryPosts =
    blogPosts.filter(
      (post) =>
        post.slug !== currentSlug &&
        post.category ===
          currentPost.category,
    );

  const otherPosts =
    blogPosts.filter(
      (post) =>
        post.slug !== currentSlug &&
        post.category !==
          currentPost.category,
    );

  return [
    ...sameCategoryPosts,
    ...otherPosts,
  ].slice(0, limit);
} 