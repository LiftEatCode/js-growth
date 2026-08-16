import Link from "next/link";

import {
  LegalExternalLink,
  LegalList,
  LegalSection,
} from "@/components/legal/legal-document";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_PATH,
  POLICY_ROUTES,
  THIRD_PARTY_POLICIES,
} from "@/content/legal/policy-meta";

const contactHref = `mailto:${LEGAL_CONTACT_EMAIL}`;

export function PrivacyPolicyContent() {
  return (
    <>
      <LegalSection id="who-we-are" title="Who We Are">
        <p>
          This Privacy Policy describes how JS Solutions (“JS Solutions,” “JS
          Growth,” “we,” “us,” or “our”) handles information in connection with
          the JS Growth website at js-growth.com and related Website Growth
          Audit services.
        </p>
        <p>
          JS Solutions is based in Texas. This policy is an operational
          description of current practices. It is not a claim that JS Solutions
          is certified under, or fully subject to, every privacy law that may
          exist in a given jurisdiction.
        </p>
      </LegalSection>

      <LegalSection
        id="information-we-collect"
        title="Information We Collect"
      >
        <p>
          We collect information you provide, information created when you use
          the Website Growth Audit, payment-related records needed to process a
          Professional Audit purchase, and limited technical or usage
          information collected by the website and its service providers.
        </p>
        <p>Depending on how you use the site, this may include:</p>
        <LegalList
          items={[
            "Name and contact details, such as email address and phone number if you submit them",
            "Company or business name",
            "Website URL submitted for a Website Growth Audit",
            "Messages, project details, requested service, and budget information submitted through the contact form",
            "Audit and report information created from the submitted website",
            "Payment-related records associated with a Professional Website Growth Audit purchase",
            "Technical information processed as the website is used, such as browser or device characteristics, pages viewed, and similar usage data when analytics is configured",
          ]}
        />
        <p>
          We do not collect or store your complete payment card number. Card
          payments for the Professional Website Growth Audit are handled by
          Stripe Checkout.
        </p>
      </LegalSection>

      <LegalSection
        id="website-growth-audit"
        title="Website Growth Audit Information"
      >
        <p>
          When you submit a website URL for a Free or Professional Website
          Growth Audit, the system retrieves publicly available website content
          over the internet. It analyzes observable technical, content, and
          business signals on that page, such as titles, headings, links,
          publicly visible contact or conversion elements, and similar publicly
          exposed information.
        </p>
        <p>
          The audit is limited to information that is publicly accessible from
          the submitted URL. JS Growth does not log into private databases,
          private admin dashboards, password-protected accounts, or
          authenticated areas of a third-party website as part of the audit.
        </p>
        <p>
          The resulting report may be stored so we can provide the requested
          audit, display the report, process a Professional Audit purchase
          associated with that report, and operate or improve the service.
          Contact information you submit in connection with a report may be
          associated with that report.
        </p>
        <p>
          Reports are accessed through a report link. JS Growth does not
          currently require a customer account or login to view a report.
        </p>
      </LegalSection>

      <LegalSection id="lead-and-contact" title="Lead and Contact Information">
        <p>
          If you complete the audit lead form, we may store your first name,
          last name, email address, phone number (if provided), company (if
          provided), and the related website or report. That information may be
          used to deliver the requested report materials, follow up about the
          audit, and communicate about related JS Solutions services you
          requested or asked about.
        </p>
        <p>
          If you submit the contact form, we process the information you enter
          (such as name, business name, email, phone, website, service
          interest, budget information, and message) to respond to your
          inquiry. Contact-form submissions are delivered by email and are not
          stored in a separate customer-account database.
        </p>
        <p>
          Completing these forms does not enroll you in a separate newsletter
          or marketing list. We use the information to respond to the request
          you made and to operate the related service.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="Payments and Stripe">
        <p>
          If you purchase a Professional Website Growth Audit, payment
          transactions are processed through Stripe Checkout. JS Growth does
          not directly receive or store your complete payment card number.
        </p>
        <p>
          In connection with a purchase, we may store payment-related records
          such as a Stripe Checkout Session ID, PaymentIntent ID, Stripe
          Customer ID if Stripe provides one, the email address associated with
          checkout, amount, currency, and payment status. These records are
          used to confirm payment, unlock Professional report access for the
          related report, prevent duplicate charges, provide support, and keep
          business records.
        </p>
        <p>
          Stripe may process payment information according to its own privacy
          practices. See{" "}
          <LegalExternalLink href={THIRD_PARTY_POLICIES.stripe}>
            Stripe’s Privacy Policy
          </LegalExternalLink>
          .
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="How We Use Information">
        <p>We use information for reasonably specific purposes, including to:</p>
        <LegalList
          items={[
            "Provide Free and Professional Website Growth Audits",
            "Create, store, and display audit reports",
            "Process Professional Audit purchases and unlock paid report features",
            "Respond to inquiries and provide customer support",
            "Communicate about requested services, including report delivery by email when that feature applies",
            "Maintain security and prevent fraud, abuse, or duplicate charges",
            "Operate, troubleshoot, and improve the website and audit product",
            "Analyze website usage when analytics is configured",
            "Comply with legal, accounting, and record-keeping obligations",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="cookies-analytics"
        title="Cookies, Analytics, and Similar Technologies"
      >
        <p>
          The website may use cookies or similar technologies that are needed
          to operate the service. For example, JS Growth uses a session cookie
          for internal staff access to the reports administration area. That
          cookie is not used as a customer login.
        </p>
        <p>
          We may use Google Analytics when it is configured for the website.
          Google Analytics may collect usage information such as pages viewed,
          browser or device characteristics, approximate geographic
          information, referral or source information, and interaction events
          (including events related to completing an audit or starting
          checkout).
        </p>
        <p>
          Google may process this information according to its own policies.
          See{" "}
          <LegalExternalLink href={THIRD_PARTY_POLICIES.google}>
            Google’s Privacy Policy
          </LegalExternalLink>
          .
        </p>
        <p>
          Usage data collected through analytics is not treated as anonymous
          solely because a name is not attached to every page view. JS Growth
          does not currently present a cookie-consent banner. Additional
          consent tooling may be evaluated if the business later targets
          jurisdictions that require opt-in analytics consent.
        </p>
      </LegalSection>

      <LegalSection id="email" title="Email Delivery">
        <p>
          We use an email service provider (currently Resend) to send
          transactional and service messages. This may include contact-form
          notifications, a confirmation of a contact-form submission, internal
          lead notifications, and — when a professionally entitled report is
          involved — delivery of requested report materials. The email provider
          processes contact and message data as needed to deliver those
          communications.
        </p>
        <p>
          JS Growth does not currently operate a separate newsletter signup. We
          do not use these forms to add people to an unrelated marketing list.
        </p>
        <p>
          See{" "}
          <LegalExternalLink href={THIRD_PARTY_POLICIES.resend}>
            Resend’s Privacy Policy
          </LegalExternalLink>
          .
        </p>
      </LegalSection>

      <LegalSection
        id="service-providers"
        title="Hosting, Storage, and Service Providers"
      >
        <p>
          Trusted service providers help us operate the website. This currently
          includes providers used for hosting and infrastructure, database
          storage, payment processing, analytics (when configured), and email
          delivery.
        </p>
        <p>
          Audit reports, lead records, and purchase records are stored in a
          PostgreSQL database hosted with Neon. Neon may process that
          information according to its own privacy practices.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="How Information Is Shared">
        <p>
          JS Growth does not sell personal information for monetary
          consideration.
        </p>
        <p>
          We may share information with service providers that perform services
          on our behalf, such as payment processing, hosting and
          infrastructure, database storage, analytics, and email delivery.
          Those providers are given access only as needed to perform their
          services.
        </p>
        <p>
          We may also disclose information if we believe it is reasonably
          necessary to comply with law, legal process, or governmental
          requests; to protect the rights, safety, or security of JS Solutions,
          our users, or the public; or to detect, prevent, or address fraud,
          security, or technical issues.
        </p>
      </LegalSection>

      <LegalSection id="privacy-choices" title="Your Privacy Choices">
        <p>
          You may request access to, correction of, or deletion of personal
          information we hold about you, where that request is reasonably
          applicable to our records and is not limited by legal, accounting,
          security, or similar obligations.
        </p>
        <p>
          To make a request, use the{" "}
          <Link
            href={LEGAL_CONTACT_PATH}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            Contact
          </Link>{" "}
          page or email{" "}
          <a
            href={contactHref}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Please include enough information for us to identify the relevant
          report or inquiry. Do not send payment card numbers, CVC codes, or
          other full payment credentials.
        </p>
        <p>
          We may need to confirm the request before completing it. Some records
          — including certain payment or audit records — may be retained when
          reasonably necessary for accounting, fraud prevention, dispute
          resolution, or legal compliance.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="How Long We Keep Information">
        <p>
          We retain information for as long as reasonably necessary to provide
          the service, maintain business and security records, resolve
          disputes, and comply with legal obligations. Purchase and report
          records may be kept longer when needed for accounting,
          fraud-prevention, support, or legal reasons.
        </p>
        <p>
          JS Growth does not currently promise automatic deletion of reports or
          purchase records after a set number of days.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <p>
          We use reasonable administrative and technical measures designed to
          protect information. No method of transmission or storage is
          completely secure, and we cannot guarantee that information will
          never be accessed, disclosed, altered, or destroyed.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          JS Growth is a business service. It is not intended for children
          under 13, and JS Growth does not knowingly seek personal information
          from children under 13.
        </p>
      </LegalSection>

      <LegalSection id="third-party-links" title="Third-Party Websites">
        <p>
          The website, audit reports, and related pages may contain links to
          third-party websites. JS Growth is not responsible for the privacy
          practices of those external websites. This section does not limit our
          responsibility for the service providers we use to operate JS Growth.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The “Last
          updated” date at the top of this page shows when the current version
          took effect. The updated policy will apply going forward after it is
          posted. We do not currently send individual email notice of every
          policy change.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="How to Contact Us">
        <p>
          For privacy questions or requests, contact JS Solutions through the{" "}
          <Link
            href={LEGAL_CONTACT_PATH}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            Contact
          </Link>{" "}
          page or by emailing{" "}
          <a
            href={contactHref}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>
          Related documents:{" "}
          <Link
            href={POLICY_ROUTES.terms}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href={POLICY_ROUTES.refund}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-blue"
          >
            Refund Policy
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
