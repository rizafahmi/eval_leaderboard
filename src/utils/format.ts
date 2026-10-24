const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const durationFormatter =
  typeof Intl !== 'undefined' && typeof Intl.DurationFormat !== 'undefined'
    ? new Intl.DurationFormat('en', { style: 'narrow' })
    : null;

export function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return '0m';
  }

  let balanced: { hours: number; minutes: number };
  const globalTemporal = (globalThis as { Temporal?: { Duration?: { from: (d: { minutes: number }) => { round: (opts: { largestUnit: string }) => { hours: number; minutes: number } } } } }).Temporal;

  if (globalTemporal?.Duration) {
    const d = globalTemporal.Duration.from({ minutes }).round({ largestUnit: 'hours' });
    balanced = { hours: d.hours, minutes: d.minutes };
  } else {
    balanced = {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    };
  }

  if (durationFormatter) {
    return durationFormatter.format(balanced);
  }

  if (balanced.hours === 0) {
    return `${balanced.minutes}m`;
  }
  return balanced.minutes > 0
    ? `${balanced.hours}h ${balanced.minutes}m`
    : `${balanced.hours}h`;
}

export function formatCost(costUsd: number): string {
  return usdFormatter.format(costUsd);
}

export function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) {
    return ts;
  }
  return dateTimeFormatter.format(date);
}

export function parseTokenString(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '').trim().toLowerCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (cleaned.endsWith('m')) return num * 1_000_000;
  if (cleaned.endsWith('k')) return num * 1_000;
  return num;
}

export function getPlanStats(planCompletion: Record<string, boolean>) {
  const entries = Object.entries(planCompletion).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const total = entries.length;
  const completed = entries.filter(([, done]) => done).length;
  const ratio = total > 0 ? completed / total : 0;
  return { entries, completed, total, ratio };
}
