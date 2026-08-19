# Prospecting Engine V1

Internal notes for JS Solutions outbound prospecting. This is **not** a customer-facing product.

Current status: **Sprint 4 — Public Contact Discovery + AI Outreach Drafting**

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

V1 is not autonomous outbound. Sprint 2 adds Find (Google Places) with a second human gate: **Import Selected Prospects**. Sprint 3 adds Audit → Qualify with a human **Audit & Qualify** trigger. Sprint 4 adds **Find Contacts** and **Generate Missing Drafts**. Sending is not built yet.

## Planned stages

| Sprint | Goal | Status |
|---|---|---|
| 1 | Data foundation + manual prospect UI | Complete |
| 2 | Legitimate business discovery provider | Complete |
| 3 | Deterministic Website Growth Audit qualification | Complete |
| 4 | Public contact discovery + outreach drafts | Complete |
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
- Do not create `Lead`, `AuditReport`, `ProspectContact`, or `OutreachMessage` during discovery/import. Sprint 3 creates `AuditReport` records only from **Audit & Qualify**.

### Duplicate hostnames (manual add)

Normalized hostname is indexed, not globally unique.

Sprint 1 still warns the operator (existing Prospect, inbound Lead website, or suppression entry) and requires confirmation before creating another **manual** row.

Discovery treats those matches as hard exclusions from the eligible import list.

## Sprint 3 — Audit + qualification

Operator clicks **Audit & Qualify Prospects** on a campaign. The system runs the existing deterministic Website Growth Audit internally, stores a `PROSPECTING` `AuditReport`, scores an explainable qualification, and marks the campaign's desired top N (usually 5).

Sprint 3 does **not**:

- call OpenAI
- find email addresses
- draft or send outreach
- create Leads or Stripe checkouts
- reuse public customer reports
- schedule background jobs

### Deterministic audit entry point

`runDeterministicWebsiteAudit(url)` performs URL validation, secure fetch, HTML analysis, robots/sitemap discovery, bounded crawl, rules, scoring, priorities, quick wins, and site intelligence.

It does not run competitive analysis, Stripe, AI, analytics, Free report shaping, email, or lead capture.

Public `auditWebsite` reuses this function, then adds competitive intelligence and saves a `PUBLIC_FUNNEL` customer report. Customer behavior is unchanged.

### Prospecting reports

Prospect audits use `AuditReport.source = PROSPECTING` and `reportMode = consultation`.

They are linked on `Prospect.auditReportId`. They are **not** customer-facing:

- `/report/[id]` → 404
- `/report/[id]/pdf` → 404
- Professional API → 404
- Stripe checkout → not found

Internal `/reports/[id]` may still show the stored audit to a signed-in operator. The inbound `/reports` dashboard lists only `PUBLIC_FUNNEL` reports.

### Audit reuse / TTL

If a Prospect is already linked to a `PROSPECTING` audit younger than **7 days**, qualification reuses it instead of recrawling.

V1 does **not** reuse `PUBLIC_FUNNEL` customer audits. That avoids coupling outbound prospecting to a customer's paid/free report.

Operators can **Re-run Audit** to force a new crawl.

### Qualification model

Qualification is deterministic. Overall score is contextual, not the main driver.

Hard skips: invalid website, audit failed, suppressed hostname, customer suppression, existing inbound Lead, weak crawl evidence, campaign state mismatch, or no allowlisted outreach finding.

Factors (capped 0–100):

- Credible allowlisted finding (high weight)
- Finding business impact and priority
- Optional secondary finding
- Category gaps in Content, Local SEO, CRO, and Search (not used as the outreach hook)
- Light performance context only
- Capped quick-win points
- Small bonus for overall scores in a healthy-but-improvable range (about 65–92)
- Penalty for very low/broken overall scores

Modeled traffic/lead/revenue opportunity is ignored.

### Outreach finding allowlist

Only these finding IDs can become the primary/secondary hook:

- `site-duplicate-titles`
- `missing-h1`
- `missing-meta-description`
- `empty-meta-description`
- `site-weak-internal-link-support`
- `local-schema-incomplete`
- `local-schema-missing`
- `limited-internal-link-diversity`
- `missing-internal-links`

Denied as hooks: performance-only issues, robots noise, accessibility-only findings, pass findings, weak evidence, and unsupported category-score claims.

If none are credible: `qualificationStatus = SKIPPED`, skip reason `NO_CREDIBLE_FINDING`.

