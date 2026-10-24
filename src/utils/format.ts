export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatCost(costUsd: number): string {
  return `$${costUsd.toFixed(2)}`;
}

export function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) {
    return ts;
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
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
