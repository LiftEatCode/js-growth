#!/usr/bin/env bash

set -euo pipefail

title="${1:-}"

if [[ -z "$title" ]]; then
  echo 'Usage: ./scripts/new-adr.sh "Decision Title"'
  exit 1
fi

mkdir -p docs/decisions

last_number="$(
  find docs/decisions -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' |
    sed -E 's|.*/([0-9]{4})-.*|\1|' |
    sort -n |
    tail -1
)"

if [[ -z "$last_number" ]]; then
  next_number=1
else
  next_number=$((10#$last_number + 1))
fi

number="$(printf '%04d' "$next_number")"

slug="$(
  printf '%s' "$title" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
)"

file="docs/decisions/${number}-${slug}.md"

cat > "$file" <<DOC
# ADR $number: $title

## Status

Proposed

## Date

$(date '+%Y-%m-%d')

## Context

Describe the problem, constraints, and business or technical context.

## Decision

Describe the decision that was made.

## Alternatives Considered

### Alternative 1

Describe the alternative and why it was not selected.

### Alternative 2

Describe the alternative and why it was not selected.

## Consequences

### Positive

- Add positive consequences.

### Negative

- Add tradeoffs or risks.

## Follow-Up

- [ ] Add any required implementation or review tasks.

---

**Owner:** Josh Spradling  
**Company:** JS Solutions
DOC

echo "Created ADR: $file"
