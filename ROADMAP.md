# JS Solutions Master Roadmap

> **Building the most trusted technology partner for local businesses.**

---

# Vision

JS Solutions exists to help businesses grow through modern software engineering, Local SEO, AI, automation, analytics, and digital strategy.

Every initiative in this roadmap should support one or more of the following goals:

- Generate Leads
- Improve Client Results
- Build Authority
- Increase Automation
- Improve Operations
- Scale the Business

---

# Current Status

**Platform milestone:** Competitive Intelligence V1 + Website Growth Audit commercial product + Commercial Sprints 1–10 + **Growth Sprints 1–4** (Measurement → Audit Funnel → Facebook Engine → 30-day Execution) implemented.

**Code is source of truth.** See [`docs/README.md`](docs/README.md), [`docs/development/product-catalog.md`](docs/development/product-catalog.md), and [`docs/development/platform-architecture.md`](docs/development/platform-architecture.md).

### Status legend (this roadmap)

| Bucket | Meaning |
|---|---|
| **IMPLEMENTED** | Shipped in code |
| **HARDENING / OPERATIONS** | QA, live Stripe, SOPs, observability — not new product surface |
| **NEXT** | Highest-leverage candidates given current product (not auto-assigned sprint numbers) |
| **LATER / EXPLORATORY** | Valuable but not committed |

---

## Website

Status: 🟢 Production

Hosting: Vercel · Framework: Next.js · Deployment: GitHub → Vercel CI/CD

---

## Website Growth Audit

Status: 🟢 Implemented (commercial Free + Professional)

Priority: Critical commercial product on `js-growth.com`

Implemented capabilities (summary):

- Free deterministic Website Growth Audit (no OpenAI)
- Professional upgrade via Stripe one-time Checkout + entitlement
- Technical SEO, on-page/content, performance signals, CRO, Local SEO signals, multi-page crawl budgets
- Optional **explicit** competitor URLs on the public audit (bounded) — distinct from Prospecting CI
- Professional PDF + AI Interpretation (entitled)
- Internal lead/report workspace
- Published Privacy / Terms / Refund pages

Known constraints remain: representative scan; no rank/GBP/backlink APIs; report UUID access; policies are operational drafts.

---

## Prospecting Engine V1

Status: 🟢 Implemented (internal)

Priority: Internal acquisition — **not** customer SaaS

Includes discovery → qualification → contacts → human-approved Resend / manual forms → delivery → outcomes → lead conversion, plus Competitive Intelligence V1 (below).

Canonical doc: `docs/development/prospecting-engine-v1.md`

---

## Competitive Intelligence V1 (prospecting)

Status: 🟢 Implemented through Sprint 13.1 (internal)

Canonical doc: `docs/development/competitive-intelligence.md`  
Historical build notes: `docs/development/competitive-intelligence-sprint-*.md`

Pipeline: profile → Places candidates → validate → human select ≤3 → competitor audits → deterministic comparison → AI interpretation → internal Competitive Website Growth Analysis preview.

**Not in V1:** public share links, competitive PDF SKU, Stripe CI product, monitoring/re-audit schedules.

Sprint history (completed):

- Sprint 13 / 13.1 — Client-ready report presentation + language/presentation hardening
- Sprint 12 / 12.1 — AI interpretation + validation hardening
- Sprint 11 — Deterministic comparison
- Sprint 10 — Competitor Website Growth Audits
- Sprint 9 / 9.1 — Discovery, validation, geography

Earlier prospecting sprints 1–8 (contacts, sending, webhooks, outcomes) remain **IMPLEMENTED** — see prospecting doc.

---

## Commercial Sprint 1 — Implementation Plan Foundation

Status: 🟢 Implemented (internal) · **1.1 quality hardening** (`IMPLEMENTATION_MAPPING_VERSION = 2`)

Canonical doc: `docs/development/implementation-plan-engine.md`

Deterministic evidence → capabilities → workstreams → priorities → persisted snapshot + human approve.

Sprint 1.1: evidence dedupe, action provenance, strength-aware suppression, material-risk exception, `no-images` weight reduction.

**Not included:** pricing, opportunities, proposals, public plans, outreach.

---

## Commercial Sprint 2 — AI Implementation Strategy

Status: 🟢 Implemented (internal)

Canonical doc: `docs/development/implementation-plan-ai-strategy.md`

