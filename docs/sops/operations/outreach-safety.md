# SOP — Outreach Safety

**Status:** Current  
**Audience:** Anyone sending or approving prospecting outreach

---

## Non-negotiables

Operators must **never**:

- Send without human review and approval
- Bulk-send automatically
- Auto-submit contact forms
- Bypass CAPTCHA or anti-bot controls
- Email suppressed addresses
- Ignore bounce / complaint signals
- Contact converted leads / existing customers inappropriately
- Overstate audit or competitive results in copy

---

## Required gates

1. Credible prospect + audit evidence
2. Valid contact channel (email or form)
3. Edited draft
4. Explicit approve
5. Suppression check
6. Daily send budget remaining (`MAX_OUTREACH_EMAILS_PER_DAY = 10`)

---

## Suppression & list hygiene

- Honor `SuppressionEntry` always
- Opt-outs → suppress immediately
- Hard bounces → suppress / stop
- Complaints → suppress; escalate if volume rises
- Existing leads/customers → do not treat as cold outreach targets

---

## Resend / delivery

- Watch delivery events (`OutreachDeliveryEvent`)
- Failed / bounced / complained → update outcome and stop retries that would re-harm reputation
- Webhook processing is server-side; do not “fix” by replaying forged events

---

## Contact forms

- Discovery may find forms; **submission is manual**
- Use approved copy; respect form fields and any CAPTCHA the site presents
- Record that submission was manual in outcomes/notes as appropriate

---

## Checklist before every send

- [ ] Not suppressed
- [ ] Not existing customer/lead conflict
- [ ] Draft accurate vs audit evidence
- [ ] Approved by a human
- [ ] Under daily cap
- [ ] Channel = intended (email vs form)

## Related

- [prospecting-campaign.md](prospecting-campaign.md)
- [../../development/security-privacy.md](../../development/security-privacy.md)
- [../../development/cost-controls.md](../../development/cost-controls.md)
