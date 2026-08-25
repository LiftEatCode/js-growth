# Growth Sprint 12 — Production Acceptance

Manual GBP Insights only. **No GBP API.** Do not invent rankings or coerce blank metrics to zero.

## A. Local dashboard (after deploy)

1. Open `/reports/growth/local`  
2. Confirm no baseline metrics are invented (unknown → NOT_CAPTURED)  
3. Open actual JS Solutions Google Business Profile Insights  
4. Capture first Local Growth baseline manually  
5. Leave unavailable metrics blank  
6. Enter observed zeros as `0`  
7. Save  
8. Reload and verify persistence  

## B. Profile checklist

9. Complete checklist against actual GBP  
10. Confirm business facts are not mutated  

## C. UTM + attribution

11. Generate canonical GBP website UTM (`google_business_profile` / `organic_local` / `gbp_profile` / `website`)  
12. Update GBP website URL manually only if operator chooses  
13. Verify tagged visit captures GBP attribution  
14. Confirm generic Google organic visit remains ORGANIC_SEARCH, not GBP  

## D. Experiments + privacy

15. Review GBP-001 (only intended ACTIVE experiment)  
16. Do not activate multiple experiments unnecessarily  
17. Verify GA4 privacy (no PII / commercial IDs; `/reports/growth/local` static)  
18. Verify no external APIs fire from dashboard load (OpenAI / Meta / GSC / GBP / Places / Crawl / Resend / Stripe / Twilio = 0)

## E. First operator session outcomes

After the first production session, expect:

| Outcome | Status |
|---|---|
| LOCAL BASELINE | CAPTURED |
| PROFILE CHECKLIST | REVIEWED |
| GBP-001 PROFILE HYGIENE | COMPLETE or ACTIONS_IDENTIFIED |
| GBP-002 UTM | READY |
| NEXT GBP CONTENT | IDENTIFIED |

No ranking claim is required.

## Commands

`npm run test:verify` · `npm run test:growth` · `npm run build`

Playwright: `tests/growth/e2e/local-growth.spec.ts` (included in `npm run test:acceptance`).
