import Link from "next/link";
import {
  type GrowthReportViewModel,
} from "@/lib/website-audit/report-view";

interface ReportNavProps {
  view: GrowthReportViewModel;
}

export function ReportNav({ view }: ReportNavProps) {
  const items = [
    { href: "#report-overview", label: "Overview" },
    { href: "#report-priorities", label: "Priorities" },
    view.capabilities.showQuickWins
      ? { href: "#report-quick-wins", label: "Quick Wins" }
      : null,
    view.capabilities.showSiteOverview && view.report.siteData
      ? { href: "#report-site-overview", label: "Site Overview" }
      : null,
    view.report.competitiveData &&
      (view.capabilities.showCompetitiveIntelligence ||
        view.report.competitiveData.analyzedCount > 0)
      ? { href: "#report-competitive", label: "Competitive" }
      : null,
    view.capabilities.showActionPlan
      ? { href: "#report-action-plan", label: "Action Plan" }
      : null,
    ...view.scorecard.map((item) => ({
      href: `#report-category-${item.category}`,
      label: item.shortLabel,
    })),
    view.capabilities.showFullFindings
      ? { href: "#audit-findings", label: "All Findings" }
      : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  return (
    <nav
      aria-label="Report sections"
      className="print:hidden sticky top-0 z-20 -mx-4 mb-8 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5"
    >
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand-blue/30 hover:text-brand-blue"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
