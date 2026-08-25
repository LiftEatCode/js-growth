# Growth Sprint 12.1 — Production Acceptance

**GBP Read Integration V1.** Real operator setup. Manual Insights baseline from Sprint 12 remains valid.

Setup: [`../development/google-business-profile.md`](../development/google-business-profile.md)  
Operating: [`gbp-api-integration.md`](gbp-api-integration.md)

## A. Google Cloud

1. Create/select Google Cloud project  
2. Enable APIs: Account Management, Business Information, Performance, Google My Business (v4)  
3. Configure OAuth consent + Web client  
4. Set redirect URI → `/api/gbp/oauth/callback` (prod + local)  
5. Configure env: `GOOGLE_GBP_CLIENT_ID` / `SECRET` / `REDIRECT_URI`, `GOOGLE_GBP_TOKEN_ENCRYPTION_KEY` (or session-secret fallback)  
6. Deploy + apply migration `20260825120000_growth_sprint12_1_gbp_read`  

If Performance quota is **0**, request GBP API access before Sync Performance.

## B. Connection

7. Open `/reports/growth/local`  
8. Click **Connect Google Business Profile**  
9. Authenticate the Google account that manages JS Solutions  
10. Confirm scope `https://www.googleapis.com/auth/business.manage`  
11. Return to JS Growth  
12. Select the JS Solutions profile / location  

## C. Profile

13. Click **Sync Profile**  
14. Verify business name  
15. Verify categories (relevance still human)  
16. Verify description observed  
17. Verify website  
18. Verify phone / hours / service area where available  
19. Confirm home/private storefront address is not exposed unnecessarily  
20. Confirm checklist populated (objective matches + subjective NOT_REVIEWED / UNSUPPORTED_FOR_V1)  

## D. Performance

21. Click **Sync Performance**  
22. Compare API numbers with GBP Insights UI for the same window  
23. Document small platform aggregation differences — do **not** “fix” by mutating Google  
24. Verify latest snapshot provenance = **API**  
25. Verify prior **manual** baseline snapshots remain  

## E. Reputation

26. Confirm review count / average rating if API returns them  
27. Confirm no reviewer names or review text stored  

## F. GBP-001

28. Review only exceptions and subjective checklist items (pause bulk manual typing)  
29. Mark remaining legitimate checks manually  

## G. GBP-002

30. Detect whether website URL lacks canonical UTM  
31. Do **not** automatically modify GBP  
32. Operator may later update the website URL in Google manually  

## H. Security

33. Inspect server/client responses for the local page  
34. No refresh/access token, `client_secret`, or ciphertext fields rendered  
35. Disconnect test optional after initial acceptance (history preserved)  
36. GA4 receives no Google IDs / tokens (`/reports/growth/local` static)  

Also confirm: dashboard / local **page load** GBP API = **0**; OpenAI / Meta / GSC / Places / Crawl / Resend / Stripe = 0 on load.

## Commands

`npm run test:verify` · `npm run test:growth` · `npm run build`

Playwright: `tests/growth/e2e/gbp-read.spec.ts` with `GROWTH_TEST_MOCK_GBP=1` (included via `test:growth` / `test:acceptance`).
