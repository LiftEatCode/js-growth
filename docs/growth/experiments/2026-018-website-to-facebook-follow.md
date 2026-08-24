# GROWTH-EXP-2026-018 — Website → Facebook follow loop

**Status:** QUEUED (Sprint 8 confirmation)  
**Direction:** WEBSITE → FACEBOOK (reverse of primary Sprint 3 loop)

## Sprint 8 decision

Leave 018 queued. `/seo` may still be awaiting indexing/evidence; there is still no dedicated privacy-safe “follow CTA clicked” event wiring on thank-you/contact-success, and shipping a soft link without measurement would not improve the experiment. Revisit in Sprint 9 after first INDEXED + early Search windows and a scoped CTA event design.

## Follower attribution safety

Do **not** claim website placement caused follower gain. If a CTA is added later, measure **website follow CTA click**, not “follower acquired,” unless Facebook evidence supports it.

## Objective

Convert high-intent website visitors into Facebook followers without plastering CTAs everywhere.

## Candidate placements (priority order)

1. Thank-you / post-audit completion — soft “Follow for weekly tips”  
2. Contact success page  
3. About / contact footer social link (already may exist via SEO sameAs)  
4. Resource/blog author box — company follow  
5. Email signature / post-engagement email (later)  
6. Client onboarding packet (later)

## V1 decision

Site already exposes Facebook URL via structured data (`sameAs`). **Do not** add aggressive FB CTAs sitewide this sprint.

**Safe improvement if implemented:** one soft follow link on audit thank-you / contact success only — measure with a non-PII event later if needed.

## Hypothesis

Post-conversion visitors are more likely to follow than cold homepage visitors.

## Primary metric

Facebook follows attributable to period after placement ships (manual Insights — directional)

## Secondary

Page visits; no claim of revenue causation

## Privacy

No prospect IDs in follow CTAs or analytics params.
