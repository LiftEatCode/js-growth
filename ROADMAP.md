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

**Active milestone:** Production Launch V1 for the Website Growth Audit.

The marketing website is in production. The Website Growth Audit is implemented and is a **launch candidate**, not a planned project.

---

## Website

Status: 🟢 Production

Hosting: Vercel

Framework: Next.js

Deployment: GitHub → Vercel CI/CD

Performance Goals

- ✅ Lighthouse 90+
- ⏳ Lighthouse 95+
- ⏳ Lighthouse 100

---

## Website Growth Audit

Status: 🟡 Launch Candidate

Priority: Critical

This is the current commercial product on `js-growth.com`. It is not backlog, planning, or a future SaaS sketch.

Implemented capabilities:

- **Free Website Growth Audit** — score, category scores, limited top priorities, limited quick wins, methodology, representative multi-page scan summary, competitive teaser when competitor URLs are supplied. No credit card. No OpenAI call.
- **Professional Website Growth Audit** — full recommendations, 30–90 day action plan, technical evidence, category deep dives, complete findings, site overview and page inventory, Competitive Intelligence, Executive Growth Analysis (AI Interpretation), Professional PDF, implementation CTA.
- **Stripe one-time paid upgrade and entitlement** — Checkout `mode: "payment"` only. Webhook grants `ReportPurchase.status = PAID`. Access is by report URL; there are no customer accounts.
- **Technical SEO V2** — crawlability, indexability, robots, sitemap, canonical, structured data, Open Graph, viewport, and site-level indexability/canonical/duplicate-metadata patterns.
- **On-Page SEO / Content Intelligence** — titles, meta descriptions, headings, title/H1 alignment, content depth and structure, images, and internal links, including multi-page content patterns.
- **Performance Intelligence** — static HTML/resource signals (document size, scripts, styles, images, third-party hosts, resource hints). Not Lighthouse and not measured Core Web Vitals.
- **Multi-Page Site Intelligence** — bounded same-site crawl (representative scan, not a complete site inventory). Free and Professional run the same crawl once; payment changes report visibility, not recrawl.
- **CRO / Conversion Intelligence** — conversion paths, contact CTAs, lead forms, trust signals, and site-level conversion coverage.
- **Local SEO Intelligence** — NAP, LocalBusiness schema, hours, location/service-area pages, and geographic signals from public HTML. Not Google Business Profile, citations, rankings, or reviews APIs.
- **Competitive Intelligence** — optional explicit competitor URLs (up to three), bounded competitor scans, median/benchmark comparison. No automatic competitor discovery, SERP data, or traffic estimates.
- **Professional report and PDF** — entitled `/report/[id]` experience plus gated PDF download.
- **AI Interpretation V1** — Professional-only OpenAI strategist layer over stored deterministic evidence. Generated after entitlement on first Professional view; persisted and reused. Free audits make zero AI calls.
- **Internal lead/report management** — session-gated `/reports` workspace with pipeline, follow-ups, lead capture, prospect conversion, and report detail.
- **Published legal pages** — Privacy Policy (`/privacy`), Terms of Service (`/terms`), and Refund Policy (`/refund-policy`).

Known product constraints that remain true at launch:

- Representative scan, not every URL on the site
- No rank tracking, GBP data, backlinks, or recurring monitoring
- No customer login; report UUID URLs
- Policies are operational drafts and should be reviewed by qualified legal counsel as the business scales

---

## Prospecting Engine V1

Status: 🟡 Sprint 3 — Automated Website Audit + Prospect Qualification

Priority: Internal acquisition workflow (does not replace Production Launch V1)

This is an **internal JS Solutions** workspace. It is not a customer-facing SaaS.

Product principle: produce **five credible, qualified prospects** per session, not five emails sent.

**Prospect ≠ Lead.** A Prospect is a discovered business. It is not an inbound `AuditReport` without a Lead, and it is not converted into the CRM until a human later marks interest.

Sprint 3 (current):

- Authenticated `/reports/prospecting` campaigns (Sprint 1)
- Google Places discovery + human import (Sprint 2)
- Deterministic Website Growth Audit + qualification + recommended top N
- Prospecting AuditReports are not public customer reports

Later sprints (not started):

- Public contact discovery and AI outreach drafts
- Human approval, then Resend send
- Reply tracking and Prospect → Lead conversion

V1 sending, when built, remains **human-approved**. No autonomous outbound.

See `docs/development/prospecting-engine-v1.md`.

---

## Documentation

Status: 🟢 Active

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
- ✅ Operations files
- 🚧 Remaining service playbooks and SEO/Support SOP coverage

---

# Active Milestone — Production Launch V1

This is the only current product-launch milestone. It is QA, configuration, and go-live work. It does **not** add new audit product features.

1. Automated verification / build / lint — wire existing `*.verify.ts` checks, `npm run lint`, and `npm run build` into a repeatable gate (no GitHub Actions workflow exists yet).
2. Real-world audit QA — strong site, weak site, local business, and service-area business through the live UI.
3. Free-to-Professional funnel QA — landing → Free audit → Free report → upgrade CTA → Checkout → Professional report.
4. AI interpretation QA — Professional-only generation, persistence/reuse, Free path makes zero OpenAI calls, failure does not block entitlement.
5. Desktop / mobile / report / PDF visual QA.
6. Stripe **TEST MODE** end-to-end purchase, including webhook entitlement and later return to the same report URL.
7. Analytics / logging / observability verification — Google Analytics plus commercial events (`audit_completed`, `professional_checkout_started`, multi-page / competitive / AI events) and server AI logs.
8. Production environment configuration review — `DATABASE_URL`, Stripe, Resend, `OPENAI_API_KEY`, model, site URL, GA. No test keys in production. Never prefix secrets with `NEXT_PUBLIC_`.
9. Stripe **LIVE** configuration — live Product/Price, secret key, webhook `https://<domain>/api/stripe/webhook`, live Price ID, matching display price label. Confirm Automatic Tax intent, Product tax code/behavior, and legal nexus/obligations separately (TEST tax is not legal confirmation).
10. Controlled live transaction — confirm `ReportPurchase.status = PAID`, Stripe receipt, Professional report and PDF access on refresh.
11. Soft launch — limited real traffic with the Free/Professional funnel.
12. `website-audit-v1.0` release/tag.

Do not mix Stripe test Price IDs with live keys.

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
- Prospecting Engine V1 Sprint 3 (`/reports/prospecting`) — discovery, internal audits, and qualification, separate from inbound Leads

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

Prospecting Engine V1 Sprint 3 is in use under `/reports/prospecting` (audit + qualification). Do not start Sprint 4 (contact discovery / outreach drafts) until Sprint 3 is in use.

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
