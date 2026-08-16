import { Check, Minus } from "lucide-react";

import { getAuditTierComparison } from "@/lib/website-audit/report-config";
import {
  FREE_AUDIT_PRODUCT_NAME,
  PROFESSIONAL_AUDIT_PRODUCT_NAME,
} from "@/lib/payments/product";

interface AuditTierComparisonProps {
  compact?: boolean;
}

export function AuditTierComparison({
  compact = false,
}: AuditTierComparisonProps) {
  const rows = getAuditTierComparison();

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(5rem,1fr)_minmax(5.5rem,1fr)] border-b border-border bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
        <span>What you get</span>
        <span className="text-center">Free</span>
        <span className="text-center">Professional</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.feature}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(5rem,1fr)_minmax(5.5rem,1fr)] items-center gap-2 px-4 py-3 sm:px-6"
          >
            <p className="text-sm font-medium text-brand">{row.feature}</p>
            <ComparisonValue value={row.free} compact={compact} />
            <ComparisonValue value={row.professional} highlight compact={compact} />
          </div>
        ))}
      </div>
      <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted sm:px-6">
        {FREE_AUDIT_PRODUCT_NAME} is included with every scan.{" "}
        {PROFESSIONAL_AUDIT_PRODUCT_NAME} unlocks the complete report.
      </p>
    </div>
  );
}

function ComparisonValue({
  value,
  highlight = false,
  compact = false,
}: {
  value: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  const included = value === "Included";
  const missing = value === "Not included";

  return (
    <div
      className={`flex items-center justify-center text-center text-xs sm:text-sm ${
        highlight ? "font-semibold text-brand" : "text-muted"
      }`}
    >
      {included ? (
        <Check aria-label="Included" className="size-4 text-emerald-600" />
      ) : missing ? (
        <Minus aria-label="Not included" className="size-4 text-slate-300" />
      ) : (
        <span className={compact ? "leading-4" : undefined}>{value}</span>
      )}
    </div>
  );
}
