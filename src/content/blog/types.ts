import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  publishedAtIso: string;
  readingTime: string;
  featured?: boolean;
  content: ReactNode;
};