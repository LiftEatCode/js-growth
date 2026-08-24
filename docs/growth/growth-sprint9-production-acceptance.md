# Growth Sprint 9 — Production Acceptance

## A. Dashboard

1. Open `/reports/growth`
2. Confirm Lead Conversion compact + section
3. Confirm inbound vs outbound are separate
4. Confirm UNKNOWN attribution is visible
5. Confirm counts match commercial DB for the same window

## B. Funnel

6. Open `/reports/growth/conversion`
7. Confirm no fake rates (INSUFFICIENT_DATA when n small)
8. Confirm known zeros remain 0
9. Confirm CONTACT / qualified visits NOT CAPTURED
10. Confirm clients / page views is NOT CAPTURED

## C. Attention

11. Confirm queue items link to `/reports`, `/reports/opportunities/...`
12. Confirm no automatic commercial mutations on load
13. Confirm NOW/NEXT/WATCH is bounded

## D. Attribution

14. Inspect a public audit with UTMs — channel classifies
15. Missing UTM stays UNKNOWN or DIRECT as documented
16. No invented first/latest touch history
17. GBP is NOT_CAPTURED without GBP UTMs

## E. Content

18. Content review may show BUSINESS_SIGNAL facts
19. `/seo` is not marked successful from empty joins
20. Facebook business feedback uses attributed audits only

## F. Privacy / side effects

21. GA4 still redacts commercial IDs / PII / tokens
22. Dashboard OpenAI/Meta/GSC/Places/Crawl/Resend/Stripe mutation = 0

## Commands

`npm run test:verify` · `npm run test:commercial` · `npm run build`
