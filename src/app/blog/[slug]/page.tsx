import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticleLayout } from "@/components/blog/blog-article-layout";
import { blogPosts, getBlogPost } from "@/content/blog/posts";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Article Not Found",
    };
  }

  const canonicalUrl = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.publishedAtIso,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <BlogArticleLayout
      title={post.title}
      description={post.description}
      category={post.category}
      publishedAt={post.publishedAt}
      readingTime={post.readingTime}
    >
      {post.content}
    </BlogArticleLayout>
  );
}