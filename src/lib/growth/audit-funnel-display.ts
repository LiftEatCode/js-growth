export const FUNNEL_METRIC_STATUS = {
  AVAILABLE: "AVAILABLE",
  ZERO: "ZERO",
  UNKNOWN: "UNKNOWN",
  NOT_CAPTURED: "NOT_CAPTURED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
} as const;

export type FunnelMetricStatus =
  (typeof FUNNEL_METRIC_STATUS)[keyof typeof FUNNEL_METRIC_STATUS];

export type FunnelCountMetric = {
  status: FunnelMetricStatus;
  value: number | null;
};

export type FunnelRateMetric = {
  status: FunnelMetricStatus;
  value: number | null;
};

export function formatFunnelCount(metric: FunnelCountMetric): string {
  switch (metric.status) {
    case FUNNEL_METRIC_STATUS.AVAILABLE:
    case FUNNEL_METRIC_STATUS.ZERO:
      return new Intl.NumberFormat("en-US").format(metric.value ?? 0);
    case FUNNEL_METRIC_STATUS.NOT_CAPTURED:
      return "NOT CAPTURED";
    case FUNNEL_METRIC_STATUS.INSUFFICIENT_DATA:
      return "INSUFFICIENT DATA";
    case FUNNEL_METRIC_STATUS.UNKNOWN:
      return "UNKNOWN";
    default:
      return "UNKNOWN";
  }
}

export function formatFunnelRate(metric: FunnelRateMetric): string {
  switch (metric.status) {
    case FUNNEL_METRIC_STATUS.AVAILABLE:
      return `${metric.value}%`;
    case FUNNEL_METRIC_STATUS.ZERO:
      return "0%";
    case FUNNEL_METRIC_STATUS.INSUFFICIENT_DATA:
      return "INSUFFICIENT DATA";
    case FUNNEL_METRIC_STATUS.NOT_CAPTURED:
      return "NOT CAPTURED";
    case FUNNEL_METRIC_STATUS.UNKNOWN:
      return "UNKNOWN";
    default:
      return "UNKNOWN";
  }
}
