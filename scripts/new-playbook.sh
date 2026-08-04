#!/usr/bin/env bash

set -euo pipefail

name="${1:-}"

if [[ -z "$name" ]]; then
  echo 'Usage: ./scripts/new-playbook.sh "Playbook Name"'
  exit 1
fi

slug="$(
  printf '%s' "$name" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
)"

file="docs/playbooks/${slug}.md"

if [[ -e "$file" ]]; then
  echo "Error: $file already exists."
  exit 1
fi

cat > "$file" <<DOC
# $name

## Purpose

Describe why this playbook exists and the business outcome it supports.

## Trigger

Describe when this playbook should be used.

## Owner

Josh Spradling

## Inputs

- Required information
- Required access
- Required approvals

## Procedure

1. Complete the first step.
2. Verify the result.
3. Continue through the documented workflow.
4. Record meaningful decisions.
5. Confirm the exit criteria.

## Quality Checks

- [ ] Work follows JS Solutions standards.
- [ ] Required information is documented.
- [ ] Client-facing work has been reviewed.
- [ ] Results have been tested.
- [ ] Follow-up actions have been assigned.

## Exit Criteria

Describe what must be true before this process is considered complete.

## Related Documentation

Add links to related services, templates, and checklists.

---

**Status:** Draft  
**Version:** 1.0  
**Last Updated:** August 2026
DOC

echo "Created playbook: $file"
