# GROWTH-EXP-2026-018 — Website → Facebook follow loop

**Status:** ACTIVE (Growth Sprint 10)  
**Direction:** WEBSITE → FACEBOOK (not Facebook→website acquisition)

## Sprint 10 decision

Ship a **soft** follow CTA on high-intent post-conversion surfaces only:

1. Audit completion (inline results)  
2. Contact form success  

Event: `facebook_follow_cta_clicked` with privacy-safe params (`placement`, `surface`, `experiment_id`, `cta_location`).

**Click ≠ follower acquired.** Do not claim website placement caused a follow unless Facebook Insights evidence supports a directional period claim.

No sitewide popup, homepage interruption, or forced modal.

Destination URL: Organization `sameAs` Facebook Page (`JS_SOLUTIONS_FACEBOOK_PAGE_URL`).

## Objective

Convert high-intent website visitors into Facebook followers without plastering CTAs everywhere.

## Hypothesis

Post-conversion visitors are more likely to follow than cold homepage visitors.

## Primary metric

`facebook_follow_cta_clicked` volume (first-party / GA4). Follower counts remain manual Insights — directional only.

## Privacy

No prospect IDs, audit IDs, emails, or secure tokens in the event.
