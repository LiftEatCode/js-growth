import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { TermsOfServiceContent } from "@/content/legal/terms-of-service-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for the JS Growth website, Free Website Growth Audit, and one-time Professional Website Growth Audit purchases.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro="These Terms explain how the JS Growth website and Website Growth Audit work, including Free and Professional audits. They are written for website visitors and small-business customers."
    >
      <TermsOfServiceContent />
    </LegalDocument>
  );
}
