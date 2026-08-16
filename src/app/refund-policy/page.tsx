import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { RefundPolicyContent } from "@/content/legal/refund-policy-content";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund Policy for one-time Professional Website Growth Audit purchases on JS Growth.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      intro="This policy covers one-time Professional Website Growth Audit purchases. Custom consulting and implementation work may follow a separate agreement."
    >
      <RefundPolicyContent />
    </LegalDocument>
  );
}
