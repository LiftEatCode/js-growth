# Standard Operating Procedure: Deployment

> **Part of the JS Solutions Standard Operating Procedures**

---

# Purpose

This Standard Operating Procedure (SOP) defines the deployment process for all software projects developed and maintained by JS Solutions.

The objective is to deploy software safely, consistently, and with minimal disruption while ensuring production environments remain stable and secure.

Every deployment should be repeatable, documented, and verifiable.

---

# Scope

This SOP applies to:

- Client websites
- SaaS products
- APIs
- Internal applications
- Automation systems
- Documentation websites

---

# JS Solutions Standards

The following standards apply to every deployment:

- The `main` branch must always be deployable.
- All deployments should originate from version-controlled code.
- Production deployments require successful builds.
- Linting must pass before deployment.
- Documentation should be updated with deployment-related changes.
- Rollback procedures should be understood before deployment begins.
- Production deployments should be monitored immediately after release.

---

# Responsibilities

## Lead Developer

Responsible for:

- Approving deployments
- Verifying production readiness
- Coordinating rollback if necessary
- Maintaining deployment documentation

---

## Developers

Responsible for:

- Preparing deployment changes
- Verifying build success
- Monitoring deployments
- Reporting deployment issues

---

# Estimated Time

Preparation:

15–30 minutes

Deployment:

5–15 minutes

Post-deployment verification:

15–30 minutes

Total:

Approximately 30–60 minutes

---

# Prerequisites

Before deployment:

- Code review completed
- Build successful
- Lint successful
- Documentation updated
- Environment variables verified
- Release approved

---

# Procedure

## Step 1 — Verify Repository

Confirm:

- Latest changes merged into `main`
- Repository synchronized
- No unresolved conflicts
- Commit history reviewed

---

## Step 2 — Validate (JS Growth)

For the `js-growth` application, from a clean tree:

```bash
git status
npx prisma validate
npx tsc --noEmit
npm run lint
npm run build
```

Run the `*.verify.ts` suite when product logic changed (or when unsure).

Confirm:

- No errors
- Successful production build

---

## Step 3 — Prisma migrations (only when needed)

**Not every deployment requires a migration.**

1. Check status against the target database:

```bash
npx prisma migrate status
```

2. If the status reports **pending migrations**, apply them to that database:

```bash
npx prisma migrate deploy
```

3. If status is up to date (documentation-only or app-only changes with no schema migration), **do not** run `migrate deploy` as a ritual.

Never invent migrations during a docs-only release. Never use `migrate dev` against production.

---

## Step 4 — Verify Configuration

Review environment variable **categories** (see root README / `.env.example`):

- Database (`DATABASE_URL`, `DIRECT_URL`)
- Internal session (`REPORTS_*`)
- Resend / contact
- Stripe (test vs live discipline)
- Optional GA
- OpenAI (server-only)
- Google Places (server-only)
- `NEXT_PUBLIC_SITE_URL`

Ensure production configuration matches the features being released. Do not paste secrets into tickets or docs.

---

## Step 5 — Deploy (JS Growth)

Typical path:

1. Commit and push to the branch that deploys to production (usually `main` via GitHub → Vercel).
2. Confirm the Vercel deployment succeeds.
3. Review build/runtime logs.

---

## Step 6 — Verify Production

After deployment, run the relevant parts of [Production Acceptance](../operations/production-acceptance.md):

- Homepage / audit funnel
- Internal login / prospecting (if touched)
- Stripe / Resend webhooks (if touched)
- Competitive Intelligence isolation (if touched)

Verify the application behaves as expected.

---

## Step 7 — Monitor Logs

Review:

- Build logs
- Runtime logs
- Error reporting
- Deployment notifications

Investigate unexpected behavior immediately.

---

## Step 8 — Verify Analytics (if public site affected)

Confirm:

- Google Analytics tracking (when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set)
- Event tracking without PII leakage

---

## Step 9 — Communicate Completion

Document:

- Deployment date
- Version deployed
- Whether migrations were applied (`migrate status` result)
- Significant changes
- Known issues (if any)

Notify stakeholders when appropriate.

---

# Rollback Procedure

If a deployment introduces critical issues:

1. Stop further deployments.
2. Identify the affected release.
3. Roll back to the previous stable version.
4. Verify application functionality.
5. Document the incident.
6. Schedule a corrective release.

Never continue deploying while a production issue remains unresolved.

---

# Deployment Checklist

Before deployment, verify:

- [ ] `git status` clean for intended commit
- [ ] `prisma validate` / typecheck / lint / build successful
- [ ] `prisma migrate status` reviewed (deploy migrations **only if pending**)
- [ ] Documentation updated when behavior/ops changed
- [ ] Environment variables verified for touched integrations
- [ ] Production configuration reviewed
- [ ] Deployment approved

After deployment, verify:

- [ ] Homepage functioning
- [ ] Relevant acceptance checklist items ([production-acceptance.md](../operations/production-acceptance.md))
- [ ] Webhooks healthy if payment/email changed
- [ ] Analytics verified if applicable
- [ ] Logs reviewed
- [ ] Stakeholders notified

---

# Quality Standards

Every deployment should:

- Be repeatable
- Be documented
- Be reversible
- Minimize downtime
- Protect customer data
- Maintain production stability

---

# Common Issues

| Issue | Resolution |
|--------|------------|
| Build failure | Resolve locally before redeploying |
| Environment variable missing | Update configuration and redeploy |
| Production error | Roll back if necessary and investigate |
| Third-party integration failure | Verify credentials and service availability |
| Analytics not tracking | Confirm configuration and test events |

---

# Success Criteria

A deployment is successful when:

- Application is available
- Core functionality verified
- Monitoring shows no critical issues
- Documentation updated
- Stakeholders informed

---

# Related Documents

- Development SOP README
- Environment Management SOP
- Code Review SOP
- Release Process SOP
- Incident Response SOP

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | August 2026 | Initial version |
| 1.1 | August 2026 | JS Growth: Prisma migrate status vs deploy; acceptance link |

---

## Document Information

**Owner:** Josh Spradling

**Company:** JS Solutions

**Department:** Development

**Category:** Standard Operating Procedures

**SOP:** Deployment

**Status:** Approved

**Version:** 1.1

**Last Updated:** August 2026