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

  const gridClassName =
    "grid grid-cols-[minmax(0,1.1fr)_minmax(3.25rem,0.75fr)_minmax(0,0.95fr)] items-center gap-x-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(5rem,1fr)_minmax(5.5rem,1fr)] sm:gap-2";

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
      <div
        className={`${gridClassName} border-b border-border bg-slate-50/80 px-3 py-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] text-muted sm:px-6 sm:text-xs sm:tracking-[0.12em]`}
      >
        <span className="min-w-0 break-words">What you get</span>
        <span className="text-center">Free</span>
        <span className="min-w-0 text-center break-words">Professional</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.feature}
            className={`${gridClassName} px-3 py-3 sm:px-6`}
          >
            <p className="min-w-0 text-sm font-medium leading-5 text-brand">
              {row.feature}
            </p>
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
      className={`flex min-w-0 items-center justify-center text-center text-xs sm:text-sm ${
        highlight ? "font-semibold text-brand" : "text-muted"
      }`}
    >
      {included ? (
        <Check aria-label="Included" className="size-4 shrink-0 text-emerald-600" />
      ) : missing ? (
        <Minus aria-label="Not included" className="size-4 shrink-0 text-slate-300" />
      ) : (
        <span className={`min-w-0 break-words ${compact ? "leading-4" : "leading-5"}`}>
          {value}
        </span>
      )}
    </div>
  );
}
