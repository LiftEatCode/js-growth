# Growth Sprint 6 — Production Acceptance

1. Deploy application.
2. Apply migration `20260823230000_growth_sprint6_content_plans`.
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
14. Save human edit JSON; confirm regenerate blocked while human draft exists.
15. Approve plan.
16. Do **not** auto-publish.
17. Confirm no `GrowthContentRecord` created.
18. Confirm commercial objects untouched.
19. Run `npm run test:verify`, `npm run test:commercial`, `npm run build`.
