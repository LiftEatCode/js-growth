#!/usr/bin/env bash

set -euo pipefail

name="${1:-}"

if [[ -z "$name" ]]; then
  echo 'Usage: ./scripts/new-service.sh "Service Name"'
  exit 1
fi

slug="$(
  printf '%s' "$name" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
)"

directory="docs/services/$slug"

if [[ -e "$directory" ]]; then
  echo "Error: $directory already exists."
  exit 1
fi

mkdir -p \
  "$directory/phases" \
  "$directory/checklists" \
  "$directory/templates" \
  "$directory/examples"

cat > "$directory/README.md" <<DOC
# $name Service Playbook

## Purpose

This playbook defines how JS Solutions qualifies, plans, delivers, measures,
and supports the $name service.

## Service Objectives

- Solve a real business problem.
- Deliver measurable business value.
- Follow a repeatable process.
- Maintain JS Solutions quality standards.
- Create opportunities for long-term improvement.

## Playbook Structure

- Discovery
- Qualification
- Planning
- Implementation
- Quality Assurance
- Launch or Delivery
- Maintenance
- Pricing
- Frequently Asked Questions

---

**Owner:** Josh Spradling  
**Company:** JS Solutions  
**Status:** Draft  
**Version:** 1.0  
**Last Updated:** August 2026
DOC

touch \
  "$directory/phases/01-discovery.md" \
  "$directory/phases/02-qualification.md" \
  "$directory/phases/03-planning.md" \
  "$directory/phases/04-implementation.md" \
  "$directory/phases/05-quality-assurance.md" \
  "$directory/phases/06-delivery.md" \
  "$directory/phases/07-maintenance.md" \
  "$directory/checklists/qa.md" \
  "$directory/checklists/delivery.md" \
  "$directory/templates/proposal.md" \
  "$directory/templates/questionnaire.md" \
  "$directory/pricing.md" \
  "$directory/faq.md"

echo "Created service playbook: $directory"
