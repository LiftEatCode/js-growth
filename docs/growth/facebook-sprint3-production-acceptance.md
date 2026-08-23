# Production Acceptance — Growth Sprint 3 (Facebook Organic)

Operator steps after deploy. Do not skip Baseline V1 verification.

1. Deploy application (includes Prisma migration `20260823180000_add_growth_content_record`).
2. Open `/reports/growth` (internal auth).
3. Verify **Growth Baseline V1** Facebook block unchanged: followers 75, visits 9, engagements 5, non-follower 95.3%, photo 90.3%, total views NOT_CAPTURED.
4. Verify **Facebook** panel renders (`facebook-growth-v1`), scorecard layers, experiments list.
5. Record a current FACEBOOK `GrowthSnapshot` via snapshot form (property `js_solutions_page`). Leave unknown metrics omitted (NOT_CAPTURED).
6. Create/record one **COMPANY** content item (job + pillar + format + slug).
7. Create/record one **FOUNDER** content item.
8. Generate separate UTM links in `/reports/growth/utm-builder` (Facebook Page + Founder presets) with matching `company_*` / `founder_*` content.
9. Visit each link (incognito OK) landing on `/website-audit` (or intended URL).
10. Verify GA4 / first-party attribution separation (source/medium/campaign/content). Confirm company vs founder classification after an audit submit when possible.
11. Confirm no commercial IDs / PII / secure tokens in GA4 DebugView event params or page_path.
12. Confirm Facebook metric blanks remain NOT_CAPTURED (not coerced to 0) in ledger/UI.
13. Confirm commercial pipeline unchanged (create/view Opportunity/Proposal/Agreement — no growth mutations).

## Side-effect budget (dashboard load)

OpenAI: 0 · Places: 0 · crawl: 0 · Resend: 0 · Stripe: 0 · Meta API: 0
