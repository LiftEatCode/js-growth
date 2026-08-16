# Standard Operating Procedure: Environment Management

> **Part of the JS Solutions Standard Operating Procedures**

---

# Purpose

This Standard Operating Procedure (SOP) defines how development, staging, and production environments are created, maintained, secured, and documented at JS Solutions.

The objective is to ensure consistent application behavior across environments while protecting sensitive information and reducing deployment risk.

Proper environment management improves security, simplifies onboarding, and supports reliable software delivery.

---

# Scope

This SOP applies to all JS Solutions software projects, including:

- Client websites
- SaaS products
- Internal applications
- APIs
- Automation systems
- Development tools

---

# JS Solutions Standards

The following standards apply to every project:

- Every project must include a `.env.example` file.
- Secrets must never be committed to source control.
- Development, staging, and production environments should remain isolated.
- Environment variables should be documented.
- Configuration should be reproducible.
- Credentials should be stored using approved secure methods.
- Changes to production configuration should be documented.

---

# Responsibilities

## Lead Developer

Responsible for:

- Defining required environment variables
- Managing production configuration
- Reviewing security practices
- Maintaining environment documentation

---

## Developers

Responsible for:

- Configuring local environments
- Protecting credentials
- Reporting configuration issues
- Following security standards

---

# Estimated Time

Initial setup:

30–60 minutes

Project updates:

10–15 minutes

Environment audits:

30 minutes monthly

---

# Prerequisites

Before configuring an environment:

- Repository cloned
- Project documentation reviewed
- Required credentials obtained
- Technology stack confirmed

---

# Environment Types

## Development

Purpose:

- Local development
- Feature implementation
- Debugging
- Testing

Characteristics:

- Local machine
- Safe for experimentation
- May use test data

---

## Staging

Purpose:

- Pre-production validation
- Client review
- Final testing

Characteristics:

- Mirrors production
- Uses production-like configuration
- Limited access

---

## Production

Purpose:

- Live customer-facing application

Characteristics:

- Stable
- Secure
- Monitored
- Backed up

Changes should be carefully controlled.

---

# Procedure

## Step 1 — Create Environment Files

Prepare:

```
.env.example
```

Developers create:

```
.env.local
```

Do not commit `.env.local`.

---

## Step 2 — Document Variables

Document every required variable.

Examples:

```
DATABASE_URL

NEXTAUTH_SECRET

RESEND_API_KEY

GOOGLE_ANALYTICS_ID

NEXT_PUBLIC_SITE_URL
```

Include a brief description for each variable.

---

## Step 3 — Configure Local Environment

Verify:

- Variables populated
- Development server starts
- Database connection succeeds
- External services connect properly

Resolve issues before development begins.

---

## Step 4 — Configure Staging

Verify:

- Separate credentials
- Independent database
- Production-like settings
- Secure access controls

Never reuse development secrets in staging.

---

## Step 5 — Configure Production

Verify:

- Environment variables set
- Secrets stored securely
- Domain configuration verified
- SSL enabled
- Monitoring configured

Document all production configuration changes.

---

## Step 6 — Secure Credentials

Store sensitive information using approved methods.

Examples:

- Vercel Environment Variables
- GitHub Secrets
- Password manager
- Cloud secret management services

Never share secrets through email or chat.

---

## Step 7 — Verify Configuration

Test:

- Application startup
- Authentication
- Email delivery
- Database connectivity
- Third-party integrations

Ensure each environment functions correctly.

---

## Step 8 — Update Documentation

When environment variables change:

- Update `.env.example`
- Update project documentation
- Notify affected developers

Keep documentation synchronized with the application.

---

# JS Solutions Standard Environment Variables

Common variables include:

```
NODE_ENV

DATABASE_URL

NEXT_PUBLIC_SITE_URL

RESEND_API_KEY

CONTACT_FROM_EMAIL

CONTACT_TO_EMAIL

GOOGLE_ANALYTICS_ID

NEXT_PUBLIC_GA_MEASUREMENT_ID

STRIPE_SECRET_KEY

STRIPE_WEBHOOK_SECRET

STRIPE_PROFESSIONAL_AUDIT_PRICE_ID

NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL
```

Project-specific Stripe setup is documented in `docs/development/stripe-paid-audit.md`.

---

# Security Standards

Never commit:

- API keys
- Passwords
- Certificates
- Private keys
- Database credentials
- Access tokens

Rotate compromised credentials immediately.

---

# Quality Standards

Every environment should:

- Be reproducible
- Be documented
- Use secure credential storage
- Remain isolated from other environments
- Support reliable deployments

---

# Common Issues

| Issue | Resolution |
|--------|------------|
| Missing environment variable | Update `.env.example` and documentation |
| Secret committed to Git | Rotate immediately and remove from Git history |
| Configuration drift | Compare environments and synchronize intentionally |
| Production differs from staging | Document differences and minimize them |
| Invalid credentials | Verify secrets and access permissions |

---

# Success Criteria

Environment management is successful when:

- Environments are documented
- Secrets remain secure
- Applications run consistently
- Configuration changes are tracked
- Developers can reproduce the environment

---

# Environment Checklist

Before deployment, verify:

- [ ] `.env.example` updated
- [ ] Local environment verified
- [ ] Staging verified
- [ ] Production configuration reviewed
- [ ] Secrets stored securely
- [ ] Documentation updated

---

# Related Documents

- Development SOP README
- Project Setup SOP
- Deployment SOP
- Release Process SOP
- Incident Response SOP

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | August 2026 | Initial version |

---

## Document Information

**Owner:** Josh Spradling

**Company:** JS Solutions

**Department:** Development

**Category:** Standard Operating Procedures

**SOP:** Environment Management

**Status:** Approved

**Version:** 1.0

**Last Updated:** August 2026