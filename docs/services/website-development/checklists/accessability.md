# Website Development Accessibility Checklist

> **Part of the JS Solutions Website Development Playbook**

---

# Purpose

This checklist verifies that every JS Solutions website is accessible, usable, and inclusive.

Accessibility improves the experience for all users, including those using assistive technologies, keyboards, screen readers, or alternative input methods.

Good accessibility also improves SEO, usability, maintainability, and overall website quality.

Accessibility should be considered throughout the project—not just before launch.

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

# Document Structure

Verify:

- [ ] Only one H1 on the page
- [ ] Heading hierarchy is logical (H1 → H2 → H3...)
- [ ] Headings describe page sections
- [ ] Lists use proper HTML list elements
- [ ] Tables used only for tabular data

---

# Keyboard Navigation

Verify:

- [ ] Entire site can be navigated using only a keyboard
- [ ] Tab order is logical
- [ ] Focus never becomes trapped
- [ ] Skip navigation link available (when appropriate)
- [ ] Interactive elements are keyboard accessible

---

# Focus States

Verify:

- [ ] Visible focus indicators
- [ ] Buttons show focus
- [ ] Links show focus
- [ ] Form fields show focus
- [ ] Custom controls show focus

Users should always know where keyboard focus is located.

---

# Color & Contrast

Verify:

- [ ] Text meets WCAG contrast guidelines
- [ ] Buttons remain readable
- [ ] Links are distinguishable
- [ ] Color is not the only way information is conveyed
- [ ] Error messages include icons or text, not just color

---

# Typography

Verify:

- [ ] Font sizes are readable
- [ ] Line spacing is comfortable
- [ ] Paragraphs are easy to scan
- [ ] Text scales correctly when zoomed
- [ ] No clipped text at 200% zoom

---

# Images

Verify:

- [ ] Informative images include meaningful alt text
- [ ] Decorative images use empty alt attributes
- [ ] Logos include descriptive alt text
- [ ] Image-only buttons include accessible labels

---

# Links

Verify:

- [ ] Link text is descriptive
- [ ] No "Click Here" links without context
- [ ] External links behave as expected
- [ ] Link purpose is understandable

---

# Buttons

Verify:

- [ ] Buttons have descriptive labels
- [ ] Icon-only buttons include accessible names
- [ ] Buttons are large enough for touch devices
- [ ] Disabled buttons are visually identifiable

---

# Forms

Verify:

- [ ] Every field has a label
- [ ] Required fields are identified
- [ ] Error messages are descriptive
- [ ] Validation is accessible
- [ ] Success messages are announced clearly
- [ ] Placeholder text is not used as the only label

---

# Multimedia

If applicable:

- [ ] Videos include captions
- [ ] Audio has transcripts
- [ ] Autoplay is avoided
- [ ] Media controls are accessible

---

# Responsive Accessibility

Verify:

- [ ] Mobile navigation is keyboard accessible
- [ ] Touch targets are appropriately sized
- [ ] Zoom does not break layouts
- [ ] Orientation changes do not hide content

---

# Semantic HTML

Verify:

- [ ] Proper HTML landmarks used
- [ ] Navigation uses `<nav>`
- [ ] Main content uses `<main>`
- [ ] Headers use `<header>`
- [ ] Footers use `<footer>`
- [ ] Buttons use `<button>`
- [ ] Links use `<a>`

Avoid using generic `<div>` elements where semantic elements are more appropriate.

---

# ARIA

Verify:

- [ ] ARIA used only when necessary
- [ ] Accessible names are present
- [ ] ARIA roles are valid
- [ ] No redundant ARIA attributes

Prefer semantic HTML before adding ARIA.

---

# Accessibility Testing

Review using:

- [ ] Keyboard only
- [ ] Lighthouse Accessibility Audit
- [ ] WAVE Accessibility Tool
- [ ] Screen reader spot check (when practical)

---

# Accessibility Review

Confirm:

- [ ] Heading hierarchy correct
- [ ] Keyboard navigation verified
- [ ] Focus indicators visible
- [ ] Forms accessible
- [ ] Images labeled
- [ ] Links descriptive
- [ ] Buttons accessible
- [ ] Color contrast acceptable
- [ ] Semantic HTML used
- [ ] ARIA reviewed

---

# Improvement Notes

Document any accessibility improvements or known limitations.

______________________________________________________

______________________________________________________

______________________________________________________

---

# Final Approval

☐ Meets JS Solutions Accessibility Standards

☐ Accessibility Improvements Required

---

Reviewer

_____________________________________

Date

_____________________________________

---

## Key Principle

Accessibility is not a feature.

It is a fundamental aspect of building high-quality websites.

Designing for accessibility benefits every visitor by making websites easier to navigate, understand, and use.

Building inclusive experiences reflects the professionalism and values of JS Solutions.

---

## Document Information

**Owner:** Josh Spradling

**Company:** JS Solutions

**Playbook:** Website Development

**Checklist:** Accessibility

**Status:** Living Document

**Version:** 1.0

**Last Updated:** August 2026