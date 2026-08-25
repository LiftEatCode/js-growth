# Growth Sprint 11 — Production Acceptance

**Do not send real customer mail to test.** Use internal session, fixture leads, and mocked Resend (`COMMERCIAL_TEST_MOCK_RESEND=1`).

## A. Attention queue

1. Sign in → `/reports/growth/follow-up`  
2. Confirm NOW / NEXT / WATCH sections render  
3. Confirm fixture inbound lead appears with acquisition channel visible  

## B. Lead activity + follow-up authority

4. Open `/reports/leads/[leadId]` for a test inbound lead  
5. Confirm acquisition channel preserved (e.g. FACEBOOK)  
6. Record PHONE_CALL / OUTBOUND activity with summary + future `nextFollowUpAt`  
7. Confirm activity appears in timeline; `followUpAt` updated  
8. Open overdue fixture lead → record activity → confirm no longer OVERDUE  

## C. Nurture (not drip)

9. Use “Move to nurture” on a lead  
10. Confirm follow-up date moves ≥ 14 days out and item deprioritized from NOW  

## D. Suppression

11. Open suppressed prospect detail  
12. Confirm outbound blocked banner + pre-suppression history visible  
13. Attempt OUTBOUND activity → confirm blocked (`do_not_contact`)  

## E. Acquisition preserved after activity

14. Record EMAIL / OUTBOUND / SENT on Facebook-attributed lead  
15. Confirm acquisition channel still FACEBOOK (activity channel ≠ acquisition)  

## F. ContactSubmission → Create Lead

16. From follow-up page, explicit **Create new Lead** on unlinked contact submission  
17. Confirm redirect to `/reports/leads/[leadId]` with attribution preserved  
18. Confirm second create unavailable (idempotent link)  

## G. Qualify without auto-opportunity

19. Mark lead QUALIFIED  
20. Confirm no automatic Opportunity created  

## H. Privacy / GA4

21. Visit `/reports/leads/[id]` and `/reports/growth/follow-up`  
22. Confirm GA4 payloads contain no lead IDs, emails, or PII  

## I. Side effects

23. Dashboard OpenAI / Meta / GSC / Places / Crawl = 0 · no autonomous Resend from follow-up UI · Stripe mutation = 0  

## Commands

`npm run test:verify` · `npm run test:growth` · `npm run build`

Playwright: `tests/growth/e2e/follow-up.spec.ts` (included in `npm run test:acceptance`).
