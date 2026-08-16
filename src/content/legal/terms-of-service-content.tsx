import Link from "next/link";

import {
  LegalList,
  LegalSection,
} from "@/components/legal/legal-document";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_PATH,
  POLICY_ROUTES,
} from "@/content/legal/policy-meta";

const contactHref = `mailto:${LEGAL_CONTACT_EMAIL}`;
const linkClassName =
  "font-medium text-brand underline underline-offset-2 hover:text-brand-blue";

export function TermsOfServiceContent() {
  return (
    <>
      <LegalSection id="agreement" title="Agreement to These Terms">
        <p>
          These Terms of Service (“Terms”) govern use of the JS Growth website
          at js-growth.com and related Website Growth Audit services operated
          by JS Solutions (“JS Solutions,” “JS Growth,” “we,” “us,” or “our”).
        </p>
        <p>
          By using the website, running a Website Growth Audit, or purchasing a
          Professional Website Growth Audit, you agree to these Terms. If you
          do not agree, please do not use the service.
        </p>
        <p>
          These Terms are written for website visitors, Free Audit users, and
          Professional Audit purchasers. Separately contracted consulting,
          website, SEO, or implementation work may be governed by its own
          proposal or agreement.
        </p>
      </LegalSection>

      <LegalSection id="services" title="The Services">
        <p>
          JS Growth currently provides a Free Website Growth Audit and a
          Professional Website Growth Audit. JS Solutions also offers related
          website, marketing, SEO, automation, and consulting services that can
          be discussed through the Contact page.
        </p>
        <p>
          The Website Growth Audit evaluates observable signals on a publicly
          accessible website URL that you submit, plus a limited number of
          same-site publicly linked pages included in a representative scan.
          It is an informational
          assessment intended to identify potential improvement opportunities.
          It is not a guarantee of search rankings, traffic, leads, conversions,
          or revenue.
        </p>
        <p>
          The current audit does not include customer accounts, recurring
          subscriptions, competitor scraping, recurring website monitoring,
          Google Business Profile integration, AI-generated audit
          interpretation, or rank tracking.
        </p>
      </LegalSection>

      <LegalSection id="no-guarantees" title="No Guaranteed Results">
        <p>
          Search rankings, website performance, and business outcomes depend on
          many factors outside JS Growth’s control, including search engines,
          third-party platforms, your industry, your website changes, and how
          recommendations are implemented.
        </p>
        <p>
          Audit findings and recommendations do not guarantee improved traffic,
          leads, revenue, conversions, or rankings. They are observations and
          suggested next steps based on publicly visible website information
          available at the time of the audit.
        </p>
      </LegalSection>

      <LegalSection
        id="submitted-urls"
        title="Submitted Websites"
      >
        <p>
          You may submit a publicly accessible website URL for analysis. By
          submitting a URL, you represent that you are using the audit for a
          lawful purpose and will not use the service to interfere with or
          abuse third-party systems.
        </p>
        <p>
          The audit accesses publicly available website information from the
          submitted URL and a limited number of same-site publicly linked
          pages. If you supply competitor websites for comparison, the audit
          may also retrieve a limited number of publicly accessible pages from
          those sites. You do not
          need to own every public site you evaluate, but you should only use
          the service for legitimate purposes and in a way that does not harm
          or disrupt the submitted website, supplied competitor websites, or JS
          Growth.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Attempt to bypass security, access controls, or internal administration areas",
            "Send malicious automated requests or otherwise overload or interfere with the service",
            "Use the service for unlawful purposes",
            "Attempt unauthorized access to systems, reports, or data that are not yours to use",
            "Resell, misrepresent, or present an audit report as an independent certification or as work produced by another firm",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="professional-audit"
        title="Professional Website Growth Audit Purchases"
      >
        <p>
          The Professional Website Growth Audit is currently a one-time
          purchase, not a subscription. Payment is processed through Stripe
          Checkout.
        </p>
        <p>
          Professional access unlocks the report features described at the time
          of purchase for the related report. Access is provided through the
          report link while the service remains available, subject to these
          Terms.
        </p>
        <p>
          JS Growth does not currently require a customer account. The
          Professional entitlement is associated with the purchased report. Keep
          the report link if you want to return to the Professional report.
        </p>
        <p>
          The price shown at checkout at the time of purchase is the applicable
          price. Displayed prices on the website may change and are not a
          standing offer for later purchases.
        </p>
        <p>
          Refunds for Professional Website Growth Audit purchases are described
          in the{" "}
          <Link href={POLICY_ROUTES.refund} className={linkClassName}>
            Refund Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" title="Intellectual Property">
        <p>
          JS Solutions owns the JS Growth website software, report system,
          design, branding, audit methodology, and original content we create.
        </p>
        <p>
          You retain rights to information you submit, including your contact
          details and your own website content. JS Growth does not claim
          ownership of a customer’s website merely because it was analyzed.
          Audit reports may contain observations derived from publicly
          available website content.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-Party Services">
        <p>
          The service relies on third-party infrastructure, including payment
          processing, hosting, database storage, email delivery, and (when
          configured) analytics. Availability may occasionally depend on those
          providers.
        </p>
        <p>
          That does not mean JS Growth disclaims all responsibility for the
          service. It means parts of delivery can be affected by providers we
          use to operate the website.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="Service Availability and Changes">
        <p>
          We may update features, improve the audit, or make other changes to
          the website. Temporary interruptions can occur because of
          maintenance, hosting issues, payment-provider issues, or events
          outside our control.
        </p>
        <p>
          We do not promise uninterrupted uptime. We also do not use service
          changes as a way to immediately cancel a completed Professional
          Audit purchase without a customer-facing reason such as abuse,
          legal requirements, or discontinuation of the service.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" title="Disclaimer">
        {/* ATTORNEY REVIEW: Disclaimer of warranties / informational nature of audit results. */}
        <p>
          The website and audit results are provided for informational business
          and marketing purposes. They are not legal, financial, tax,
          accounting, or investment advice.
        </p>
        <p>
          Recommendations are website, SEO, conversion, and related business
          observations based on publicly available information at the time of
          the audit. Except as required by law, the service is provided “as
          is,” without warranties of uninterrupted, error-free, or complete
          coverage of every possible website issue.
        </p>
      </LegalSection>

      <LegalSection
        id="limitation-of-liability"
        title="Limitation of Liability"
      >
        {/* ATTORNEY REVIEW: Limitation of liability for Professional Audit and website use. Do not treat this clause as a finalized risk allocation. */}
        <p>
          To the extent permitted by applicable law, JS Solutions’ total
          responsibility for claims arising out of a Professional Website
          Growth Audit purchase is limited to the amount you paid for that
          purchase. For other use of the website or Free Audit, JS Solutions’
          liability is limited to the greatest extent permitted by law.
        </p>
        <p>
          JS Solutions is not liable for lost profits, lost business, lost
          data, or other indirect or consequential damages, except where the
          law does not allow that limitation. This section does not limit
          liability that cannot legally be limited, such as liability for
          fraud or for injury caused by willful misconduct where the law
          requires that result.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing Law">
        {/* ATTORNEY REVIEW: Add venue, dispute-resolution, and any arbitration or injunctive-relief terms only after business/legal decision. V1 uses Texas governing law only. */}
        <p>
          These Terms are governed by the laws of the State of Texas, without
          regard to conflict-of-law rules that would apply another state’s
          law. Specific venue, forum, or dispute-resolution procedures are not
          set by these Terms and may be addressed in a later legal review if
          needed.
        </p>
      </LegalSection>

      <LegalSection id="privacy" title="Privacy">
        <p>
          How we handle information is described in the{" "}
          <Link href={POLICY_ROUTES.privacy} className={linkClassName}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>
          We may update these Terms from time to time. The “Last updated” date
          at the top of this page shows when the current version took effect.
          Continued use of the website after an update means you accept the
          updated Terms. We do not currently send individual email notice of
          every change.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions about these Terms can be sent through the{" "}
          <Link href={LEGAL_CONTACT_PATH} className={linkClassName}>
            Contact
          </Link>{" "}
          page or by emailing{" "}
          <a href={contactHref} className={linkClassName}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </>
  );
}
