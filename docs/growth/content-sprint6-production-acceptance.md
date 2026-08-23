# Growth Sprint 6 — Production Acceptance

1. Deploy application.
2. Apply migrations:
   - `20260823230000_growth_sprint6_content_plans`
   - `20260823240000_growth_sprint6_candidate_draft` (`candidateDraftJson`, `aiBusyUntil`)
3. Open `/reports/growth/content`.
4. Confirm Sprint 5 Search Intelligence still available on `/reports/growth`.
5. Confirm Recommended Next Content lists SEO service page with WHY.
6. Seed initial content plans.
7. Open `seo-service-page-v1`.
8. Confirm provenance `searchOpportunitySlug = seo-service-page`.
9. Inspect brief (intent SERVICE, topic SEO, CTA, avoid claims).
10. Confirm business facts only (no invented stats).
11. Generate skeleton draft (0 OpenAI) **or** OpenAI draft (1 call).
12. Confirm no Meta/GSC/Places/crawl/Resend/Stripe side effects.
13. Confirm claim scan flags guarantees if present.
14. Save human edit JSON.
15. Confirm **Revise with AI** and **Regenerate from Brief** remain available (human draft does not permanently disable AI).
16. Run Regenerate or Revise → confirm **AI candidate** appears separately; **human draft unchanged**.
17. Reload page → confirm candidate still present (persisted).
18. **Discard** candidate → human unchanged; **or Apply** → human becomes candidate; status still not APPROVED/PUBLISHED.
19. Approve plan.
20. Confirm AI apply/revise blocked until **Reopen for review**.
21. Do **not** auto-publish.
22. Confirm no `GrowthContentRecord` created.
23. Confirm commercial objects untouched.
24. Run `npm run test:verify`, `npm run test:commercial`, `npm run build`.

## Principle

**AI MAY PROPOSE. HUMANS CONTROL THE CANONICAL DRAFT.**