Bounded OpenAI interpretation of an authoritative `ImplementationPlan`. Explains workstreams/sequencing; cannot change plan facts. Explicit Generate only; historical rows + staleness; max 1 repair.

**Not included:** pricing, opportunities, proposals, public sharing, PDF, automatic approval.

---

## Commercial Sprint 3 — Opportunity Management V1

Status: 🟢 Implemented (internal)

Canonical doc: `docs/development/opportunity-management.md`

Human-created sales Opportunities with stages, capability snapshots, next actions, notes, WON/LOST, and activity history. No OpenAI / Places / crawl / Resend. No pricing or proposals.

**Not included:** pricing, proposals, client conversion, automated follow-up.

---

## Commercial Sprint 4 — Scope Engine V1

Status: 🟢 Implemented (internal) · Sprint 4.1 quality hardening

Canonical doc: `docs/development/scope-engine.md`

Human-controlled commercial Scope from Opportunity (+ optional Implementation Plan). Plan → sections/deliverables with evidence-only competitive-gap actions excluded. Approved scopes immutable; revise creates historical versions. No pricing / proposals / OpenAI.

**Sprint 4.1:** Deduped considerations, polished client titles, exact capability inheritance, empty assumptions/exclusions defaults, preview hygiene. Mapping version `COMMERCIAL_SCOPE_MAPPING_VERSION = 2` (no schema migration).

**Not included:** proposals, PDF, public scope links, automatic Opportunity stage changes.

---

## Commercial Sprint 5 — Pricing Engine V1

Status: 🟢 Implemented (internal) · Sprint 5.1 catalog + incomplete-price safety

Canonical doc: `docs/development/pricing-engine.md`

Deterministic pricing from approved Commercial Scope via canonical work-unit normalization (dedupe overlapping deliverables), effort bands, configurable minimum engagement, human overrides with reasons, and approved historical snapshots. No proposals / Stripe / OpenAI.

**Sprint 5.1:** Expanded deterministic catalog (`scanability`, `inline-css`, `script-weight`, `local-schema`, `nap`); incomplete-price safety for totals/preview/approval. `COMMERCIAL_PRICING_CONFIG_VERSION = 2` (no schema migration).

**Not included:** proposals, PDFs, public links, retainers, automatic discounts, Stripe checkout, invoices, e-sign.

---

## Commercial Sprint 6 — Proposal Engine V1

Status: 🟢 Implemented (internal) · Sprint 6.2 financial provenance · **Sprint 7 delivery**

Canonical docs: `docs/development/proposal-engine.md`, `docs/development/proposal-delivery.md`

Client-readable proposal snapshots from **APPROVED** Commercial Scope + **APPROVED COMPLETE** Commercial Pricing. Presentation-only; does not recalculate scope or pricing. Internal preview only — no public URL, PDF, email, acceptance, e-sign, or Stripe.

**Sprint 6.1:** Client presentation hardening — why-it-matters taxonomy, polished deliverable labels, dedupe-safe financial grouping (Content & Search combined), no audit-finding counts, claim-safe copy. `COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 2` (no schema migration).

**Sprint 6.2:** Financial provenance hardening — authoritative `workUnitKey` / `sourceActionKey` identity (no fuzzy semantic substitution), split Conversion Optimization vs Conversion Path Assessment groups, financial reconciliation invariant before snapshot creation, Rooftop + 1st Choice fixture regression. `COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 3` (no schema migration). Revise existing v1/v2 proposals to rebuild.

**Sprint 7:** Human-controlled proposal delivery + client decision — token-gated `/proposal/{token}` public view (reuses ProposalDocument), Resend send (max 1 per explicit send), view tracking, revocation, decision states (ACCEPTED ≠ Won). `PROPOSAL_DELIVERY_VERSION = 1`. Migration `20260822120000_add_proposal_delivery`.

**Sprint 8:** Formal Agreement + client acceptance — token-gated `/agreement/{token}`, immutable snapshot + SHA-256 acceptance hash, payment terms on Agreement (no Stripe), human approve + explicit send. `COMMERCIAL_AGREEMENT_VERSION = 1`. Migration `20260823120000_add_commercial_agreements`. See `docs/development/agreement-engine.md`.

