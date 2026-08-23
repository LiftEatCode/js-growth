# JS Growth — Platform Architecture

Canonical high-level architecture for the JS Growth Next.js application.

**Authority:** implementation under `src/`, `prisma/schema.prisma`, and route trees.

---

## What this platform is

JS Growth is:

1. A **public marketing site** for JS Solutions
2. A **commercial Website Growth Audit** product (Free + Professional)
3. An **internal workspace** for leads, prospecting, outreach, competitive intelligence, and implementation planning

It is **not** a multi-tenant SaaS CRM sold as a product, and Competitive Intelligence V1 is **not** publicly shareable.

---

## Conceptual architecture

```text
PUBLIC ACQUISITION
  Marketing site
       ↓
  Free Website Growth Audit  (deterministic; OpenAI = 0)
       ↓
  Professional upgrade (Stripe one-time) → PDF + AI Interpretation
       ↓
  Consultation / contact CTA

INTERNAL GROWTH ENGINE
  Campaign / Places discovery
       ↓
  Website Growth Audit (same deterministic engine)
       ↓
  Qualification → human outreach selection
       ↓
  Contact discovery (email / forms)
       ↓
  AI draft → human approve → Resend email OR manual form submit
       ↓
  Delivery events → outcomes → optional Lead conversion

COMPETITIVE INTELLIGENCE (internal)
  Prospect competitive profile
       ↓
  Places competitor candidates → validate → human select (≤3)
       ↓
  Competitor Website Growth Audits (snapshots)
       ↓
  Deterministic CompetitiveComparisonSnapshot
       ↓
  AI CompetitiveInterpretation (facts stay Sprint 11)
       ↓
  Competitive Website Growth Analysis (presentation; DB-only)

COMMERCIALIZATION (internal)
  Audit facts (+ optional current comparison)
       ↓
  Deterministic Implementation Plan (Commercial Sprint 1 / 1.1)
        ↓
  AI Implementation Strategy (Commercial Sprint 2 — explanation only)
        ↓
  Opportunity (Commercial Sprint 3 — human-created commercial pursuit)
        ↓
  Commercial Scope (Commercial Sprint 4 — offer definition)
        ↓
  Commercial Pricing (Commercial Sprint 5 — recommendation + human approval)
        ↓
  Commercial Proposal (Commercial Sprint 6 — presentation snapshot; internal only)
       ↓
  Human review / approve Proposal
       ↓
  Proposal Delivery → Agreement → Acceptance → Commercial Payment (Sprints 7–9)
       ↓
  Client / Project Onboarding (Commercial Sprint 10 — human convert after eligibility)
       ↓
  (Future) Change orders / client portal — NOT implemented
       ↓
  (Future) Opportunity Won/Lost → Delivery

LEAD / SERVICE HANDOFF
  Lead + AuditReport + Implementation Plan evidence
       ↓
  Human-delivered services (websites, SEO, Local SEO, content, CRO, automation)
```
---

## Route boundaries

| Surface | Examples | Auth |
|---|---|---|
| Public | `/`, `/website-audit`, `/report/[id]`, `/report/[id]/pdf`, `/contact` | None (report UUID) |
| Payments | `/api/reports/[id]/checkout`, `/api/stripe/webhook`, `/payment/return` | Stripe signatures (webhook); return page is non-authoritative |
| Public commercial | `/proposal/{token}`, `/agreement/{token}` | Token hash + revocation; noindex |
| Email webhook | `/api/resend/webhook` | Svix / Resend secret |
| Internal | `/reports/**`, `/reports/prospecting/**`, `/internal-login` | `requireInternalSession()` / `getInternalSession()` |

Competitive Growth Analysis lives under internal prospecting routes only (`…/competitive-report`). It is **noindex** and not on `/report/*`.

---

## Fact engines vs interpretation vs presentation

| Layer | Role | OpenAI |
|---|---|---|
| Deterministic Website Audit | Scores, findings, crawl | No |
| Deterministic Competitive Comparison | Gaps, ranks, opportunities | No |
| Deterministic Implementation Plan | Evidence → workstreams / capabilities | No |
| AI Interpretation (audit / outreach / CI) | Explain or draft | Yes, explicit human trigger (or entitled first Pro view for audit AI) |
| Client report presentation | Render Sprint 11 + 12 | No |

---

## Major modules

| Area | Code root |
|---|---|
| Website audit | `src/lib/website-audit/` |
| Payments (audit) | `src/lib/payments/` |
| Commercial payments (agreements) | `src/lib/commercialization/payments/` |
| Client / Project onboarding | `src/lib/commercialization/onboarding/` |
| Prospecting | `src/lib/prospecting/` |
| Competitive intelligence | `src/lib/competitive-intelligence/` |
| Commercialization / implementation plans | `src/lib/commercialization/` |
| Email / Resend | `src/lib/email/` |
| Internal auth | `src/lib/internal-auth.ts` |
| Analytics sanitization | `src/lib/analytics/` |

---

## Related docs

- [Product catalog](product-catalog.md)
- [Prospecting Engine](prospecting-engine-v1.md)
- [Competitive Intelligence V1](competitive-intelligence.md)
- [Implementation Plan Engine](implementation-plan-engine.md)
- [Implementation Plan AI Strategy](implementation-plan-ai-strategy.md)
- [Opportunity Management](opportunity-management.md)
- [Scope Engine](scope-engine.md)
- [Pricing Engine](pricing-engine.md)
- [Proposal Engine](proposal-engine.md)
- [AI architecture](ai-architecture.md)
- [Database guide](database-guide.md)
- [Security & privacy](security-privacy.md)
- [Cost controls](cost-controls.md)
- [External services](external-services.md)
