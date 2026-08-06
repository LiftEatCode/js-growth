import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const contactSignalsRule: AuditRule = {
    id: "contact-signals",
    category: "local",
    title: "Contact signals",
  
    evaluate({ pageData }) {
      const findings = [];
  
      if (pageData.hasPhoneNumber) {
        findings.push(
          createFinding({
            id: "phone-present",
            title: "Phone number is visible",
            description:
              "A phone number or telephone link was detected.",
            status: "pass",
            category: "local",
            scoreImpact: 4,
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "phone-missing",
            title: "Phone number was not detected",
            description:
              "The page does not appear to display a phone number.",
            status: "fail",
            category: "local",
            scoreImpact: 4,
            recommendation:
              "Display a clear business phone number, especially in the header, footer, or primary call to action.",
          }),
        );
      }
  
      if (pageData.hasEmailAddress) {
        findings.push(
          createFinding({
            id: "email-present",
            title: "Email contact information is present",
            description:
              "An email address or email link was detected.",
            status: "pass",
            category: "local",
            scoreImpact: 2,
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "email-missing",
            title: "Email address was not detected",
            description:
              "The page does not appear to display an email address.",
            status: "warning",
            category: "local",
            scoreImpact: 2,
            recommendation:
              "Consider including an email address or a clear contact-form path where appropriate.",
          }),
        );
      }
  
      return findings;
    },
  };