# Experiment 4 — Report CTA Presentation

**Experiment ID:** GROWTH-EXP-2026-004  
**Owner:** JS Solutions  
**Status:** Planned

## Hypothesis

If the professional upgrade CTA clearly states what the paid report adds, price presentation, and next step (Stripe checkout), then qualified users will click at a higher rate without reducing free report engagement.

## Channel

Post-audit report (`inline_landing`, `dedicated_report`)

## Content / Change

`ReportUpgradeCta` — benefits list, price, tax disclosure, bounded `professional_audit_cta_clicked` params (`cta_location=report_upgrade`, `report_context`).

## Primary KPI

`professional_audit_cta_clicked` / `audit_report_viewed`

## Secondary KPI

`professional_checkout_started`, paid conversions (Stripe DB)

## Guardrails

Do not cripple free report content

## Baseline

INSUFFICIENT_DATA at Baseline V1

## Start date

2026-08-23

## Decision criteria

CTA click rate improves with stable report views and no drop in `audit_report_viewed`.

## Notes

Use GA4 breakdown by `report_context` parameter once populated.
