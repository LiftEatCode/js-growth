import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseStudyView } from "@/components/projects/case-study-view";
import {
  getProjectBySlug,
  getProjectPath,
  getPublishedProjects,
} from "@/content/projects";
import {
  getAbsoluteUrl,
  getCaseStudyBreadcrumbSchema,
  getCaseStudyWebPageSchema,
  serializeJsonLd,
} from "@/lib/seo";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPublishedProjects().map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.published) {
    return {
      title: "Project Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = getAbsoluteUrl(getProjectPath(project.slug));
  const documentTitle = project.seoTitle;
  const images = project.image
    ? [
        {
          url: project.image.src,
          alt: project.image.alt,
          width: project.image.width,
          height: project.image.height,
        },
      ]
    : undefined;

  return {
    title: documentTitle,
    description: project.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: documentTitle,
      description: project.description,
      url: canonical,
      siteName: "JS Solutions",
      publishedTime: project.publishedAtIso,
      modifiedTime: project.publishedAtIso,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description: project.description,
      ...(project.image
        ? { images: [project.image.src] }
        : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.published) {
    notFound();
  }

  const structuredData = [
    getCaseStudyWebPageSchema(project),
    getCaseStudyBreadcrumbSchema(project),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(structuredData),
        }}
      />
      <CaseStudyView project={project} />
    </>
  );
}
