/**
 * Deterministic median. Returns null for an empty list.
 * Even-length lists use the mean of the two central values.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const midValue = sorted[middle];

  if (midValue === undefined) {
    return null;
  }

  if (sorted.length % 2 === 1) {
    return midValue;
  }

  const lower = sorted[middle - 1];

  if (lower === undefined) {
    return midValue;
  }

  return (lower + midValue) / 2;
}

export function roundMetric(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
