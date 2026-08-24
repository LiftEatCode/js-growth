# Growth Sprint 7 — Production Acceptance

## A. Pre-publish

1. Confirm `seo-service-page-v1` exists  
2. Confirm status **APPROVED**  
3. Confirm `humanDraftJson` exists (preferred)  
4. Confirm unapplied AI candidate is not publication authority  
5. Confirm claims review  
6. Confirm `/seo` route ships in deploy  

## B. Deploy

7. `/seo` implemented from approved people-first content  
8. `npm run test:verify`  
9. `npm run test:commercial`  
10. `npm run build`  
11. Apply migration `20260823250000_growth_sprint7_content_performance`  
12. Deploy  

## C. Public page

13. Open `/seo`  
14. Metadata + canonical  
15. CTAs to audit/contact  
16. Internal links  
17. Service + BreadcrumbList schema (no FAQ schema)  
18. No private draft/IDs  
19. Sitemap includes `/seo`  
20. Robots: indexable; `/reports` still disallowed  

## D. Search

21. Search Console URL Inspection  
22. Record indexing state (`PUBLISHED_NOT_VERIFIED` until confirmed)  
23. Request indexing if appropriate  
24. Do not claim INDEXED until GSC confirms  

## E. Content system

25. Mark plan **PUBLISHED** with `publishedUrl=/seo`  
26. Confirm `publishedAt` + performance starts `NO_DATA` / awaiting  
27. Confirm SearchOpportunity preserved (acted on ≠ successful SEO)  
28. Confirm recommendations no longer treat `/seo` as missing  

## F. Distribution

29. Review deterministic distribution plan  
30. Create at most one Facebook company derivative plan  
31. Do not auto-publish; do not create GrowthContentRecord  

## G. Measurement

32. GA4 path `/seo`  
33. `service_cta_clicked` privacy-safe  
34. Baseline V1 unchanged  
35. Manual Search capture available when data exists  
