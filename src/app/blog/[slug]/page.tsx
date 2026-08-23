import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticleLayout } from "@/components/blog/blog-article-layout";
import { blogPosts, getBlogPost } from "@/content/blog/posts";
import {
  getAbsoluteUrl,
  getBlogPostingSchema,
  getBreadcrumbSchema,
  serializeJsonLd,
} from "@/lib/seo";

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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const articleUrl = getAbsoluteUrl(`/blog/${post.slug}`);
  const documentTitle = post.seoTitle ?? post.title;

  return {
    title: documentTitle,
    description: post.description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      title: documentTitle,
      description: post.description,
      url: articleUrl,
      siteName: "JS Solutions",
      publishedTime: post.publishedAtIso,
      modifiedTime: post.publishedAtIso,
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
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

  const structuredData = [
    getBlogPostingSchema(post),
    getBreadcrumbSchema(post),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(structuredData),
        }}
      />

      <BlogArticleLayout
        title={post.title}
        description={post.description}
        category={post.category}
        publishedAt={post.publishedAt}
        readingTime={post.readingTime}
      >
        {post.content}
      </BlogArticleLayout>
    </>
  );
}