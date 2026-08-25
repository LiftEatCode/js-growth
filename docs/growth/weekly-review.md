# Weekly Growth Conversion Review

Do not manufacture daily busywork. Review weekly (or when a window matures).

## Questions

1. What generated **inbound** leads vs **outbound** prospects?
2. What generated opportunities?
3. Where is attribution UNKNOWN vs DIRECT vs known channel? What is acquisition coverage?
4. Where is funnel drop-off — and is the sample usable?
5. Which leads/opportunities need attention?
6. Which content slugs show a **business signal** (not “SEO worked”)?
7. Which channels show a business signal — with sample label visible?
8. Are Facebook/GBP posts that need website traffic using canonical tagged URLs?
9. What should we do NEXT week (bounded NOW / NEXT / WATCH)?
10. Which follow-ups are overdue or due today (`/reports/growth/follow-up`)?
11. What is first-response median (28d)? Is sample `INSUFFICIENT_DATA` or usable?
12. Any stale inbound leads (age band STALE) or qualified leads without opportunities?
13. Any contact submissions still awaiting explicit Create Lead?
14. Did we record activities without confusing acquisition channel with activity type?
15. Did we run **Sync Profile** + **Sync Performance** on `/reports/growth/local` this week (when connected)? Fall back to manual Insights only if disconnected. Blank = NOT_CAPTURED; `0` = observed zero.
16. Any GBP checklist exceptions (NEEDS_ATTENTION / MISMATCH / subjective NOT_REVIEWED) vs business facts?
17. Is GBP-001 still the active experiment — reviewing sync exceptions only, not re-typing API fields?

## Rules

- Never mix outbound prospecting counts with inbound website leads.
- Unknown attribution is useful — do not hide it. Do not force UNKNOWN into DIRECT.
- DIRECT is classified; it is not a catch-all for broken tracking.
- ROI_NOT_AVAILABLE until cost + strong revenue attribution exist.
- Growth Baseline V1 remains immutable.
- No auto-email, auto-status, auto-opportunity.
- Do not rewrite historical UNKNOWN audits.
- Do not invent GBP metrics or Map pack rankings. GSC ≠ GBP Insights.

Operator UI: `/reports/growth/conversion` · `/reports/growth/attribution` · `/reports/growth/follow-up` · `/reports/growth/local` · UTM builder
