import { thaShopWebsiteRedesign } from "./tha-shop-website-redesign";

import type { ProjectCaseStudy } from "./types";

export type {
  ProjectCaseStudy,
  ProjectImage,
  ProjectLiveExample,
  ProjectLiveExamples,
} from "./types";

/**
 * Published and draft case studies. Add a new project file and register it
 * here — the /projects index, sitemap, and homepage featured section read
 * from this list.
 */
export const projects: readonly ProjectCaseStudy[] = [
  thaShopWebsiteRedesign,
];

export function getPublishedProjects(): ProjectCaseStudy[] {
  return projects.filter((project) => project.published);
}

export function getFeaturedProjects(): ProjectCaseStudy[] {
  return getPublishedProjects().filter((project) => project.featured);
}

export function getProjectBySlug(slug: string): ProjectCaseStudy | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectPath(slug: string): string {
  return `/projects/${slug}`;
}

export const PROJECT_REDIRECTS = [
  {
    source: "/projects/tha-shop",
    destination: getProjectPath("tha-shop-website-redesign"),
  },
] as const;