**Sprint 9:** Payment / deposit collection — `CommercialPayment`, operator-gated Stripe Checkout (`price_data`), webhook reconciliation to ACCEPTED Agreement amounts, deposit/balance/full states, no auto-WON. `COMMERCIAL_PAYMENT_VERSION = 1`. Migration `20260823180000_add_commercial_payments`. See `docs/development/commercial-payments.md`.

**Sprint 10:** Client / Project onboarding — payment eligibility → human Convert → WON + Client + Project + commercial snapshot + checklist + delivery task dedupe. Deposit-start for `DEPOSIT_AND_BALANCE`; balance gates final handoff. Migration `20260823190000_add_clients_projects`. See `docs/development/client-project-onboarding.md`.

**Not included (through Sprint 10):** AI sales email, automatic follow-up, e-sign, automatic Client/Project on payment webhook, tax engine, invoices, subscriptions, client portal, change-order engine, password vault.

---

## Growth Phase

### Growth Sprint 1 — Measurement, Attribution & Growth Baseline V1 ✅

- Research + methodology docs (`docs/research/growth-measurement-attribution.md`, `docs/growth/*`)
- Public growth event taxonomy `growth-events-v1` + GA key-event candidates
- UTM standard `utm-standard-v1` + internal `/reports/growth/utm-builder`
- First-party bounded audit attribution (`attributionJson`)
- `GrowthSnapshot` model for immutable GA4 / GSC / Facebook / Internal baselines
- Internal `/reports/growth` dashboard (DB aggregates; no external analytics APIs on load)
- Privacy: commercial IDs / PII forbidden in GA4; Stripe/DB remain payment authority
- **Growth Baseline V1 recorded 2026-08-23** (`GROWTH_BASELINE_VERSION = 1`) — see `docs/growth/baselines/growth-baseline-v1.md`

**Not included:** SEO content gen, social automation, paid ads, GBP optimizer SaaS, attribution AI, client analytics portal.

### Growth Sprint 2 — Website Audit Conversion Funnel ✅

- `AUDIT_FUNNEL_VERSION = 1` deterministic funnel contract + session dedupe
- Cardinality fix: one `audit_completed` per completion (removed duplicate gtag)
- First-party funnel milestones on `attributionJson.funnel`; internal funnel dashboard section
- Conversion UX: hero clarity, form trust, honest processing copy, inline report view tracking
- GA4 funnel operator guide + `generate_lead` compatibility layer (contact only)
- Experiments 001–004 documented (sequential measurement — low traffic)
- Research: `docs/research/audit-conversion-funnel-2026.md`

**Not included:** Facebook Growth Engine, Meta Pixel, paid ads, pricing changes, Baseline V1 modifications.

### Growth Sprint 3 — Facebook Organic Growth & Distribution Engine ✅

- Research-first Meta organic distribution notes (`docs/research/facebook-organic-growth-2026.md`)
- `facebook-growth-v1` layers + balanced scorecard (followers **and** business outcomes)
- Company Page vs founder distribution roles + deterministic UTM separation
- Content jobs / pillars / formats + `GrowthContentRecord` manual ledger
- Facebook experiments 010–018; content OS; weekly review; Page checklist; internal playbook
- `/reports/growth` Facebook panel (baseline comparison, ledger, first-party FB attribution)
- No Meta Graph API; Growth Baseline V1 preserved

**Not included:** Meta API sync, Meta Pixel/CAPI, paid social automation, Baseline V1 edits.

### Growth Sprint 4 — 30-Day Facebook Execution & Optimization ✅

- `facebook-execution-v1` cadence/targets/schedule/experiment sequence
- Content metric checkpoints (`GrowthContentMetricSnapshot`) + edit UI on `/reports/growth`
- Due-for-measurement queue, daily operator view, follower & publisher scorecards
- Experiment decision logging; 018 website→Facebook remains queued
- Docs: 30-day plan + review template + acceptance

**Not included:** Auto-posting, AI post generation, Meta API, Baseline V1 changes.

---

## HARDENING / OPERATIONS (not new features)

- Stripe LIVE go-live checklist and controlled live transaction (if not already complete in your environment)
- Repeatable production acceptance using `docs/sops/operations/production-acceptance.md`
- Observability / analytics completeness for commercial funnel
- Legal counsel review of published policies as volume grows
- Operator adoption of prospecting + CI SOPs

## NEXT (recommended product leverage — evaluate, do not auto-sprint)

Prioritize based on business leverage with the **current** stack:

