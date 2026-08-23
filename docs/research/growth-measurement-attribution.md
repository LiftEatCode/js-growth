# Growth Measurement & Attribution Research

**DATE RESEARCHED:** 2026-08-23  
**SCOPE:** Growth Sprint 1 — measurement baseline (not optimization)  
**VERSIONS:** `growth-events-v1` · `attribution-v1` · `utm-standard-v1`

---

## WHAT the platforms currently recommend

### Google Analytics 4

- Use **UTM campaign parameters** on external referral/ad destination URLs so Traffic acquisition reports show Session source / medium / campaign ([URL builders](https://support.google.com/analytics/answer/10917952)).
- Always set `utm_source`, `utm_medium`, and `utm_campaign` together when tagging; missing values often appear as `(not set)`.
- Prefer **consistent lowercase** naming to avoid fragmented rows (GA4 is case-sensitive for these dimensions).
- Mark meaningful outcomes as **key events** in Admin → Data display → Events ([Mark events as key events](https://support.google.com/analytics/answer/13128484)). Prefer recommended events (e.g. `generate_lead`) when they fit; custom events are acceptable for product-specific funnels.
- Traffic-source dimensions have user / session / event scopes; event-scoped attribution applies primarily to **key events** under the property attribution model (default data-driven) ([Scopes of traffic-source dimensions](https://support.google.com/analytics/answer/11080067)).
- Do not mark all `page_view` events as key events.

### Google Search Console

- Performance report metrics: **clicks**, **impressions**, **CTR**, **average position** ([Performance report overview](https://support.google.com/webmasters/answer/7576553), [impressions/position/clicks](https://support.google.com/webmasters/answer/7042828)).
- Chart totals are aggregated by property; table rows by the selected dimension (query, page, etc.).
- Average position is a diagnostic ranking signal — **not** a primary business KPI by itself.

### Meta / Facebook

- Meta does **not** auto-tag destination URLs for analytics platforms. Operators must add URL parameters for website destinations ([Add URL parameters to Meta ads](https://www.facebook.com/business/help/1016122818401732)).
- Organic post links should be tagged manually with the same UTM conventions when promoting the website.
- Paid campaigns (later): place parameters in the ad-level URL parameters field; do not invent a competing Meta Pixel revenue authority in Growth Sprint 1.

### Next.js / this codebase

- Existing custom GA4 loader with sanitized `page_view` (`send_page_view: false`) and commercial event sanitizer — extend, do not duplicate tags.
- No GTM container; no Vercel Analytics package in V1 growth baseline.

---

## WHY we are using this approach

1. **Trust before optimization** — Growth Sprint 1 makes numbers trustworthy; later sprints improve them.
2. **GA4-native acquisition** — avoid building a competing attribution engine.
3. **First-party product facts** — Audit SaaS + commercial DB remain authority for purchases, opportunities, clients.
4. **Privacy** — never send commercial IDs or PII to browser analytics.
5. **Bounded instrumentation** — only events that map to real UI; no noisy scroll/mousemove events.

---

## WHAT JS Solutions is implementing

| Area | Implementation |
|---|---|
| Public growth events | `growth-events-v1` taxonomy (`src/lib/growth/events.ts`) |
| Key event candidates | Documented for GA Admin marking (`audit_submitted`, `contact_form_submitted`) |
| UTM standard | `utm-standard-v1` + internal `/reports/growth/utm-builder` |
| First-party attribution | Bounded `attributionJson` on public audits + session capture |
| Growth dashboard | `/reports/growth` — internal aggregates + manual snapshots |
| GrowthSnapshot | Immutable baselines (`GA4`, `SEARCH_CONSOLE`, `FACEBOOK`, `INTERNAL`) |
| Docs | `docs/growth/*` + this research note |

---

## WHAT we intentionally are not implementing

- GA4 / GSC OAuth API imports on page load
- Meta Conversions API / Pixel as payment authority
- SEO content generation, social posting automation, paid ads, GBP optimizer SaaS
- AI growth recommendations / attribution AI
- Client-facing analytics portal
- Competing browser `purchase` revenue event that contradicts Stripe

---

## LIMITATIONS of the measurement

- Historical GA4/GSC/Facebook numbers are **not fabricated**; operators record snapshots manually until APIs are justified.
- Browser analytics can be blocked (ad blockers, consent regimes). First-party DB aggregates remain complementary.
- Search Console verification for jsgrowth.com is an **ops step**, not fully automated in code in this sprint.
- Organic Google search should remain `google / organic` without UTMs on SERP landing URLs.
- Internal link UTMs are forbidden — they corrupt session attribution.

---

## CLIENT-SAFE TALKING POINTS

See [`docs/growth/client-talking-points.md`](../growth/client-talking-points.md). Summary:

- We establish a measurement baseline before changing strategy.
- We separate acquisition from conversion.
- We use campaign attribution to learn which channels contribute to engagement and leads.
- We do not treat vanity visibility metrics as success if downstream business outcomes do not improve.

---

## SOURCE URLs / references

1. https://support.google.com/analytics/answer/10917952 — URL builders / UTM  
2. https://support.google.com/analytics/answer/11080067 — Traffic-source dimension scopes  
3. https://support.google.com/analytics/answer/13128484 — Mark key events  
4. https://support.google.com/analytics/answer/9267735 — Recommended events  
5. https://support.google.com/webmasters/answer/7576553 — Search Console Performance  
6. https://support.google.com/webmasters/answer/7042828 — Impressions, clicks, position  
7. https://www.facebook.com/business/help/1016122818401732 — Meta URL parameters  
8. https://nextjs.org/docs — App Router / analytics integration patterns (project uses custom sanitized gtag)
