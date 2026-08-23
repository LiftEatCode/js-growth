# Production Acceptance — Growth Sprint 4

1. Deploy (includes migration `20260823210000_growth_sprint4_checkpoints`).
2. Confirm migration applied.
3. Open `/reports/growth`.
4. Confirm Baseline V1 Facebook block unchanged (75 / 9 / 5 / 95.3% / 90.3% / NOT_CAPTURED).
5. Confirm `company_seo_mistakes_001` appears once.
6. Open Edit / Record Metrics on that row.
7. Update metrics (e.g. views) with checkpoint HOURS_72.
8. Confirm still one GrowthContentRecord for that utm_content.
9. Confirm HOURS_72 checkpoint shows YES.
10. Optionally record DAYS_7 after window (or on a test row).
11. Leave one metric blank → NOT_CAPTURED; set comments=0 → observed zero.
12. Create one COMPANY future content record.
13. Create one FOUNDER future content record.
14. Generate UTM links (page_organic/company_* vs founder_content/founder_*).
15. Verify company/founder classification on attribution after visits.
16. Verify due-for-measurement queue lists due rows when windows pass.
17. Verify weekly review prompts + follower scorecard bands.
18. Verify target progress uses NOT CAPTURED when no current snapshot followers.
19. Verify GA4 privacy (no commercial IDs / PII / tokens).
20. Run `npm run test:commercial`.
21. Confirm Meta/OpenAI/Places/crawl/Resend/Stripe = 0 on dashboard load.

Side-effect budget: Meta API 0 · OpenAI 0 · Places 0 · crawl 0 · Resend 0 · Stripe 0.
