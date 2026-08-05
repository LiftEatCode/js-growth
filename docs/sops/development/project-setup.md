# Standard Operating Procedure: Project Setup

> **Part of the JS Solutions Standard Operating Procedures**

---

# Purpose

This Standard Operating Procedure (SOP) defines the process for creating and preparing a new software project at JS Solutions.

The objective is to ensure every project begins with a consistent structure, proper tooling, documented standards, and a scalable foundation for future development.

A well-prepared project reduces technical debt, improves maintainability, and accelerates development.

---

# Scope

This SOP applies to all software projects developed by JS Solutions, including:

- Marketing websites
- Business applications
- SaaS platforms
- Internal tools
- Client portals
- Automation systems
- APIs

---

# Responsibilities

## Lead Developer

Responsible for:

- Selecting the technology stack
- Initializing the repository
- Configuring the development environment
- Establishing project standards

---

## Project Manager

Responsible for:

- Creating project documentation
- Confirming project objectives
- Recording milestones
- Coordinating project kickoff

---

## Development Team

Responsible for:

- Following established standards
- Configuring local environments
- Reviewing project documentation
- Reporting setup issues

---

# Estimated Time

Planning: 30–60 minutes

Repository Setup: 30 minutes

Development Environment: 30–60 minutes

Documentation: 30 minutes

Total: Approximately 2–3 hours

---

# Prerequisites

Before creating a project:

- Project approved
- Scope defined
- Technology stack selected
- Repository owner determined
- Naming conventions reviewed

---

# Procedure

## Step 1 — Create the Repository

Create the project repository.

Verify:

- Repository name follows JS Solutions naming standards
- Repository visibility selected
- README created
- License added (if applicable)
- Git initialized

Record the repository URL.

---

## Step 2 — Initialize Project Structure

Create the initial project structure.

Typical directories include:

- app/
- components/
- lib/
- public/
- docs/
- scripts/
- tests/

Adjust as needed for the selected technology stack.

---

## Step 3 — Configure Development Tools

Install and configure:

- Package manager
- Linter
- Formatter
- Type checking
- Git hooks (if applicable)

Ensure all developers use consistent tooling.

---

## Step 4 — Configure Version Control

Verify:

- .gitignore
- Branch protection strategy
- Default branch
- Repository settings

Confirm version control follows JS Solutions standards.

---

## Step 5 — Configure Project Documentation

Create or verify:

- README
- CHANGELOG
- Documentation structure
- ADR directory
- Project roadmap

Documentation should begin with the project—not after it.

---

## Step 6 — Configure Environment Variables

Create:

- .env.example
- Local environment configuration

Document every required environment variable.

Never commit secrets to source control.

---

## Step 7 — Configure CI/CD (If Applicable)

Prepare:

- Build validation
- Lint checks
- Test execution
- Deployment pipeline

Ensure automation is functioning before active development begins.

---

## Step 8 — Install Dependencies

Install required packages.

Verify:

- Dependencies install successfully
- Development server starts
- Build completes
- No critical warnings

Document any known issues.

---

## Step 9 — Verify Local Development

Confirm:

- Application runs locally
- Hot reload functions
- Environment variables load correctly
- Development tooling operates normally

Resolve setup issues before proceeding.

---

## Step 10 — Prepare for Development

Confirm the project is ready.

Verify:

- Repository configured
- Documentation created
- Tooling installed
- Environment configured
- Development server operational

Project Status:

☐ Ready for Development

---

# JS Solutions Standard Technology Stack

Unless project requirements dictate otherwise, JS Solutions currently prefers:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## Backend

- Next.js Server Actions
- Node.js
- REST APIs
- PostgreSQL or SQL Server (project dependent)

---

## Deployment

- Vercel
- GitHub
- GitHub Actions (when appropriate)

---

## Email

- Resend

---

## Analytics

- Google Analytics
- Google Search Console

---

## Development Tools

- Git
- GitHub
- Cursor
- VS Code
- npm

---

# Quality Standards

Every new project should:

- Follow JS Solutions standards
- Include documentation from day one
- Use version control
- Be reproducible by another developer
- Be ready for automated deployment

Consistency is more valuable than speed during project setup.

---

# Common Issues

| Issue | Resolution |
|--------|------------|
| Missing documentation | Create required documents before development |
| Environment configuration errors | Verify `.env.example` and local variables |
| Dependency conflicts | Update lock files and verify package versions |
| Build failures | Resolve before writing feature code |
| Inconsistent tooling | Standardize linting, formatting, and package management |

---

# Success Criteria

Project setup is complete when:

- Repository created
- Documentation initialized
- Development tools configured
- Environment verified
- Dependencies installed
- Application builds successfully
- Local development confirmed

The project is now ready for active development.

---

# Project Setup Checklist

Before beginning development, verify:

- [ ] Repository created
- [ ] Project structure initialized
- [ ] Documentation created
- [ ] Tooling configured
- [ ] Environment variables documented
- [ ] Dependencies installed
- [ ] Local development verified
- [ ] Initial commit completed

---

# Related Documents

- Development SOP README
- Git Workflow SOP
- Branching Strategy SOP
- Environment Management SOP
- Website Development Playbook
- Coding Standards

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

**SOP:** Project Setup

**Status:** Active

**Version:** 1.0

**Last Updated:** August 2026