import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  /** Optional document title for `<title>` / OG when distinct from H1. */
  seoTitle?: string;
  description: string;
  category: string;
  publishedAt: string;
  publishedAtIso: string;
  readingTime: string;
  featured?: boolean;
  content: ReactNode;
};