# Experiment 1 — Audit Landing Hero / Value Proposition

**Experiment ID:** GROWTH-EXP-2026-001  
**Owner:** JS Solutions  
**Status:** Planned

## Hypothesis

If we clarify who the audit is for, how long it takes, and that there are no ranking guarantees in the hero, then more qualified visitors will start the audit because the offer matches their intent.

## Channel

Organic search / Direct / Facebook (future) / GBP

## Content / Change

Hero subcopy on `/website-audit` — audience, ~2 minute estimate, no guarantees (Sprint 2 baseline variant).

## Primary KPI

`audit_started` / `audit_landing_view` (GA4)

## Secondary KPI

`audit_submitted`, bounce rate

## Baseline

Period: Growth Baseline V1 window (2026-07-26 → 2026-08-22)  
Source: GA4 Realtime + internal audits  
Baseline values: INSUFFICIENT_DATA for rates — monitor event counts only

## Start date

2026-08-23 (Sprint 2 deploy)

## End / review date

Review after ≥30 `audit_landing_view` events or 14 days — whichever is later

## Variant

**Control:** Pre-Sprint 2 hero (historical — Baseline V1)  
**Variant A:** Sprint 2 hero copy (current)

## Guardrails

- No increase in invalid URL errors
- No decrease in `audit_report_viewed` among completers

## Decision criteria

Proceed if `audit_started` rate improves ≥10% relative with stable submission quality; otherwise iterate copy or revert.

## Notes

Traffic too low for simultaneous A/B — use **sequential** measurement with bounded windows.
