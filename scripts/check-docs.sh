#!/usr/bin/env bash

set -euo pipefail

errors=0

required_files=(
  "README.md"
  "ROADMAP.md"
  "PROJECTS.md"
  "PRINCIPLES.md"
  "VISION-2030.md"
  "docs/README.md"
  "docs/company/mission.md"
  "docs/company/vision.md"
  "docs/company/values.md"
  "docs/company/branding-guide.md"
  "docs/company/elevator-pitch.md"
)

echo "Checking required documentation..."

for file in "${required_files[@]}"; do
  if [[ -s "$file" ]]; then
    echo "OK: $file"
  else
    echo "MISSING OR EMPTY: $file"
    errors=$((errors + 1))
  fi
done

echo
echo "Checking for documentation accidentally stored in src..."

if [[ -d "src/docs" ]]; then
  echo "ERROR: src/docs exists. Documentation belongs in ./docs."
  errors=$((errors + 1))
else
  echo "OK: no src/docs directory."
fi

echo
echo "Checking for empty Markdown files..."

empty_files="$(
  find docs -type f -name '*.md' -empty -print 2>/dev/null || true
)"

if [[ -n "$empty_files" ]]; then
  echo "$empty_files"
  echo
  echo "Note: empty placeholders were found."
else
  echo "OK: no empty Markdown files."
fi

echo
echo "Documentation file count:"
find docs -type f -name '*.md' | wc -l

if [[ "$errors" -gt 0 ]]; then
  echo
  echo "Documentation check failed with $errors blocking issue(s)."
  exit 1
fi

echo
echo "Documentation check passed."
