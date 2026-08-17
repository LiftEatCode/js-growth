# Audit scoring notes

Deterministic scoring and content-depth behavior used by the Website Growth Audit. These notes document launch-hardening choices; they do not change product scope.

## Empty / not-applicable categories

A scoring category with **zero applicable findings** is **not scored**.

- It is **not** treated as `0 / max` (that looked like a failed category — e.g. Accessibility `0/10` when the page had no `<img>` elements).
- It is **not** awarded a perfect score (that would invent a pass with no evidence).
- Stored scores use `applicable: false` and `maxScore: 0`.
- The overall Website Growth Score uses only applicable categories in both numerator and denominator.

Customer-facing HTML, PDF, and Professional JSON omit not-applicable categories instead of showing a failing `0%`.

## Thin-content confidence

`thin-content-strong` (`< 100` extracted main-content words, high priority) still applies to genuinely small static pages.

When extraction is **unreliable**, the high-severity claim is withheld:

- HTML payload ≥ 80,000 bytes
- script count ≥ 15
- inline script bytes ≥ 40,000
- body-visible words exceed extracted main-content words by ≥ 150

Those signals are common on JS-heavy / builder HTML where `mainContentWordCount` undercounts visible copy. Word-count thresholds themselves are unchanged.
