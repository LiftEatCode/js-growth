#!/usr/bin/env bash

set -euo pipefail

title="${1:-}"

if [[ -z "$title" ]]; then
  echo 'Usage: ./scripts/new-blog.sh "Article Title"'
  exit 1
fi

slug="$(
  printf '%s' "$title" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
)"

export_name="$(
  printf '%sPost' "$slug" |
    sed -E 's/-([a-z])/\U\1/g'
)"

file="src/content/blog/${slug}.tsx"

if [[ -e "$file" ]]; then
  echo "Error: $file already exists."
  exit 1
fi

published_display="$(date '+%B %-d, %Y')"
published_iso="$(date '+%Y-%m-%d')"

cat > "$file" <<BLOG
import Link from "next/link";

import type { BlogPost } from "./types";

export const ${export_name}: BlogPost = {
  slug: "${slug}",
  title: "${title}",
  description:
    "Add a concise SEO-focused description for this article.",
  category: "Websites",
  publishedAt: "${published_display}",
  publishedAtIso: "${published_iso}",
  readingTime: "8 min read",
  featured: false,
  content: (
    <>
      <p>
        Add the article introduction here.
      </p>

      <h2>First major section</h2>

      <p>
        Add useful, original content here.
      </p>

      <h2>Frequently asked questions</h2>

      <h3>Add a relevant question</h3>

      <p>
        Add the answer here.
      </p>

      <h2>Next steps</h2>

      <p>
        Explore our <Link href="/websites">website development services</Link>{" "}
        or <Link href="/contact">contact JS Solutions</Link>.
      </p>
    </>
  ),
};
BLOG

echo
echo "Created: $file"
echo
echo "Next steps:"
echo "1. Edit the article content."
echo "2. Import ${export_name} in src/content/blog/posts.ts."
echo "3. Add ${export_name} to the blogPosts array."
echo "4. Run npm run lint && npm run build."
