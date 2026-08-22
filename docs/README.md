# JS Growth / JS Solutions — Documentation Index

> **Code is the source of truth.** These docs describe what is implemented in the repository as of Competitive Intelligence V1 (through Sprint 13.1).

JS **Solutions** is the company. JS **Growth** is this Next.js application (`js-growth.com`): marketing site + Website Growth Audit product + internal growth/prospecting/competitive tools.

---

## Start here

| Audience | Start |
|---|---|
| New developer | Root [`README.md`](../README.md) |
| Platform overview | [`development/platform-architecture.md`](development/platform-architecture.md) |
| What we sell / what is internal | [`development/product-catalog.md`](development/product-catalog.md) |
| Operators | [`sops/README.md`](sops/README.md) |
| Roadmap | [`../ROADMAP.md`](../ROADMAP.md) |

---

## Product & engineering (canonical)

| Topic | Document |
|---|---|
| Platform architecture | [`development/platform-architecture.md`](development/platform-architecture.md) |
| Website Growth Audit | [`commercial-launch-v1.md`](commercial-launch-v1.md), [`development/stripe-paid-audit.md`](development/stripe-paid-audit.md), [`development/ai-interpretation-v1.md`](development/ai-interpretation-v1.md) |
| Prospecting Engine V1 | [`development/prospecting-engine-v1.md`](development/prospecting-engine-v1.md) |
| Competitive Intelligence | [`development/competitive-intelligence.md`](development/competitive-intelligence.md) |
| Implementation Plan Engine | [`development/implementation-plan-engine.md`](development/implementation-plan-engine.md) |
| Implementation Plan AI Strategy | [`development/implementation-plan-ai-strategy.md`](development/implementation-plan-ai-strategy.md) |
| Opportunity Management | [`development/opportunity-management.md`](development/opportunity-management.md) |
| Scope Engine | [`development/scope-engine.md`](development/scope-engine.md) |
| Pricing Engine | [`development/pricing-engine.md`](development/pricing-engine.md) |
| Proposal Engine | [`development/proposal-engine.md`](development/proposal-engine.md) |
| Public-audit competitor URLs (separate) | [`development/competitive-intelligence-v1.md`](development/competitive-intelligence-v1.md) |
| AI architecture (all OpenAI paths) | [`development/ai-architecture.md`](development/ai-architecture.md) |
| External services / APIs | [`development/external-services.md`](development/external-services.md) |
| Database / Prisma guide | [`development/database-guide.md`](development/database-guide.md) |
| Security & privacy | [`development/security-privacy.md`](development/security-privacy.md) |
| Cost controls | [`development/cost-controls.md`](development/cost-controls.md) |
| Product catalog | [`development/product-catalog.md`](development/product-catalog.md) |
| Analytics | [`development/analytics.md`](development/analytics.md) |
| Coding standards | [`development/coding-standards.md`](development/coding-standards.md) |
| Vercel notes | [`development/vercel.md`](development/vercel.md) |

### Historical sprint notes (preserved)

Competitive Intelligence build history (read the coherent V1 doc first):

- [`development/competitive-intelligence-sprint-9.md`](development/competitive-intelligence-sprint-9.md) … [`sprint-13.md`](development/competitive-intelligence-sprint-13.md)

---

## Operations / SOPs

Index: [`sops/README.md`](sops/README.md)

Product-critical SOPs:

- Website Audit operations
- Prospecting campaign
- Competitive analysis
- Outreach safety
- Production deployment
- Production acceptance

---

## Services (client delivery)

[`services/`](services/) — Website Development, Local SEO, AI Automation, Analytics, Custom Software.

These are **delivery playbooks**. They are not the same as the Website Growth Audit SaaS product. Do not claim automated delivery of capabilities that exist only as internal tools.

---

## Company / sales / marketing / SEO / playbooks

- [`company/`](company/) — mission, values, branding
- [`sales/`](sales/), [`marketing/`](marketing/), [`seo/`](seo/), [`playbooks/`](playbooks/), [`templates/`](templates/)
- [`ideas/`](ideas/) — exploratory; not implemented by default
- [`decisions/`](decisions/) — ADRs
- [`legal-data-inventory.md`](legal-data-inventory.md)

---

## Planning

[`../planning/`](../planning/) — vision, backlog, milestones. Reconcile against [`../ROADMAP.md`](../ROADMAP.md) and this index when status conflicts.

---

## Terminology

| Term | Meaning |
|---|---|
| JS Solutions | The company |
| JS Growth | This application / product platform |
| Website Growth Audit | Public free + Professional audit product |
| Website Growth Score | Deterministic 0–100 audit score |
| Competitive relevance | Prospecting CI score for competitor fit (not Website Growth Score) |
| Competitive Website Growth Analysis | Client-ready CI report (internal preview in V1) |
| Prospecting Engine | Internal acquisition workflow |
| Competitive Intelligence | Prospecting CI pipeline (Places → audits → comparison → AI → report) |
| Public competitive (audit) | Optional competitor URLs on a public Website Growth Audit |
