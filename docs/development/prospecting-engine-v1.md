# Prospecting Engine V1

Internal notes for JS Solutions outbound prospecting. This is **not** a customer-facing product.

Current status: **Sprint 2 — Google Places Business Discovery**

## Product principle

Optimize for **five credible, qualified prospects**, not five emails sent.

Skip is a success state when:

- audit evidence is weak
- no credible outreach finding exists
- contact information is unreliable
- the business was already contacted or is a customer
- the site audit fails
- findings appear misleading
- the business does not match the campaign

Discovery (Sprint 2) also optimizes for a **useful candidate pool**, not maximum Google API usage. The product is pre-revenue; cost control is a first-class requirement.

## Prospect ≠ Lead

A `Prospect` is a discovered **business**.

It is not:

- a `Lead` (person + inbound CRM pipeline)
- an `AuditReport`
- the inbound `/reports` concept of an `AuditReport` without a `Lead`

Businesses in `/reports/prospecting` stay out of the inbound audit/lead board until a human converts them later.

## Human approval

Sending remains:

**Find → Audit → Qualify → Draft → HUMAN APPROVAL → Send**

V1 is not autonomous outbound. Sprint 2 adds Find (Google Places) with a second human gate: **Import Selected Prospects**. Discovery never auto-imports.

## Planned stages

| Sprint | Goal | Status |
|---|---|---|
| 1 | Data foundation + manual prospect UI | Complete |
| 2 | Legitimate business discovery provider | Complete |
| 3 | Deterministic Website Growth Audit qualification | Not started |
| 4 | Public contact discovery + outreach drafts | Not started |
| 5 | Approval + Resend sending | Not started |
| 6 | Tracking, Lead conversion, hardening | Not started |

## Routes

Internal, session-gated, `noindex`:

- `/reports/prospecting`
- `/reports/prospecting/new`
- `/reports/prospecting/[campaignId]`
- `/reports/prospecting/[campaignId]/discovery/[runId]`
- `/reports/prospecting/[campaignId]/prospects/new`
- `/reports/prospecting/[campaignId]/prospects/[prospectId]`

## Sprint 1 — Manual workspace

Operator-driven:

1. Create a campaign (location, industries, desired qualified count).
2. Add businesses by hand.
3. Edit notes and details.
4. Skip poor fits with a reason.
5. Warn on duplicate hostnames.

Manual add still exists. The five Soft Launch Batch 1 businesses remain untouched; discovery classifies matching hostnames as already in the campaign / existing prospects.

## Sprint 2 — Google Places discovery

From a campaign, an authenticated operator clicks **Discover Businesses**. The system searches Google Places API (New), persists a candidate pool, and lets the operator import selected eligible businesses as Prospects.

Sprint 2 does **not**:

- run Website Growth Audits
- call OpenAI
- find email addresses
- send outreach
- schedule recurring discovery
- import every Google result automatically

### Provider boundary

`BusinessDiscoveryProvider` accepts a text query, page size, and optional page token, and returns normalized `DiscoveredBusiness` objects.

`GooglePlacesBusinessDiscoveryProvider` is the only implementation. Google response shapes stay inside the provider. Campaign/Prospect logic uses the normalized objects so a later provider can be added without rewriting those models.

### Google endpoint

**Places API (New) Text Search:** `POST https://places.googleapis.com/v1/places:searchText`

Why this endpoint:

- Campaign targeting is city/state text (`locationLabel`) plus industries, not a stored lat/lng.
- The server-side API key is restricted to Places API (New). There is no Geocoding API on this key, so we cannot convert city/state into a circle `locationBias` without another billed product.
- `locationRestriction` for Text Search is a rectangle and also needs coordinates.
- Text Search can return name, address, website, phone, category, and coordinates in **one request path**, so we do not follow up with Place Details.

Location and radius are included in `textQuery`, for example:

`HVAC contractor within 25 miles of Magnolia, TX`

**Limitation:** this is relevance bias in Google's ranking, not a hard geographic fence. We store formatted address and coordinates for display and later validation. We do not silently treat far-away results as in-radius.

Do not scrape Google Maps HTML or Google search results. Do not call Places from the browser.

### Field mask

Exact mask:

```text
places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.websiteUri,places.nationalPhoneNumber,nextPageToken
```

`websiteUri` is required to drop businesses with no public site. That field bills Text Search as Enterprise. `nationalPhoneNumber` is the same Enterprise SKU, so phone does not add Place Details calls or an Atmosphere SKU.

Do not request reviews, photos, opening hours, editorial summaries, accessibility, payment, parking, or atmosphere fields.

### Cost control

- Hard cap: `MAX_DISCOVERY_CANDIDATES_PER_RUN = 25` (server-side; the UI cannot raise it).
- Places `pageSize` max is 20, so a full 25-candidate run uses **two** Text Search requests (20 + 5).
- Hard cap: `MAX_PROVIDER_REQUESTS_PER_RUN = 3`.
- One `RUNNING` discovery run per campaign. A second click returns a calm message instead of starting another Google search.
- No Place Details follow-up. No N+1 pattern.
- No OpenAI, no Website Audit, no automatic recurring discovery, no background scheduler.
- A human must click Discover.

Expected request pattern for one discovery run:

- Typical single-industry campaign filling 25 unique places: **2 Text Search (New) requests**.
- If Google returns ≤20 unique places: **1 request**.
- Never: 1 search + 25 Place Details calls.

Environment: `GOOGLE_PLACES_API_KEY` (server-only). Never `NEXT_PUBLIC_`. Never log, render, or store the key.

### Industry mapping (V1)

Not Google place types. Small maintainable map, then fall back to the campaign industry text:

| Campaign industry | Search phrase |
|---|---|
| HVAC | HVAC contractor |
| Plumbing | plumber |
| Roofing | roofing contractor |
| Electrical | electrician |
| Landscaping | landscaper |

### Persistence

`ProspectDiscoveryRun` stores targeting, status (`RUNNING` / `COMPLETED` / `FAILED`), request counts, and filter counts. It does not store secrets or raw Google JSON.

`ProspectDiscoveryCandidate` stores the normalized candidate plus eligibility. Businesses without websites are `NO_WEBSITE`, counted in stats, hidden from the default import list, and never auto-imported.

### Deduplication

Before a candidate is eligible:

- duplicate Google Place ID in the same run
- no / invalid public website
- duplicate hostname in the same run
- `SuppressionEntry` hostname
- already attached to this campaign (hostname or Place ID)
- existing inbound `Lead` website (Sprint 1 duplicate logic)
- existing `Prospect` hostname or Place ID

Known/contacted businesses are classified out of the eligible list. They still appear in run statistics. They must not be silently re-created. The five manual Soft Launch Batch 1 hostnames should classify as already in the campaign / existing prospects.

### Import

Operator selects eligible checkboxes, then **Import Selected Prospects**.

- Create a new `Prospect` with `sourceType = GOOGLE_PLACES` and `sourceRef` = Google Place ID.
- If the hostname/Place ID already exists, reuse that Prospect and attach it with `CampaignProspect` instead of creating a duplicate.
- Do not create `Lead`, `AuditReport`, `ProspectContact`, or `OutreachMessage`.

### Duplicate hostnames (manual add)

Normalized hostname is indexed, not globally unique.

Sprint 1 still warns the operator (existing Prospect, inbound Lead website, or suppression entry) and requires confirmation before creating another **manual** row.

Discovery treats those matches as hard exclusions from the eligible import list.
