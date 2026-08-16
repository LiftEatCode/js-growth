import Link from "next/link";

import { LegalList, LegalSection } from "@/components/legal/legal-document";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_PATH,
  POLICY_ROUTES,
} from "@/content/legal/policy-meta";

const contactHref = `mailto:${LEGAL_CONTACT_EMAIL}`;
const linkClassName =
  "font-medium text-brand underline underline-offset-2 hover:text-brand-blue";

export function RefundPolicyContent() {
  return (
    <>
      <LegalSection id="scope" title="What This Policy Covers">
        <p>
          This Refund Policy applies to one-time purchases of the Professional
          Website Growth Audit on js-growth.com.
        </p>
        <p>
          It does not automatically apply to separately contracted consulting,
          website development, SEO, marketing, automation, or implementation
          services. Those engagements are governed by their own proposals or
          agreements.
        </p>
      </LegalSection>

      <LegalSection id="digital-product" title="Digital Product">
        <p>
          The Professional Website Growth Audit is a digital product. After a
          successful purchase, Professional report features are generally made
          available immediately through the related report link.
        </p>
        <p>
          Because access is typically available right after payment,
          Professional Audit purchases are generally non-refundable once the
          Professional report has been successfully unlocked.
        </p>
      </LegalSection>

      <LegalSection
        id="exceptions"
        title="When JS Growth May Provide a Resolution"
      >
        <p>
          JS Growth may provide an appropriate resolution when one of the
          following is verified:
        </p>
        <LegalList
          items={[
            "A technical failure prevented you from receiving or accessing the purchased Professional report",
            "You were accidentally charged more than once for the same report",
            "Another verified payment or delivery error occurred",
          ]}
        />
        <p>
          JS Growth retains discretion to provide a refund, restore access, or
          offer another resolution when that is appropriate. Refunds are not
          automatic, and this policy does not create a self-serve refund
          process.
        </p>
      </LegalSection>

      <LegalSection id="failed-delivery" title="If Payment Succeeds but Access Fails">
        <p>
          If payment succeeds but the Professional report does not unlock,
          contact JS Solutions. The first priority is restoring access to the
          report you already purchased.
        </p>
        <p>
          If access cannot reasonably be restored, JS Growth will work toward
          an appropriate resolution. A refund is not promised if the issue can
          be corrected by unlocking or restoring the report.
        </p>
      </LegalSection>

      <LegalSection id="duplicate-charges" title="Duplicate Charges">
        <p>
          The Professional Audit checkout is designed to avoid charging twice
          for a report that is already professionally unlocked. If a verified
          accidental duplicate charge still occurs, JS Growth will investigate
          and resolve it appropriately.
        </p>
        <p>
          We do not promise a fixed processing timeframe, because review
          depends on identifying the transactions involved.
        </p>
      </LegalSection>

      <LegalSection id="how-to-request" title="How to Request Help">
        <p>
          Raise refund or payment issues through the{" "}
          <Link href={LEGAL_CONTACT_PATH} className={linkClassName}>
            Contact
          </Link>{" "}
          page or by emailing{" "}
          <a href={contactHref} className={linkClassName}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>Please include:</p>
        <LegalList
          items={[
            "Your name",
            "The email address used at checkout",
            "The report URL or enough information to identify the report",
          ]}
        />
        <p>
          Do not send credit card numbers, CVC codes, or other full payment
          credentials. Those details are handled by Stripe, not by JS Growth.
        </p>
      </LegalSection>

      <LegalSection id="related" title="Related Policies">
        <p>
          Purchases are also subject to the{" "}
          <Link href={POLICY_ROUTES.terms} className={linkClassName}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={POLICY_ROUTES.privacy} className={linkClassName}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
