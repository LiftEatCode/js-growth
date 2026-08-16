import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  LEAD_FORM_FRICTION_FIELD_THRESHOLD,
  isLikelyLeadForm,
} from "../page-conversion";

export const leadFormRule: AuditRule = {
  id: "lead-form",
  category: "cro",
  title: "Lead forms",

  evaluate({ pageData }) {
    const conversion = pageData.conversion;

    if (!conversion || conversion.forms.likelyLeadFormCount === 0) {
      return [];
    }

    const findings = [];
    const leadForms = conversion.forms.details.filter((form) =>
      isLikelyLeadForm(form.purposeGuess),
    );
    const missingSubmit = leadForms.some((form) => !form.hasSubmitControl);
    const longLeadForm = leadForms.some(
      (form) =>
        form.fieldCount >= LEAD_FORM_FRICTION_FIELD_THRESHOLD &&
        form.purposeGuess === "lead",
    );

    if (missingSubmit) {
      findings.push(
        createFinding({
          id: "lead-form-missing-submit",
          title: "A lead form may be missing a conventional submit control",
          description:
            "A likely inquiry form was detected, but no conventional submit control was found. JavaScript-driven forms can still work without a standard submit button, so this is an implementation clue rather than proof the form cannot be submitted.",
          status: "warning",
          category: "cro",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 30,
          quickWin: false,
          recommendation:
            "Give the form a clear submit control with wording such as Request a Quote or Send Message, unless a custom widget already provides an obvious way to finish the inquiry.",
        }),
      );
    }

    if (longLeadForm) {
      findings.push(
        createFinding({
          id: "lead-form-friction",
          title: "A lead form asks for a lot of information up front",
          description: `A likely inquiry form includes ${conversion.forms.maxLeadFormFields} fields. This lead form asks for a relatively large amount of information before a visitor can submit it. Depending on the business and lead qualification needs, reducing unnecessary fields may make the first contact easier. Longer forms are not automatically a problem.`,
          status: "warning",
          category: "cro",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: false,
          recommendation:
            "Keep required first-contact fields to what is needed to respond, such as name, phone or email, and a short message. Add extra qualification questions only when they clearly improve follow-up.",
        }),
      );
    }

    return findings;
  },
};
