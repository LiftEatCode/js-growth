# Website Development Performance Checklist

> **Part of the JS Solutions Website Development Playbook**

---

# Purpose

This checklist verifies that every JS Solutions website delivers a fast, responsive, and efficient user experience.

Performance affects user satisfaction, search engine rankings, accessibility, and conversion rates.

Every website should be optimized before launch and reviewed regularly throughout its lifecycle.

---

# Project Information

**Client:**

_____________________________________

**Project:**

_____________________________________

**Reviewer:**

_____________________________________

**Review Date:**

_____________________________________

---

# Core Web Vitals

Review the latest Core Web Vitals.

## Largest Contentful Paint (LCP)

Target:

- [ ] Under 2.5 seconds

Review:

- [ ] Hero image optimized
- [ ] Critical resources load quickly
- [ ] Render-blocking assets minimized

---

## Interaction to Next Paint (INP)

Target:

- [ ] Under 200ms

Review:

- [ ] Buttons respond quickly
- [ ] Forms remain responsive
- [ ] JavaScript execution minimized

---

## Cumulative Layout Shift (CLS)

Target:

- [ ] Less than 0.10

Verify:

- [ ] Images have dimensions
- [ ] Fonts load correctly
- [ ] Dynamic content does not shift layout

---

# Images

Verify:

- [ ] Images compressed
- [ ] Modern formats used where appropriate (WebP, AVIF)
- [ ] Responsive image sizes
- [ ] Lazy loading enabled where appropriate
- [ ] No oversized images
- [ ] Decorative images minimized

---

# Typography

Review:

- [ ] Fonts optimized
- [ ] Font files minimized
- [ ] Unused font weights removed
- [ ] Fallback fonts defined

---

# CSS

Verify:

- [ ] Unused CSS removed
- [ ] CSS minimized
- [ ] Critical styles prioritized
- [ ] No duplicate styles

---

# JavaScript

Review:

- [ ] Unused JavaScript removed
- [ ] Code splitting implemented
- [ ] Dynamic imports used where appropriate
- [ ] Third-party scripts minimized

---

# Network Requests

Verify:

- [ ] Requests minimized
- [ ] No unnecessary external resources
- [ ] Assets cached appropriately
- [ ] CDN configured (if applicable)

---

# Caching

Review:

- [ ] Browser caching
- [ ] Static asset caching
- [ ] CDN caching
- [ ] Cache headers configured

---

# Lighthouse

Target Scores

- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 95+

Document scores:

Performance: ______

Accessibility: ______

Best Practices: ______

SEO: ______

---

# SEO Performance

Verify:

- [ ] Sitemap loads
- [ ] robots.txt loads
- [ ] Metadata present
- [ ] Structured data valid
- [ ] Canonical URLs configured

---

# Mobile Performance

Verify on mobile:

- [ ] Fast page load
- [ ] Smooth scrolling
- [ ] Responsive images
- [ ] Navigation performs well
- [ ] No layout shifts

---

# Desktop Performance

Verify:

- [ ] Fast rendering
- [ ] Smooth animations
- [ ] No unnecessary CPU usage
- [ ] Stable layout

---

# Third-Party Services

Review impact from:

- [ ] Analytics
- [ ] Fonts
- [ ] Maps
- [ ] Videos
- [ ] Chat widgets
- [ ] Marketing tools

Remove or defer anything that negatively affects performance without providing measurable value.

---

# Performance Review

Confirm:

- [ ] Images optimized
- [ ] Fonts optimized
- [ ] CSS optimized
- [ ] JavaScript optimized
- [ ] Lighthouse reviewed
- [ ] Core Web Vitals acceptable
- [ ] Mobile performance acceptable
- [ ] Desktop performance acceptable

---

# Improvement Notes

Document opportunities for future optimization.

______________________________________________________

______________________________________________________

______________________________________________________

---

# Final Approval

☐ Meets JS Solutions Performance Standards

☐ Improvements Required Before Launch

---

Reviewer

_____________________________________

Date

_____________________________________

---

## Key Principle

Performance is not a feature that can be added later.

Fast websites create better user experiences, improve SEO, increase conversions, and strengthen the client's brand.

Every optimization contributes to long-term business success.

---

## Document Information

**Owner:** Josh Spradling

**Company:** JS Solutions

**Playbook:** Website Development

**Checklist:** Performance

**Status:** Living Document

**Version:** 1.0

**Last Updated:** August 2026