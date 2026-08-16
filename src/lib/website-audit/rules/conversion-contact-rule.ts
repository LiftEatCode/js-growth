import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const conversionContactRule: AuditRule = {
  id: "conversion-contact",
  category: "cro",
  title: "Phone and email conversion paths",

  evaluate({ pageData }) {
    const conversion = pageData.conversion;

    if (!conversion) {
      return [];
    }

    const findings = [];

    if (
      conversion.phone.visiblePhonePresent &&
      conversion.phone.telLinkCount === 0
    ) {
      findings.push(
        createFinding({
          id: "phone-not-click-to-call",
          title: "Phone number is not click-to-call",
          description:
            "The page displays a phone number but does not provide a click-to-call link. Mobile visitors may have to manually copy or type the number instead of calling directly.",
          status: "warning",
          category: "cro",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Wrap the primary phone number in a tel: link, especially in the header, contact section, and mobile navigation.",
        }),
      );
    }

    if (
      conversion.email.visibleEmailPresent &&
      conversion.email.mailtoLinkCount === 0
    ) {
      findings.push(
        createFinding({
          id: "email-not-clickable",
          title: "Email address is not clickable",
          description:
            "An email address is visible, but no mailto link was detected. This is a usability issue rather than a requirement. Many businesses prefer phone calls or forms, so this is a low-priority improvement.",
          status: "warning",
          category: "cro",
          scoreImpact: 1,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 10,
          quickWin: true,
          recommendation:
            "If email is an intended contact method, make the address a mailto link. If the business prefers calls or a form, keep those paths more prominent instead.",
        }),
      );
    }

    return findings;
  },
};
