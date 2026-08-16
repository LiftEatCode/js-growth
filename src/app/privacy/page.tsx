import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { PrivacyPolicyContent } from "@/content/legal/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how JS Growth and JS Solutions collect, use, and share information for Website Growth Audits, contact inquiries, and Professional Audit purchases.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="This Privacy Policy explains what information JS Growth collects, how it is used, and the choices you have. It describes current Website Growth Audit, contact, payment, and analytics practices."
    >
      <PrivacyPolicyContent />
    </LegalDocument>
  );
}
