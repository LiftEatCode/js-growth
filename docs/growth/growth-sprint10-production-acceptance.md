# Growth Sprint 10 — Production Acceptance

## A. Facebook → Audit

1. Copy FB Company Audit URL from UTM builder  
2. Fresh/private browser → open tagged URL  
3. Navigate `/seo` → blog → `/website-audit`  
4. Complete safe test audit  
5. Confirm FACEBOOK channel + utm_content preserved  
6. Confirm GA4 has no PII/commercial IDs  

## B. Direct → Audit

7. Fresh context → open `/website-audit` directly  
8. Confirm DIRECT (or UNKNOWN if context missing) — do not force a channel  

## C. Contact

9. Tagged Facebook link → Contact → submit controlled test  
10. Confirm Resend email still works  
11. Confirm `ContactSubmission` row + attributionJson  
12. Confirm no PII in GA4  

## D. GBP

13. Generate GBP Website URL  
14. Fresh browser → confirm GBP classification  
15. Historical GBP remains NOT_CAPTURED until tagged evidence exists  

## E. Historical safety

16. Confirm prior UNKNOWN audits remain UNKNOWN (no rewrite)  

## F. Experiment 018

17. Soft follow CTA on audit complete / contact success  
18. Click → `facebook_follow_cta_clicked`  
19. System does **not** claim follower acquired  

## G. Side effects

20. Dashboard OpenAI/Meta/GSC/Places/Crawl = 0 · Stripe mutation = 0  

## Commands

`npm run test:verify` · `npm run test:commercial` · `npm run build`
