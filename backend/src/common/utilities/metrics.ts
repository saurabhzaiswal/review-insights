export type MetricChange = {
  absoluteChange: number | null;
  percentageChange: number | null;
  direction: 'up' | 'down' | 'stable' | null;
};

export function rounded(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function percentage(count: number, total: number): number | null {
  return total > 0 ? rounded((count / total) * 100, 1) : null;
}

export function metricChange(current: number | null, previous: number | null): MetricChange {
  if (current === null || previous === null) {
    return { absoluteChange: null, percentageChange: null, direction: null };
  }

  const absoluteChange = rounded(current - previous);
  return {
    absoluteChange,
    percentageChange: previous === 0 ? null : rounded((absoluteChange / previous) * 100, 1),
    direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'stable',
  };
}
