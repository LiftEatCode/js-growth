"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import {
  GROWTH_EVENTS,
  trackGrowthEvent,
  type ProjectLiveSiteSurface,
} from "@/lib/growth";

type ProjectLiveSiteLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
  /** Public client slug, e.g. "tha-shop". Never a database ID. */
  project?: string;
  surface: ProjectLiveSiteSurface;
};

export const ProjectLiveSiteLink = forwardRef<
  HTMLAnchorElement,
  ProjectLiveSiteLinkProps
>(function ProjectLiveSiteLink(
  { href, project, surface, onClick, children, ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (project) {
          trackGrowthEvent(GROWTH_EVENTS.projectLiveSiteClicked, {
            project,
            surface,
          });
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
});
