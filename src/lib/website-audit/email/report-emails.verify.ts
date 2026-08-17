import { getAuditLeadCaptureCopy } from "./lead-capture-copy";
import {
  buildCustomerReportHtml,
  buildCustomerReportText,
} from "./report-emails";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const base = {
  firstName: "Alex",
  hostname: "example.com",
  overallScore: 72,
  opportunityScore: 40,
  criticalIssues: 1,
  quickWins: 2,
  highImpactFindings: 3,
};

const freeText = buildCustomerReportText({
  ...base,
  includesProfessionalPdf: false,
  reportUrl: "https://js-growth.com/report/abc",
});
const freeHtml = buildCustomerReportHtml({
  ...base,
  includesProfessionalPdf: false,
  reportUrl: "https://js-growth.com/report/abc",
});
const paidText = buildCustomerReportText({
  ...base,
  includesProfessionalPdf: true,
});
const paidHtml = buildCustomerReportHtml({
  ...base,
  includesProfessionalPdf: true,
});

assert(
  freeText.toLowerCase().includes("free website growth report"),
  "free text names the free report",
);
assert(
  freeHtml.toLowerCase().includes("not the professional pdf"),
  "free html does not imply a professional PDF was delivered",
);
assert(!/pdf is attached/i.test(freeText), "free text does not attach PDF language");
assert(!/pdf is attached/i.test(freeHtml), "free html does not attach PDF language");
assert(
  /does not include the professional pdf/i.test(freeText),
  "free text states it does not include the Professional PDF",
);
assert(freeText.includes("https://js-growth.com/report/abc"), "free text includes saved link");
assert(
  /unlock the professional/i.test(freeText),
  "free text still supports the Professional upgrade",
);

assert(/professional pdf report is attached/i.test(paidText), "paid text mentions attached PDF");
assert(/the pdf is attached/i.test(paidHtml), "paid html mentions attached PDF");
assert(
  /improvement roadmap/i.test(paidText),
  "paid text mentions the professional roadmap",
);

const freeCopy = getAuditLeadCaptureCopy(false);
const paidCopy = getAuditLeadCaptureCopy(true);

assert(
  !/professional growth report/i.test(freeCopy.eyebrow),
  "free capture is not labeled Professional Growth Report",
);
assert(
  /not the professional pdf/i.test(freeCopy.description),
  "free capture states this is not the Professional PDF",
);
assert(!/professional report/i.test(freeCopy.buttonLabel), "free capture button is not Professional");
assert(/professional pdf/i.test(paidCopy.description), "paid capture mentions professional PDF");
assert(/professional report/i.test(paidCopy.buttonLabel), "paid capture button is Professional");
assert(
  freeCopy.benefits.some((item) => /unlock more/i.test(item.title)),
  "free capture still points to the Professional upgrade",
);

console.log("report email and lead-capture copy verification passed");
process.exit(0);