1. Close the commercial audit loop: soft-launch / LIVE payment confidence + consultation conversion from Professional reports
2. Execute Growth Sprint 3 Facebook experiments against Baseline V1 (followers + engagement + qualified traffic + audits) — measure before Meta API automation
3. Prospecting reply/follow-up **with human gates** (not autonomous sequences)
4. CI productization only after operator proof: public/shareable Competitive Growth Analysis and/or PDF
5. ~~Public proposal delivery / PDF / acceptance (after Sprint 6 internal proof)~~ — **Sprint 7: token-gated delivery + decision (no PDF/e-sign/Stripe yet)**
6. ~~Measurement / attribution foundation~~ — **Growth Sprint 1 complete**

## LATER / EXPLORATORY

- Standalone paid competitive analysis SKU
- Competitive monitoring / scheduled re-audits / trend comparisons
- Lead capture from competitive reports
- Multi-location competitive analysis
- Broader CRM expansion / campaign optimization ML
- Autonomous outbound (explicitly out of V1 principles)
- Automated pricing / e-sign proposals

---

## Documentation

Status: 🟢 Active (repository consolidation Aug 2026)

Company Documentation

- ✅ Mission
- ✅ Vision
- ✅ Core Values
- ✅ Branding Guide
- ✅ Elevator Pitch

Services

- ✅ Website Development
- ✅ Local SEO playbook
- 🚧 AI Automation
- 🚧 Analytics
- 🚧 Custom Software

Playbooks and SOPs

- ✅ Client lifecycle
- ✅ Marketing
- ✅ Development
- ✅ Operations files + JS Growth product SOPs (audit, prospecting, CI, outreach safety, acceptance)

---

# Active Focus — Operations & Commercial Proof

Feature freeze for CI V1 / Prospecting V1 unless a critical production defect. Current focus is **operations, commercial proof, and documentation accuracy** — not Sprint 14 by default.

Historical “Production Launch V1” checklist items remain useful for QA/LIVE Stripe; they are hardening, not a claim that the audit product is unimplemented.

---

# Phase 1 — Foundation

## Infrastructure

- ✅ Production Deployment
- ✅ GitHub
- ✅ Vercel
- ✅ Custom Domain
- ✅ SSL
- ✅ Contact Form
- ✅ Sitemap
- ✅ Robots.txt
- ✅ Analytics
- ✅ Documentation Structure
- ✅ Privacy Policy, Terms of Service, Refund Policy

---

# Phase 2 — Authority

Goal

Become the trusted online authority for local business technology.

Current Progress

Published articles

- ✅ How much does a small business website cost
- ✅ Why most small business websites don't generate leads
- ✅ Why local businesses need more than a website
- ✅ What is Local SEO

Upcoming Articles

Website Development

- Website Speed
- Website Builders
- Website Maintenance
- Website Accessibility
- Website Mistakes
- Landing Pages
- Conversion Optimization

Local SEO

- Google Business Profile
- Local SEO Timeline
- Local Citations
- Reviews
- Local Landing Pages
- NAP Consistency

AI

- AI for Small Business
- AI Chatbots
- AI Workflows
- AI Integrations
- CRM Automation

Marketing

- SEO vs Google Ads
- Marketing Funnel
- Analytics
- Lead Generation
- Content Marketing

Target

- 50 Published Articles

Stretch Goal

- 100 Articles

---

# Phase 3 — Lead Generation

Priority: ⭐⭐⭐⭐⭐

Website Growth Audit

Status

Launch Candidate — see Production Launch V1

---

Local SEO Audit (standalone GBP / citation / ranking product)

Status

Planning — distinct from Local SEO Intelligence already shipping inside the Website Growth Audit

---

AI Readiness Assessment

Status

Planning

---

Pricing Calculator

Status

Planning

---

ROI Calculator

Status

Planning

---

# Phase 4 — Business Systems

Implemented for the audit product

- Internal reports dashboard (`/reports`)
- Lead pipeline, follow-ups, notes, and prospect conversion
- Internal login (session-gated, no public customer accounts)
- Prospecting Engine V1 Sprint 4 (`/reports/prospecting`) — discovery, internal audits, qualification, first-party contacts, and outreach drafts (no sending)

Still planning (company-wide systems, not built as products)

