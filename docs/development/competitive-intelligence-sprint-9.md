# Competitive Intelligence — Sprint 9

Internal research foundation for Prospecting Engine V1. This is **not** a customer-facing product.

## Competitor definition

A Google Places result is **not** automatically a competitor.

Pipeline:

1. Build a deterministic competitive profile from the Prospect + campaign.
2. Discover candidates with Google Places (New) Text Search.
3. Normalize and dedupe.
4. Validate with explainable scores.
5. Recommend up to 3.
6. Human review selects or rejects.
7. Stop. Competitor website audits are Sprint 10 (`CompetitorAudit`), not public reports.

`CANDIDATE` / `VALIDATED` remain separate from human `SELECTED`.

## Competitor ≠ prospect

A discovered competitor is a research subject. Sprint 9 does **not**:

- add the company to the campaign
- qualify it as a sales prospect
- find contacts
- generate outreach
- send email
- submit a contact form
- run a Website Growth Audit (Sprint 10 adds **internal** CompetitorAudit snapshots only)

If that company later enters prospecting independently, normal prospect workflows apply.

Known customers and Leads can still appear as competitors. That does not grant outreach eligibility.

## Vertical taxonomy

Reusable module: `src/lib/business-intelligence/verticals/`.

V1 verticals: HVAC, PLUMBING, ELECTRICAL, ROOFING, LANDSCAPING, AUTO_REPAIR, CONSTRUCTION, LEGAL, DENTAL, MEDICAL, RESTAURANT, HOME_SERVICES, OTHER.

A business may map to multiple verticals. Strong name/industry keywords override a generic Places type such as `general_contractor` or “Services”.

## Competitive profile

Derived, not stored as its own table. Inputs: Prospect name/website/hostname/industry/location, campaign location/radius/industries, stored Places category/coordinates when available.

Search terms are built from normalized verticals, not raw Places types. Example for electrical in Pinehurst, TX:

- electrician near Pinehurst, TX
- electrical contractor near Pinehurst, TX
- electrical services near Pinehurst, TX

## Validation (0–100, no AI)

| Factor | Max | Notes |
|---|---|---|
| Vertical match | 40 | Strong overlap required |
| Geography | 25 | Haversine vs campaign radius |
| Service/type overlap | 15 | Name + Places category |
| Public website | 10 | Positive; missing does not auto-reject |
| Local service signals | 10 | City/state/coordinates |

Hard reject: same hostname/Place ID, unrelated vertical, supplier/retailer keywords, distance > 2× radius (`outside_market`).

Labels: STRONG ≥ 80, LIKELY ≥ 60, WEAK ≥ 40, else REJECTED.

Evidence JSON is persisted (matched verticals, scores, band, rejection reasons).

## Geography

Default radius is 25 miles when the campaign has none.

- very near: ≤ 0.4 × radius
- near: ≤ radius
- regional: ≤ 2 × radius
- distant: > 2 × radius (rejected)

Closer candidates outrank equal scores.

## Ranking / human review

Order: `validationScore DESC`, `distance ASC`, `businessName ASC`, Place ID ASC.

Recommended Top 3 are `isRecommended` on validated rows only. Human `SELECTED` is separate and capped at 3. Selection does not change the stored validation score.

## Cost limits

| Constant | Value |
|---|---|
| MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN | 5 |
| MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT | 3 |
| MAX_COMPETITOR_CANDIDATES_PER_PROSPECT | 10 |
| MAX_SELECTED_COMPETITORS_PER_PROSPECT | 3 |
| COMPETITOR_DISCOVERY_CONCURRENCY | 2 |
| COMPETITOR_DISCOVERY_TTL | 30 days |

Human trigger only. No scheduler. No OpenAI. No audits. No Resend.

## TTL

Recent usable discovery is reused for 30 days. Prospect **Re-run Discovery** sets `force` and refreshes without duplicating Place IDs.

## Privacy

Internal session required. Google key stays server-only. Competitor rows are not exposed on public reports, PDFs, Stripe, or analytics.
