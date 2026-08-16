# Legal data inventory (internal)

These policies are operational drafts based on the application's current functionality and should be reviewed by qualified legal counsel as the business scales or data practices change.

This document is for internal legal and engineering review. It does not include customer data, secrets, or API keys.

Last reviewed against the codebase: August 16, 2026.

## Public policy pages

| Page | Route |
|---|---|
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |
| Refund Policy | `/refund-policy` |

Effective / last-updated date is centralized in `src/content/legal/policy-meta.ts`.

Privacy requests and refund/payment issues use the published Contact page (`/contact`) and the published email `jssolutions.tx@gmail.com` from the contact page. Do not invent a `privacy@` address.

## Data categories

### Contact inquiry

- **Fields:** name, business name, email, phone (optional), website (optional), selected service, budget (optional), message. A honeypot field (`companyWebsite`) is used for spam filtering and is not treated as customer data.
- **Purpose:** respond to inquiries; notify JS Solutions of a new lead; send a confirmation to the person who submitted the form.
- **Storage:** not stored in a Prisma/database contact model. Delivered by email.
- **Third parties:** Resend (email delivery). Recipients are configured via `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL`.

### Audit lead

- **Fields:** first name, last name, email, phone (optional), company (optional), associated website/report, CRM-style status/notes/follow-up fields maintained internally.
- **Purpose:** associate contact details with an audit report; deliver requested report materials when professionally entitled; follow up about the audit and related services.
- **Storage:** PostgreSQL via Prisma (`Lead`, `LeadActivity`, optional `AuditReport.leadId`). Database hosted with Neon.
- **Third parties:** Neon (database); Resend (internal notification and, when applicable, customer report email with PDF).

### Website audit / report

- **Fields:** submitted website URL, hostname, report mode, scores, grades, issue counts, full audit JSON result, timestamps, optional lead association.
- **Purpose:** generate and display Website Growth Audits; retain the report for later viewing, Professional upgrade, and support.
- **How collected:** HTTP fetch of publicly accessible HTML and related public response headers for the submitted URL, plus a bounded number of same-site publicly linked pages (representative multi-page scan, not a complete crawl). When the user optionally supplies competitor URLs, a smaller bounded sample of publicly accessible pages may also be fetched from those competitor websites. Private/localhost/internal addresses are blocked. The audit does not log into password-protected admin areas or private databases.
- **Storage:** PostgreSQL via Prisma (`AuditReport`). Public viewing uses a report UUID link at `/report/[id]` (disallowed in robots). Internal staff viewing uses `/reports/[id]`.
- **Third parties:** Neon (database); hosting/infrastructure for the Next.js application. For Professional audits, structured website-audit findings derived from publicly accessible pages may be sent to OpenAI to generate an Executive Growth Analysis. Free audits do not send data to OpenAI. Customer email, lead-form details, payment records, Stripe identifiers, IP addresses, and analytics identifiers are not included in that AI request.

### Payments

- **Product:** one-time Professional Website Growth Audit via Stripe Checkout (`mode: payment`). No subscriptions. No customer accounts.
- **Fields stored by JS Growth:** Stripe Checkout Session ID, PaymentIntent ID (when available), Stripe Customer ID (when Stripe provides one), customer email from Stripe, amount, currency, purchase status (`PENDING` / `PAID` / `FAILED` / `REFUNDED`), paid timestamp, related report ID.
- **Not stored by JS Growth:** complete payment card number, CVC, or other full card credentials. Stripe Checkout processes card data.
- **Purpose:** confirm payment, unlock Professional entitlement on the related report, prevent duplicate unlocks/charges, support, accounting, and fraud/error review.
- **Storage:** PostgreSQL via Prisma (`ReportPurchase`).
- **Third parties:** Stripe (Checkout and webhooks); Neon (database).

### Analytics

- **Service:** Google Analytics via `@next/third-parties/google`, loaded only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- **Potential data:** pages viewed, browser/device characteristics, approximate geography, referral/source information, and interaction events. Custom events currently include `audit_completed`, `professional_checkout_started`, `multi_page_audit_completed`, `competitive_audit_completed` (competitor counts only, not competitor URLs), `ai_interpretation_completed`, and `ai_interpretation_failed` (`model`/`status` only) when `gtag` is present.
- **Purpose:** understand website usage and funnel behavior.
- **Storage / third parties:** Google Analytics / Google. JS Growth does not persist analytics payloads in the application database.
- **Consent:** no cookie-consent or opt-in banner is implemented. Evaluate additional consent tooling before targeting jurisdictions that require opt-in analytics consent.

### Admin / internal session

- **Fields:** staff email in a signed session cookie (`js-growth-internal-session`); configured admin email/password used only for authentication (not stored as customer lead data).
- **Purpose:** authenticate internal access to CRM/report administration.
- **Storage:** HTTP-only session cookie (JWT via `jose`); credentials from environment variables.
- **Third parties:** none beyond hosting. This is not a customer account.

### Infrastructure / technical data

- **Fields:** typical hosting/request metadata such as IP address, user agent, and request logs may be processed by the hosting platform as part of serving the website. These are not modeled in Prisma.
- **Purpose:** operate, secure, and troubleshoot the website.
- **Third parties:** hosting/infrastructure providers for the Next.js app; Neon for the database.

## Vendors confirmed in the repository

Named because they appear in application code or confirmed configuration:

- Stripe
- Resend
- Google Analytics (`@next/third-parties/google`)
- Neon / PostgreSQL (`@neondatabase/serverless`, `@prisma/adapter-neon`)
- OpenAI (`openai` SDK) — Professional AI Interpretation only; structured website-audit findings, not PII/payment records

Not currently used as product integrations (do not disclose as active vendors in customer policies unless that changes):
- Meta / Facebook Pixel
- Google Business Profile APIs
- Rank-tracking providers

Hosting is implied by the deployed Next.js application. Do not invent additional vendor relationships.

## Cookies and similar technologies

- Internal admin session cookie: `js-growth-internal-session` (HTTP-only, `SameSite=lax`, Secure in production).
- Google Analytics cookies/similar technologies may be set when GA is configured.
- No customer `localStorage` / `sessionStorage` entitlement store was found for paid access. Professional access is stored as `ReportPurchase` in the database.

## Future review (not implemented)

- Cookie / analytics consent banner or CMP
- Jurisdiction-specific privacy notices (GDPR, CCPA/CPRA, TDPSA certification language)
- Documented retention schedule with automatic deletion
- Policy-acceptance logging at checkout
- Named venue / arbitration terms
- PCI / security certification claims
- Production live-mode Stripe configuration (separate from this legal milestone)

## Items this inventory does not claim

- Full GDPR, CCPA, or Texas Data Privacy and Security Act compliance
- PCI certification of JS Growth
- That information is 100% secure
- That analytics data is anonymous
- That JS Growth sells personal information
