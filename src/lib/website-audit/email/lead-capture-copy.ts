export interface LeadCaptureBenefitCopy {
  title: string;
  description: string;
}

export interface AuditLeadCaptureCopy {
  eyebrow: string;
  headingPrefix: string;
  description: string;
  buttonLabel: string;
  pendingLabel: string;
  privacyNote: string;
  benefits: LeadCaptureBenefitCopy[];
}

const PROFESSIONAL_COPY: AuditLeadCaptureCopy = {
  eyebrow: "Professional Growth Report",
  headingPrefix: "Keep the full report for",
  description:
    "Get a professional PDF you can save, share internally, and use when planning the next round of website improvements.",
  buttonLabel: "Email My Professional Report",
  pendingLabel: "Preparing Report…",
  privacyNote:
    "Your information is used to deliver the requested report and follow up about your website strategy.",
  benefits: [
    {
      title: "Complete audit findings",
      description:
        "Keep the full website analysis and identified growth opportunities in one report.",
    },
    {
      title: "Strategy and roadmap",
      description:
        "Use the prioritized findings and improvement roadmap for planning and internal discussion.",
    },
    {
      title: "Delivered by email",
      description:
        "Receive the professional report directly in your inbox with a downloadable PDF copy.",
    },
  ],
};

const FREE_COPY: AuditLeadCaptureCopy = {
  eyebrow: "Free Website Growth Report",
  headingPrefix: "Save this report for",
  description:
    "We’ll email a confirmation and a saved link so you can return to this free report anytime. This is not the Professional PDF.",
  buttonLabel: "Email My Report",
  pendingLabel: "Sending…",
  privacyNote:
    "Your information is used to send this free report recap and follow up about your website strategy.",
  benefits: [
    {
      title: "Your free report recap",
      description:
        "Keep your Website Growth Score, top priorities, and quick wins in one place.",
    },
    {
      title: "Return anytime",
      description:
        "We’ll send a saved link so you can reopen this report later from your inbox.",
    },
    {
      title: "Unlock more when you are ready",
      description:
        "The Professional report adds full recommendations, a 30–90 day plan, and a downloadable PDF.",
    },
  ],
};

export function getAuditLeadCaptureCopy(
  canDownloadPdf: boolean,
): AuditLeadCaptureCopy {
  return canDownloadPdf ? PROFESSIONAL_COPY : FREE_COPY;
}
