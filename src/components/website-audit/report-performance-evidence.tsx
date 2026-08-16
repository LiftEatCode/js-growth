import { StatBadge } from "@/components/website-audit/report-ui";
import type { AuditPerformanceData } from "@/lib/website-audit/types";

function formatKb(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function riskLabel(risk: AuditPerformanceData["optimizationRisk"]): string {
  if (risk === "high") {
    return "High optimization risk";
  }

  if (risk === "moderate") {
    return "Moderate optimization risk";
  }

  return "Low optimization risk";
}

function riskTone(
  risk: AuditPerformanceData["optimizationRisk"],
): "success" | "warning" | "danger" {
  if (risk === "high") {
    return "danger";
  }

  if (risk === "moderate") {
    return "warning";
  }

  return "success";
}

interface ReportPerformanceEvidenceProps {
  performance: AuditPerformanceData;
}

export function ReportPerformanceEvidence({
  performance,
}: ReportPerformanceEvidenceProps) {
  const duration =
    performance.documentFetchDurationMs !== null
      ? `${Math.round(performance.documentFetchDurationMs)} ms`
      : "Not recorded";

  const compression =
    performance.compressed === true
      ? performance.contentEncoding ?? "Yes"
      : performance.compressed === false
        ? "Not advertised"
        : "Not observed";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Static performance intelligence
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          These observations come from the HTML document and its resource
          references. They are not Lighthouse, PageSpeed, or Core Web Vitals
          measurements.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatBadge
            label={riskLabel(performance.optimizationRisk)}
            tone={riskTone(performance.optimizationRisk)}
          />
          {performance.truncated ? (
            <StatBadge
              label="Resource scan capped for safety"
              tone="warning"
            />
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-brand">
          Referenced resources
        </h3>
        <p className="mt-1 text-sm text-muted">
          Counts of resources linked from the HTML, not a complete browser
          network waterfall.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatBadge label={`Images: ${performance.images.total}`} />
          <StatBadge label={`Scripts: ${performance.scripts.total}`} />
          <StatBadge label={`Stylesheets: ${performance.stylesheets.total}`} />
          <StatBadge label={`Iframes: ${performance.iframes.total}`} />
          <StatBadge
            label={`External origins: ${performance.origins.uniqueExternalOriginCount}`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-heading text-base font-semibold text-brand">
            Script loading
          </h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
            <li>
              Blocking candidates in head:{" "}
              {performance.scripts.blockingHeadCandidates}
            </li>
            <li>Deferred: {performance.scripts.defer}</li>
            <li>Async: {performance.scripts.async}</li>
            <li>Module: {performance.scripts.module}</li>
            <li>
              Duplicate external sources:{" "}
              {performance.scripts.duplicateExternalSources}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-base font-semibold text-brand">
            Images
          </h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
            <li>
              Lazy loading: {performance.images.lazy} / {performance.images.total}
            </li>
            <li>
              Missing explicit dimensions: {performance.images.missingDimensions}
            </li>
            <li>Modern raster formats: {performance.images.modernRaster}</li>
            <li>SVG images: {performance.images.svg}</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-heading text-base font-semibold text-brand">
            Document signals
          </h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
            <li>HTML size: {formatKb(performance.htmlBytes)}</li>
            <li>Compression: {compression}</li>
            <li>Document fetch duration: {duration}</li>
          </ul>
          <p className="mt-2 text-xs leading-5 text-muted">
            Document fetch duration is one HTML response observation, not page
            load time or Core Web Vitals.
          </p>
        </div>

        <div>
          <h3 className="font-heading text-base font-semibold text-brand">
            External origins
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            {performance.origins.uniqueExternalOriginCount === 0
              ? "No external origins were referenced."
              : `Examples: ${performance.origins.uniqueExternalOrigins.join(", ")}`}
          </p>
          {performance.scripts.thirdPartyScriptOriginCount > 0 ? (
            <p className="mt-2 text-sm leading-6 text-muted">
              External script origins:{" "}
              {performance.scripts.thirdPartyScriptOrigins.join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
