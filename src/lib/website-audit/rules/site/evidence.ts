import { SITE_FINDING_EXAMPLE_CAP } from "../../site/constants";

export function formatPathExamples(paths: string[]): string {
  const unique = [...new Set(paths)].slice(0, SITE_FINDING_EXAMPLE_CAP);

  if (unique.length === 0) {
    return "";
  }

  return unique.map((path) => `- ${path}`).join("\n");
}

export function joinedExamples(paths: string[]): string {
  return [...new Set(paths)]
    .slice(0, SITE_FINDING_EXAMPLE_CAP)
    .join(", ");
}
