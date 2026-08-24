# Growth Sprint 8 — Production Acceptance

## A. /seo

1. Confirm `/seo` exists or handle NOT_PUBLISHED safely  
2. Confirm plan publication state  
3. Record indexing state (do not claim INDEXED without GSC)  
4. Record Search evidence only if available — **NO_DATA is valid**  

## B. Review

5. Confirm next review checkpoint  
6. Confirm `/seo` is not immediately a refresh candidate  
7. Record early review with KEEP_MONITORING  
8. Confirm append-only history  

## C. Search data

9. Record manual page data  
10. Zeros preserved; unknown query status preserved  
11. CTR mismatch rejected  

## D. Feedback

12. Missing-page recommendation stays resolved  
13. Supporting ideas listed without duplicating `/seo`  
14. Refresh plan requires REFRESH_CONTENT decision + sufficient evidence  

## E. Facebook

15. Sprint 4 window unchanged  
16. Experiment 018 remains QUEUED  
17. Derivatives still do not auto-create GrowthContentRecord  

## F. Privacy / side effects

18. No IDs/tokens/PII in events  
19. Dashboard OpenAI/Meta/GSC API = 0  
20. Record Review = 0 external calls  

## Commands

`npm run test:verify` · `npm run test:commercial` · `npm run build`
