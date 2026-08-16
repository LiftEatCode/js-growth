/**
 * robots.txt parsing for this audit is intentionally simplified:
 *
 * - Only `User-agent: *` groups are used for crawlability.
 *   Bot-specific groups (Googlebot, Bingbot, etc.) are ignored.
 * - `Allow`/`Disallow` matching is prefix-based.
 *   Wildcard (`*`) and end-anchor (`$`) syntax are not interpreted.
 * - The audited URL's pathname is matched; query strings are ignored.
 * - Directives other than User-agent, Allow, Disallow, and Sitemap
 *   are ignored (Crawl-delay, Host, etc.).
 */

export interface ParsedRobotsRule {
  type: "allow" | "disallow";
  path: string;
}

export interface ParsedRobotsTxt {
  sitemapUrls: string[];
  wildcardRules: ParsedRobotsRule[];
}

function stripComment(line: string): string {
  const commentIndex = line.indexOf("#");

  if (commentIndex === -1) {
    return line;
  }

  return line.slice(0, commentIndex);
}

function parseDirective(
  line: string,
): {
  field: string;
  value: string;
} | null {
  const colonIndex = line.indexOf(":");

  if (colonIndex === -1) {
    return null;
  }

  const field = line.slice(0, colonIndex).trim().toLowerCase();
  const value = line.slice(colonIndex + 1).trim();

  if (!field) {
    return null;
  }

  return { field, value };
}

export function resolveHttpUrl(
  value: string,
  base: string,
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, base);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function parseRobotsTxt(
  body: string,
  origin: string,
): ParsedRobotsTxt {
  const sitemapUrls: string[] = [];
  const sitemapSeen = new Set<string>();

  const groups: Array<{
    userAgents: string[];
    rules: ParsedRobotsRule[];
  }> = [];

  let currentUserAgents: string[] = [];
  let currentRules: ParsedRobotsRule[] = [];
  let groupHasRules = false;

  const flushGroup = () => {
    if (
      currentUserAgents.length === 0 &&
      currentRules.length === 0
    ) {
      return;
    }

    groups.push({
      userAgents: currentUserAgents,
      rules: currentRules,
    });

    currentUserAgents = [];
    currentRules = [];
    groupHasRules = false;
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();

    if (!line) {
      continue;
    }

    const directive = parseDirective(line);

    if (!directive) {
      continue;
    }

    if (directive.field === "sitemap") {
      const sitemapUrl = resolveHttpUrl(
        directive.value,
        origin,
      );

      if (sitemapUrl && !sitemapSeen.has(sitemapUrl)) {
        sitemapSeen.add(sitemapUrl);
        sitemapUrls.push(sitemapUrl);
      }

      continue;
    }

    if (directive.field === "user-agent") {
      const userAgent = directive.value.toLowerCase();

      if (!userAgent) {
        continue;
      }

      if (groupHasRules) {
        flushGroup();
      }

      currentUserAgents.push(userAgent);
      continue;
    }

    if (
      directive.field === "allow" ||
      directive.field === "disallow"
    ) {
      groupHasRules = true;
      currentRules.push({
        type: directive.field,
        path: directive.value,
      });
    }
  }

  flushGroup();

  const wildcardRules = groups
    .filter((group) => group.userAgents.includes("*"))
    .flatMap((group) => group.rules);

  return {
    sitemapUrls,
    wildcardRules,
  };
}

export function getUrlPathname(pageUrl: string): string {
  try {
    const pathname = new URL(pageUrl).pathname;

    return pathname || "/";
  } catch {
    return "/";
  }
}

/**
 * Conservative prefix matching for `User-agent: *` rules.
 * Empty Allow/Disallow values are ignored.
 * Equal-length matches prefer Allow, so we only treat a page as
 * blocked when a Disallow rule is strictly the best match or the
 * only match.
 */
export function isPathBlockedByRobots(
  pageUrl: string,
  rules: ParsedRobotsRule[],
): boolean {
  const pathname = getUrlPathname(pageUrl);

  const matching = rules.filter(
    (rule) =>
      rule.path.length > 0 &&
      pathname.startsWith(rule.path),
  );

  if (matching.length === 0) {
    return false;
  }

  const [firstRule, ...otherRules] = matching;

  if (!firstRule) {
    return false;
  }

  let winner = firstRule;

  for (const rule of otherRules) {
    if (rule.path.length > winner.path.length) {
      winner = rule;
    } else if (
      rule.path.length === winner.path.length &&
      rule.type === "allow"
    ) {
      winner = rule;
    }
  }

  return winner.type === "disallow";
}

export function getSiteOrigin(finalPageUrl: string): string {
  const url = new URL(finalPageUrl);

  return `${url.protocol}//${url.host}/`;
}
