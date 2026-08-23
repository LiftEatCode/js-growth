# Product & Capability Catalog

Verified against implementation. Separates **public products**, **internal tools**, and **planned**.

---

## Implemented products (customer-facing)

### Free Website Growth Audit

- Public deterministic multi-page representative scan
- Score, category scores, limited priorities / quick wins, methodology
- Optional explicit competitor URLs (public competitive teaser) — **not** Places CI
- **No** credit card, **no** OpenAI

### Professional Website Growth Audit

- Stripe one-time upgrade / entitlement
- Full findings, action plan, evidence, PDF
- AI Interpretation (Executive Growth Analysis) after entitlement
- Access via report URL (no customer accounts)

---

## Internal operational tools (not public SaaS)

### Lead / report workspace

- Session-gated `/reports`
- Lead lifecycle, activities, inbound audits, prospect conversions

### Prospecting Engine V1

- Campaigns, Places discovery, import, audit/qualify, Top N / manual select
- Contact discovery, AI drafts, human approve, Resend email
- Manual contact-form submission workflow
- Delivery events, outcomes, suppression, funnel metrics
- **No** automatic bulk send; **no** auto form POST; **no** CAPTCHA bypass

### Competitive Intelligence V1 (prospecting)

- Profile → Places candidates → validate → human select ≤3 → competitor audits → deterministic comparison → AI interpretation → internal Competitive Website Growth Analysis preview
- **Not** publicly shareable in V1; **no** competitive PDF SKU

### Implementation Plan (Commercial Sprint 1)

- Deterministic workstreams from audit (+ optional current comparison)
- Human review / approve; historical snapshots
- **No** AI, pricing, proposals, or public exposure

### AI Implementation Strategy (Commercial Sprint 2)

- Explains an Implementation Plan; does not change plan facts
- Explicit Generate only; internal only

### Opportunity Management V1 (Commercial Sprint 3)

- Human-created commercial pursuits with stages, capability snapshots, next actions, WON/LOST
- **No** pricing, proposals, automated outreach, or public exposure

### Commercial Scope Engine V1 (Commercial Sprint 4)

- Human-controlled Scope from Opportunity (+ optional Implementation Plan)
- Approved scopes immutable; revise for new versions
- **No** proposals or OpenAI

### Commercial Pricing Engine V1 (Commercial Sprint 5)

- Deterministic work-unit pricing from approved Scope + human overrides
- Approved pricing snapshots; revise for new versions
- **No** proposals, Stripe checkout, or OpenAI

### Commercial Proposal Engine V1 (Commercial Sprint 6)

- Client-readable proposal snapshot from approved Scope + approved complete Pricing
- Presentation-only; does not recalculate commercial facts
- Public delivery + decision via Sprint 7

### Commercial Agreement Engine V1 (Commercial Sprint 8)

- Immutable accepted Agreement snapshot + payment terms
- Public `/agreement/{token}` acceptance (Accepted ≠ paid ≠ Won)

### Commercial Payments V1 (Commercial Sprint 9)

- Operator-gated Stripe Checkout for deposit / balance / full
- Webhook-authoritative reconciliation to ACCEPTED Agreement cents
- See [commercial-payments.md](commercial-payments.md)

### Client / Project Onboarding V1 (Commercial Sprint 10)

- Human Convert → Client + Project + immutable commercial snapshot
- Deposit-start eligibility; balance before final handoff
- Internal `/reports/clients` — no client portal
- See [client-project-onboarding.md](client-project-onboarding.md)

---

## Planned / not implemented (examples)

Confirm against [ROADMAP.md](../../ROADMAP.md) before promising clients:

- Public / shareable Competitive Growth Analysis
- Competitive PDF / standalone paid competitive product
- Lead capture from competitive reports
- Competitive monitoring / scheduled re-audits / trend history productization
- Follow-up outreach automation / reply ingestion
- Public proposal delivery / PDF / acceptance / e-sign
- Broader CRM / multi-location BI
- Service recommendation generators as a productized SKU

---

## Services JS Solutions can deliver (human + tools)

Supported by the platform and playbooks — **delivery is human-led** unless a specific automation is listed as implemented:

| Service area | Platform support today |
|---|---|
| Website Development | Marketing + audit evidence for discovery |
| Website Growth Audits | Productized Free / Professional |
| SEO / Local SEO / Content / CRO | Audit categories + service playbooks; not full rank/GBP APIs |
| Competitive Website Analysis | Internal CI V1 for operators; client delivery via human share of internal preview / exports as process allows |
| Lead generation / prospect research | Internal Prospecting Engine |
| Marketing automation / AI integration / BPA | Service playbooks; app automations are the specific paths above only |

Do not sell “fully automated outbound” or “CAPTCHA-solving form bots” — those are explicitly out of product.

---

## Related

- [platform-architecture.md](platform-architecture.md)
- [competitive-intelligence.md](competitive-intelligence.md)
- [prospecting-engine-v1.md](prospecting-engine-v1.md)
- [../commercial-launch-v1.md](../commercial-launch-v1.md)
