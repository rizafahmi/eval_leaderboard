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

export interface TextSegment {
  type: 'text' | 'code';
  value: string;
}

export interface ParsedNoteBullet {
  isIntro: boolean;
  lead: TextSegment[] | null;
  isBlockLead: boolean;
  body: TextSegment[];
}

const INLINE_CODE_PATTERN = new RegExp(
  [
    '\\b(?:WaitMsBeforeAsync|cache_read_tokens|Overwrite|isError|thinkingLevel|stopReason|effort|attempt):\\s*(?:"[^"]+"|[0-9]+|true|false)\\b',
    '(?::[a-z_0-9]+\\.|\\b[A-Za-z0-9_.]+\\.)?[A-Za-z0-9_]+!?\\([^()]*\\)',
    '(?::[a-z_][a-z_0-9]*|\\b[A-Z][A-Za-z0-9_.]*)\\.[a-z_0-9!?]+\\/[0-9]+',
    '\\bmain\\/[01]\\b',
    '\\b[A-Z][A-Za-z0-9_]+\\.[a-z_0-9_]+\\b',
    '\\bmix\\s+(?:compile\\s+--warnings-as-errors|credo\\s+--strict|test\\s+--only\\s+integration|format\\s+&&\\s+mix\\s+test|help\\s+escript\\.build|help\\s+compile|escript\\.build|deps\\.get|local\\.hex|compile|credo|test|format|help|type)\\b',
    '\\bgit\\s+(?:add\\s+-A(?:\\s+&&\\s+git\\s+commit\\s+-q)?|commit\\s+-q(?:\\s+-m)?)\\b',
    '\\berl\\s+-help\\b',
    '\\bps\\s+-ef\\b',
    '\\/usr\\/bin\\/script\\s+-q\\s+\\/dev\\/null\\s+\\.\\/cb\\s+\\.\\.\\.',
    '\\.\\/cb\\s+https?:\\/\\/[A-Za-z0-9_.:/-]+',
    '\\bTransfer-Encoding:\\s*chunked\\b',
    '\\bContent-Length\\b',
    '\\/bin\\/cat(?:\\s+<fifo>)?',
    '\\/nix\\/store\\b',
    '\\/tmp(?:\\/[A-Za-z0-9_./-]+)?\\b',
    '(?:\\b(?:test|lib)\\/[A-Za-z0-9_./-]*|\\b[A-Za-z0-9_]+\\.(?:exs?|md|dump)\\b|\\.gitignore\\b|\\.\\/cb\\b)',
    ':[a-z_][a-z_0-9]*\\b',
    '\\+Bi\\b',
    '\\\\x03',
    '\\[x\\]',
    '\\b(?:run_command|manage_task|write_file|edit_file|search_web|system_message|cache_read_tokens|CB_[A-Z_]+|SSL_CERT_FILE|mkfifo|cacheReadTokens|cacheRead|reasoningText|toolUse|oldText|context_edit)\\b',
  ].join('|'),
  'g'
);

export function tokenizeNoteText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_CODE_PATTERN)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, idx) });
    }
    segments.push({ type: 'code', value: match[0] });
    lastIndex = idx + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export function parseNoteBullet(bullet: string): ParsedNoteBullet {
  const trimmed = bullet.trim();
  if (trimmed.endsWith(':')) {
    return {
      isIntro: true,
      lead: null,
      isBlockLead: false,
      body: tokenizeNoteText(trimmed),
    };
  }

  const match = trimmed.match(
    /^((?:[A-Za-z0-9_]+:\s*"[^"]*"|:[a-z_0-9]+|[^:"]|"[^"]*"){2,95}?):\s+(.+)$/s
  );
  if (match) {
    const leadCandidate = match[1];
    const openParens = (leadCandidate.match(/\(/g) ?? []).length;
    const closeParens = (leadCandidate.match(/\)/g) ?? []).length;
    if (openParens === closeParens) {
      const isBlockLead = /^\d+\./.test(leadCandidate) || leadCandidate.length > 42;
      return {
        isIntro: false,
        lead: tokenizeNoteText(isBlockLead ? leadCandidate : `${leadCandidate}:`),
        isBlockLead,
        body: tokenizeNoteText(match[2]),
      };
    }
  }

  return {
    isIntro: false,
    lead: null,
    isBlockLead: false,
    body: tokenizeNoteText(trimmed),
  };
}