### Batch safeguards

- `MAX_PROSPECT_AUDITS_PER_RUN = 10`
- `MAX_AUDIT_CONCURRENCY = 2`
- One `RUNNING` `ProspectQualificationRun` per campaign
- No Google Places calls during qualification
- Manual operator trigger only

## Sprint 4 — Public contact discovery + AI drafts

Selected Top N qualified prospects can be processed for first-party public emails, then a grounded outreach draft.

Operator workflow:

1. Discover businesses
2. Import selected businesses
3. Audit & Qualify
4. System selects Top N
5. Find Contacts
6. Generate Missing Drafts
7. Review contact provenance and edit the draft
8. **Stop.** No email is sent.

### No guessed emails

An email must appear in publicly accessible first-party business content. The system does not generate `info@`, `contact@`, `owner@`, or similar addresses.

`NO_PUBLIC_EMAIL_FOUND` is a valid non-error outcome. Qualification remains intact.

### First-party discovery

`ProspectContactDiscoveryService` uses the Prospect website only. No Hunter/Apollo/Clearbit provider is wired.

Behavior:

- Fetch the homepage with existing SSRF protections
- Extract mailto links and visible emails
- Follow a small set of same-host contact/about/team links actually found on the page
- Cap: **5 pages per prospect, including the homepage**
- Do not crawl the whole site or follow external links
- Simple deterministic obfuscations such as `name [at] domain [dot] com` are allowed
- No CAPTCHA bypass, browser automation, social scraping, WHOIS, or data-broker collection

Provenance stored on `ProspectContact`:

- email / normalizedEmail
- source URL
- source type (`WEBSITE_HOMEPAGE`, `WEBSITE_CONTACT_PAGE`, `WEBSITE_ABOUT_PAGE`, `WEBSITE_TEAM_PAGE`, `WEBSITE_OTHER`)
- confidence (`HIGH` matching website domain, `MEDIUM` first-party consumer mailbox such as Gmail, `LOW` otherwise)
- discovered / last verified timestamps

Generic published role accounts (`info@`, `office@`, `hello@`, and similar) are acceptable when they actually appear. Published Gmail/Outlook addresses on the business site are kept and marked first-party, not rejected.

### Contact selection and suppression

A primary contact is chosen deterministically (contact page, then homepage, then about/team, then other). The operator can change primary or reject a contact.

Before a contact is treated as usable for drafting, `canContactProspect()` checks:

- hostname suppression
- email suppression
- existing inbound Lead
- customer suppression
- rejected / stale contact status

This helper must be called again in Sprint 5 before send. Sprint 4 approval does not authorize sending.

### Batch safeguards

- `MAX_CONTACT_PAGES_PER_PROSPECT = 5`
- `MAX_CONTACT_DISCOVERY_PER_RUN = 10`
- `MAX_CONTACT_DISCOVERY_CONCURRENCY = 2`
- `CONTACT_TTL = 30 days` (reuse recent contacts; Recheck Contacts can force a crawl)
- One `RUNNING` `ProspectContactDiscoveryRun` per campaign
- `MAX_AI_DRAFTS_PER_RUN = 5`
- `MAX_AI_DRAFT_CONCURRENCY = 1`
- One `RUNNING` `ProspectOutreachDraftRun` per campaign
- No Google Places calls
- No new Website Growth Audits during contact discovery
- No Resend / outbound email
- OpenAI model: existing `OPENAI_AUDIT_MODEL` (default `gpt-4.1-mini`)

### AI grounding

Drafts are generated only for selected Top N qualified prospects that have a primary public contact, a usable prospecting audit, and a credible allowlisted finding.

The model receives a compact JSON context (business, location, one primary finding, optional secondary, score band). It does not receive raw HTML, the full audit JSON, Stripe data, report UUIDs, or Google Place IDs.

Output is schema-validated. Drafts that mention internal prospecting, leak scores/IDs, use placeholders, or make unsupported numeric/aggressive claims are not stored.

Existing `DRAFT` / `NEEDS_REVIEW` / `APPROVED` messages are reused. Regeneration is an explicit operator action.

### Human review

Operators can edit recipient (primary contact), subject, and body, then save. **Mark Approved** only changes status. The UI states that no email is sent in Sprint 4.

Public `/report` pages, PDFs, Professional APIs, and analytics must not receive `ProspectContact` or `OutreachMessage` data.


