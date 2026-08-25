# Growth Sprint 13 — Production Acceptance

**CROSS_CHANNEL_INTELLIGENCE_VERSION = 1**  
Operator checklist after deploy.

## Preflight

- [ ] `npm run test:acceptance` green (no unexpected skips)
- [ ] Docs present: research · cross-channel-intelligence · weekly-review · this checklist

## After deploy

1. Open `/reports/growth`
2. Verify **Cross-Channel Intelligence** compact card loads (`data-testid="cross-channel-compact-card"`)
3. Open `/reports/growth/intelligence`
4. Verify no external API calls on dashboard load (OPENAI/META/GSC/GBP/Places/Crawl/Resend/Stripe mutations = 0)
5. Verify NOW / NEXT / WATCH recommendations are reasonable given current evidence
6. Verify commercial attention (overdue follow-up / pending payment) outranks low-value marketing busywork when those items exist
7. Verify attribution gaps remain explicit (`attribution health` + UNKNOWN preserved)
8. Verify active experiments listed (e.g. 2026-018, GBP-001) and conflicting FB experiment not recommended
9. Verify GBP allowlisting shows as dependency / WATCH (`GBP_API_APPROVAL_PENDING`) rather than constant failure
10. Verify weekly review answers are deterministic (no fabricated % without comparable windows)
11. Spot-check GA4: no PII, commercial IDs, Google account/location IDs from growth routes
12. Run weekly review questions from `docs/growth/weekly-review.md`

## Non-goals confirmation

- [ ] No Growth Score / 0–100 composite
- [ ] No AI summary on load
- [ ] No commercial mutation from intelligence UI
- [ ] No new Prisma migration required for Sprint 13 V1

## Sign-off

| Check | Result | Notes |
|---|---|---|
| Compact card | | |
| Detail route | | |
| Priority reasonableness | | |
| Attribution honesty | | |
| Experiment protection | | |
| GBP pending WATCH | | |
| Privacy | | |