- Full CRM
- Proposal Generator
- Client Portal
- Client Dashboard
- Monthly Reports
- Automated Reporting
- Billing beyond one-time Professional Audit Checkout
- Project Tracking
- Knowledge Base
- Internal AI Assistant

---

# Phase 5 — Products

The first customer-facing product is the Website Growth Audit (launch candidate).

Later SaaS / product expansion (not the current milestone)

- Website Audit Platform (multi-tenant / monitoring / historical scores)
- SEO Dashboard
- Business Analytics
- Marketing Dashboard
- Automation Platform
- Client Portal

---

# SEO Goals

Current

- Production Website
- Technical SEO
- Sitemap
- Robots
- Metadata
- Organization and WebSite schema
- BlogPosting schema
- Breadcrumb schema on blog posts

Next

- FAQ Schema
- LocalBusiness Schema
- Review Schema

Future

- 100 Indexed Pages
- 500 Ranking Keywords
- Domain Authority Growth

---

# Marketing Goals

Organic SEO

Facebook

LinkedIn

Email Marketing

Google Business Profile

YouTube

Case Studies

Testimonials

---

# Documentation Goals

In place

- Company documentation
- Website Development service playbook
- Local SEO service playbook
- SOP library (client lifecycle, marketing, development, operations)
- Playbooks
- Templates
- Ideas and development notes for the Website Growth Audit

Still needed

- Complete AI Automation, Analytics, and Custom Software playbooks
- SEO SOP set
- Support SOP set
- Knowledge Base
- External-facing resource center

---

# Business Goals

## Year One

Launch Company

Build Portfolio

Acquire First SEO Clients

Acquire First Website Clients

Acquire First AI Clients

Develop Internal Systems

Build Authority

Generate Consistent Organic Leads

Complete Production Launch V1 for the Website Growth Audit

---

## Year Three

Regional Technology Leader

100+ Articles

100+ Clients

Recurring Revenue

Software Products

Internal AI Platform

---

# Current Priorities

Priority 1

Complete Production Launch V1

Priority 2

Publish high-quality content

Priority 3

Improve SEO

Priority 4

Finish remaining service documentation

Priority 5

Build remaining internal systems (CRM, client portal) after launch

Parallel internal workstream

Prospecting Engine V1 Sprint 4 is in use under `/reports/prospecting` (contacts + drafts). Do not start Sprint 5 (Resend sending) until Sprint 4 drafts have been reviewed in production.

---

# Backlog

Local SEO Audit (standalone product)

Proposal Generator

CRM

Reporting Dashboard

AI Assistant

Client Portal

Website Monitoring

SEO Dashboard

Automation Templates

Content Generator

Review Request Automation

Email Campaign Builder

Meeting Scheduler

Invoice Integration

Customer Portal

Pricing Calculator

ROI Calculator

AI Readiness Assessment

---

# Guiding Principles

Every feature should:

Generate revenue

Save time

Improve quality

Increase trust

Be scalable

Deliver measurable value

---

# Success Metrics

Business

Monthly Recurring Revenue

Qualified Leads

Client Retention

Revenue Growth

SEO

Organic Traffic

Keyword Rankings

Backlinks

Authority

Content

Articles Published

Indexed Pages

Internal Links

Conversion Rate

Technology

Lighthouse

Core Web Vitals

Accessibility

Performance

Security

Product

Free audits completed

Professional upgrades

Paid entitlement reliability

AI interpretation successful completions

---

# Recently Completed

- Marketing website production launch
- Custom domain
- Vercel deployment
- Contact form
- Technical SEO foundations
- Blog system (4 published articles)
- Documentation foundation
- Company documentation
- Free and Professional Website Growth Audit
- Stripe one-time Professional upgrade and entitlement
- Technical SEO V2, On-Page/Content, Performance, Multi-Page, CRO, Local, and Competitive intelligence layers
- Professional report and PDF
- AI Interpretation V1
- Internal lead/report management
- Published Privacy Policy, Terms of Service, and Refund Policy

---

# Next Milestone

**Production Launch V1** — complete the twelve go-live steps above, then tag `website-audit-v1.0`.

After that, return to content, SEO, and remaining service documentation. Do not start a new audit product milestone until this one ships.

---

> **Mission**

Build technology that helps businesses grow.

---

**Owner:** Josh Spradling

**Company:** JS Solutions

**Status:** Active

**Version:** 1.1

**Last Updated:** August 18, 2026
