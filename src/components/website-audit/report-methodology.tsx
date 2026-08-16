import { InfoPanel, ReportSection } from "@/components/website-audit/report-ui";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";

interface ReportMethodologyProps {
  view: GrowthReportViewModel;
}

export function ReportMethodology({ view }: ReportMethodologyProps) {
  if (!view.capabilities.showMethodology) {
    return null;
  }

  return (
    <ReportSection
      eyebrow="Methodology"
      title="How this audit works."
      description="This audit evaluates observable technical, search, content, conversion, local, and performance signals found during the website scan."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel
          title="What the score means"
          description="Your Website Growth Score summarizes the website signals evaluated in this audit. Higher-impact problems affect the score more. It is a prioritization tool, not a Google ranking score, and it does not guarantee traffic, leads, or revenue."
        />
        <InfoPanel
          title="Limits of this scan"
          description="The audit scans a prioritized sample of important pages and may not include every URL on the website. It does not replace analytics, crawl an entire site, or include Google Business Profile and advertising data. Performance findings come from the HTML document and resource references, not from Lighthouse or Core Web Vitals (LCP, CLS, INP). Some recommendations still need business context before you implement them."
        />
      </div>
    </ReportSection>
  );
}
