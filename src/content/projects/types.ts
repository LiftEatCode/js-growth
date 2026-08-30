import type { ReactNode } from "react";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectRelatedService = {
  title: string;
  description: string;
  href: string;
};

export type ProjectLiveExample = {
  title: string;
  description: string;
  url: string;
  /** Visible CTA / accessible name. Prefer natural anchors over repeated keywords. */
  linkLabel?: string;
};

export type ProjectLiveExamples = {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: readonly ProjectLiveExample[];
};

export type ProjectTechnology = {
  name: string;
  outcome: string;
};

export type ProjectNarrativeSection = {
  id: string;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  points?: readonly string[];
  items?: readonly {
    title: string;
    description: ReactNode;
  }[];
};

export type ProjectCaseStudy = {
  slug: string;
  client: string;
  title: string;
  seoTitle: string;
  description: string;
  cardSummary: string;
  industry: string;
  location: string;
  projectTypes: readonly string[];
  liveUrl?: string;
  liveUrlLabel?: string;
  /**
   * Public analytics slug for live-site clicks (e.g. "tha-shop").
   * Not a database ID — `project_id` is forbidden in analytics params.
   */
  liveSiteId?: string;
  featured: boolean;
  published: boolean;
  publishedAtIso: string;
  /** Optional screenshot. Omit until a legitimate project capture is available. */
  image?: ProjectImage;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  overview: {
    client: string;
    industry: string;
    location: string;
    projectTypes: readonly string[];
  };
  challenge: {
    eyebrow: string;
    title: string;
    description: ReactNode;
    points: readonly string[];
  };
  solution: {
    eyebrow: string;
    title: string;
    description: ReactNode;
    items: readonly {
      title: string;
      description: ReactNode;
    }[];
  };
  liveExamples?: ProjectLiveExamples;
  sections: readonly ProjectNarrativeSection[];
  beforeAfter: {
    beforeTitle: string;
    afterTitle: string;
    before: readonly string[];
    after: readonly string[];
  };
  technologies: readonly ProjectTechnology[];
  nextSteps: {
    eyebrow: string;
    title: string;
    description: ReactNode;
    points: readonly string[];
  };
  relatedServices: readonly ProjectRelatedService[];
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
};
