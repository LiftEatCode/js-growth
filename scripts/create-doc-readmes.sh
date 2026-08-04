#!/usr/bin/env bash

set -euo pipefail

folders=(
  "docs/company"
  "docs/services"
  "docs/development"
  "docs/marketing"
  "docs/seo"
  "docs/sales"
  "docs/playbooks"
  "docs/templates"
  "docs/decisions"
  "docs/ideas"
)

for folder in "${folders[@]}"; do
  mkdir -p "$folder"

  readme="$folder/README.md"

  if [[ -f "$readme" ]]; then
    echo "Skipped existing: $readme"
    continue
  fi

  name="$(basename "$folder" | tr '-' ' ')"
  title="$(printf '%s' "$name" | sed -E 's/(^| )([a-z])/\1\U\2/g')"

  cat > "$readme" <<DOC
# $title

> Documentation for the $title section of the JS Solutions knowledge base.

## Purpose

This section contains standards, processes, references, and operating
documentation related to $title.

## Contents

Review the files and directories in this section for detailed documentation.

## Related Documentation

Return to the main documentation index:

- [Documentation Home](../README.md)

---

**Owner:** Josh Spradling  
**Company:** JS Solutions  
**Status:** Living Documentation  
**Last Updated:** August 2026
DOC

  echo "Created: $readme"
done
