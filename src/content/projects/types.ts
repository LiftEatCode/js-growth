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
