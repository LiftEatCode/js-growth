# Standard Operating Procedure: Git Workflow

> **Part of the JS Solutions Standard Operating Procedures**

---

# Purpose

This Standard Operating Procedure (SOP) defines the Git workflow used for all software projects developed by JS Solutions.

The objective is to maintain a clean project history, protect production code, improve collaboration, and ensure every change can be traced, reviewed, and recovered when necessary.

Version control is the foundation of reliable software development.

---

# Scope

This SOP applies to:

- Client websites
- SaaS products
- Internal tools
- APIs
- Automation projects
- Documentation repositories

Every repository managed by JS Solutions should follow this workflow.

---

# JS Solutions Standards

The following standards apply to every repository:

- GitHub is the source of truth.
- The `main` branch should always remain deployable.
- Every project includes a meaningful README.
- Every project includes a `docs/` directory when appropriate.
- Significant architectural decisions are documented using ADRs.
- Run linting and production builds before pushing changes.
- Never commit secrets, passwords, API keys, or environment files.
- Commit early and commit often.
- Each commit should represent one logical change.
- Automation should replace repetitive manual tasks whenever practical.

---

# Responsibilities

## Lead Developer

Responsible for:

- Maintaining repository health
- Reviewing commit history
- Resolving merge conflicts
- Enforcing Git standards

---

## Developers

Responsible for:

- Following branching strategy
- Creating meaningful commits
- Syncing with remote repositories
- Maintaining clean commit history

---

# Estimated Time

Daily Git usage:

15–30 minutes

Merge conflict resolution:

Varies by complexity

Repository maintenance:

30 minutes weekly

---

# Prerequisites

Before making changes:

- Repository cloned
- Git installed
- GitHub access confirmed
- SSH or HTTPS authentication configured
- Local development environment verified

---

# Procedure

## Step 1 — Synchronize Repository

Before beginning work:

```bash
git pull origin main
```

Verify:

- Repository is up to date
- No merge conflicts
- Working tree is clean

Never begin development from outdated code.

---

## Step 2 — Create a Working Branch

Create a descriptive branch name.

Examples:

```
feature/contact-form

feature/blog-search

fix/mobile-navigation

docs/update-playbooks

refactor/header-component
```

Avoid working directly on `main` when collaborating.

---

## Step 3 — Implement Changes

During development:

- Keep changes focused.
- Test frequently.
- Commit logical milestones.
- Avoid unrelated modifications.

---

## Step 4 — Review Changes

Before committing:

```bash
git status

git diff
```

Verify:

- No accidental files
- No secrets
- No debugging code
- No temporary files

Review every change before committing.

---

## Step 5 — Commit Changes

Write meaningful commit messages.

Preferred format:

```
Add client onboarding SOP

Fix mobile navigation layout

Update pricing page content

Refactor contact form validation
```

Avoid messages such as:

```
update

fix

stuff

changes
```

Every commit should explain **what changed**.

---

## Step 6 — Validate Project

Before pushing:

Run:

```
npm run lint

npm run build
```

Verify:

- Build succeeds
- Lint passes
- No warnings requiring immediate attention

Never push broken code.

---

## Step 7 — Push Changes

Push the branch:

```bash
git push origin branch-name
```

Confirm:

- Push completed successfully
- GitHub repository updated
- CI/CD passes (if applicable)

---

## Step 8 — Merge

Before merging:

Verify:

- Code reviewed
- Tests passed
- Build successful
- Documentation updated

Merge according to the project's branching strategy.

---

## Step 9 — Verify Production Readiness

After merge:

Confirm:

- Repository builds
- Deployments succeed
- Documentation updated
- Version history complete

The repository should remain deployable.

---

# Commit Message Standards

Good examples:

```
Add documentation automation scripts

Create Local SEO playbook

Improve blog search performance

Fix mobile navigation overlap

Update deployment documentation
```

Poor examples:

```
fix

update

changes

test

asdf
```

---

# Files That Should Never Be Committed

Examples:

```
.env

.env.local

node_modules/

dist/

build/

coverage/

*.log

temporary exports

API keys

private certificates
```

Use `.gitignore` appropriately.

---

# Repository Standards

Every repository should contain:

```
README.md

LICENSE (if applicable)

.gitignore

docs/

scripts/

package.json

CHANGELOG.md (recommended)
```

---

# Quality Standards

Every repository should:

- Have a clean history
- Build successfully
- Follow naming conventions
- Include documentation
- Remain deployable
- Protect sensitive information

---

# Common Issues

| Issue | Resolution |
|--------|------------|
| Merge conflict | Pull latest changes and resolve conflicts before continuing |
| Accidental commit | Amend or revert the commit before merging |
| Secret committed | Rotate the secret immediately and remove it from Git history |
| Broken build | Fix locally before pushing |
| Large unrelated commit | Split into smaller logical commits |

---

# Success Criteria

The Git workflow is successful when:

- Repository stays organized
- Commit history remains readable
- Production stays stable
- Documentation remains current
- Code can be traced to specific changes

---

# Git Workflow Checklist

Before pushing, verify:

- [ ] Repository synchronized
- [ ] Changes reviewed
- [ ] Commit message meaningful
- [ ] Lint passes
- [ ] Production build succeeds
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] Branch pushed successfully

---

# Related Documents

- Development SOP README
- Project Setup SOP
- Branching Strategy SOP
- Code Review SOP
- Deployment SOP
- Development Standards

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

**SOP:** Git Workflow

**Status:** Active

**Version:** 1.0

**Last Updated:** August 2026