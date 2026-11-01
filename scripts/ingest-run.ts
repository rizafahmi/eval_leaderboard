#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  extractContextTelemetry,
  extractExactTokens,
  type RunRecordData,
} from '../src/utils/telemetry.ts';
import {
  computeCostEconometrics,
  getModelPricingProfile,
} from '../src/data/pricing.ts';
import { getPlanStats, matchCommitStageId } from '../src/utils/format.ts';

export interface RawTurnEvent {
  stepIndex: number;
  timestamp?: string;
  role: 'assistant' | 'tool' | 'user' | 'system';
  uncachedInputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  toolName?: string;
  toolError?: boolean;
  commitMessage?: string;
}

/**
 * Parses a raw JSONL session transcript from Antigravity CLI, Codex CLI, Pi, Cursor CLI, or ZCode
 * into normalized turn events for deterministic slice and token accounting.
 */
export function parseRawTranscriptJsonl(jsonlContent: string): RawTurnEvent[] {
  const lines = jsonlContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const events: RawTurnEvent[] = [];
  let stepCounter = 0;

  for (const line of lines) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }

    stepCounter += 1;
    const stepIndex =
      typeof parsed.step_index === 'number'
        ? parsed.step_index
        : typeof parsed.stepIndex === 'number'
          ? parsed.stepIndex
          : stepCounter;

    const usage =
      (parsed.usage as Record<string, unknown> | undefined) ??
      ((parsed.message as Record<string, unknown> | undefined)?.usage as
        | Record<string, unknown>
        | undefined) ??
      {};

    const cachedInputTokens = Number(
      usage.cache_read_input_tokens ??
        usage.cached_input_tokens ??
        usage.cacheReadTokens ??
        usage.cacheRead ??
        parsed.cache_read_tokens ??
        0
    );

    const rawInput = Number(
      usage.input_tokens ?? usage.prompt_tokens ?? usage.uncachedInputTokens ?? 0
    );
    const uncachedInputTokens = Number(
      usage.uncached_input_tokens ??
        (usage.cached_input_tokens !== undefined && rawInput >= cachedInputTokens
          ? rawInput - cachedInputTokens
          : rawInput)
    );

    const thinkingTokens = Number(
      usage.reasoning_tokens ??
        usage.thinking_tokens ??
        usage.thinkingTokens ??
        (
          usage.output_tokens_details as Record<string, unknown> | undefined
        )?.reasoning_tokens ??
        0
    );

    const outputTokens = Number(
      usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0
    );

    let role: RawTurnEvent['role'] = 'system';
    const rawType = String(parsed.type ?? parsed.role ?? '').toLowerCase();
    if (
      rawType.includes('assistant') ||
      rawType.includes('planner_response') ||
      rawType.includes('turn.completed') ||
      outputTokens > 0 ||
      uncachedInputTokens > 0
    ) {
      role = 'assistant';
    } else if (rawType.includes('tool')) {
      role = 'tool';
    } else if (rawType.includes('user')) {
      role = 'user';
    }

    const toolName =
      typeof parsed.tool_name === 'string'
        ? parsed.tool_name
        : typeof parsed.tool === 'string'
          ? parsed.tool
          : undefined;
    const toolError = Boolean(
      parsed.isError === true ||
        parsed.is_error === true ||
        String(parsed.status ?? '').toLowerCase() === 'error'
    );

    events.push({
      stepIndex,
      timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : undefined,
      role,
      uncachedInputTokens,
      cachedInputTokens,
      outputTokens,
      thinkingTokens,
      toolName,
      toolError,
      commitMessage:
        typeof parsed.commitMessage === 'string' ? parsed.commitMessage : undefined,
    });
  }

  return events;
}

function formatCompactTokens(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}k`;
  }
  return `${n}`;
}

export function buildRunRecordFromEvents(opts: {
  events: RawTurnEvent[];
  codingHarness: string;
  model: string;
  effort?: string;
  provider: string;
  timestamp: string;
  durationMinutes: number;
  planCompletion: Record<string, boolean>;
  commits?: Array<{ hash: string; relativeTime?: string; author?: string; message: string }>;
}): RunRecordData {
  const { events, codingHarness, model, effort, provider, timestamp, durationMinutes, planCompletion } =
    opts;

  let uncachedInput = 0;
  let cachedInput = 0;
  let output = 0;
  let thinking = 0;
  let llmCalls = 0;
  let peakTokens = 0;
  let minTokens = Infinity;

  const toolCounts = new Map<string, { total: number; done: number; error: number }>();

  for (const ev of events) {
    if (ev.role === 'assistant' && (ev.uncachedInputTokens > 0 || ev.cachedInputTokens > 0 || ev.outputTokens > 0)) {
      llmCalls += 1;
      uncachedInput += ev.uncachedInputTokens;
      cachedInput += ev.cachedInputTokens;
      output += ev.outputTokens;
      thinking += ev.thinkingTokens;
      const turnPrompt = ev.uncachedInputTokens + ev.cachedInputTokens;
      if (turnPrompt > peakTokens) peakTokens = turnPrompt;
      if (turnPrompt > 0 && turnPrompt < minTokens) minTokens = turnPrompt;
    }
    if (ev.toolName) {
      const cur = toolCounts.get(ev.toolName) ?? { total: 0, done: 0, error: 0 };
      cur.total += 1;
      if (ev.toolError) cur.error += 1;
      else cur.done += 1;
      toolCounts.set(ev.toolName, cur);
    }
  }

  const total = uncachedInput + cachedInput + output;
  const totalPrompt = uncachedInput + cachedInput;
  const cacheHitRatePct =
    totalPrompt > 0 ? Number(((cachedInput / totalPrompt) * 100).toFixed(2)) : 0;

  const econ = computeCostEconometrics(
    { uncachedInput, cachedInput, output, thinking, total },
    model,
    0
  );
  const costUsd = Number(econ.billedCostUsd.toFixed(2));
  const plan = getPlanStats(planCompletion);

  const toolBreakdown = [...toolCounts.entries()]
    .map(([tool, stats]) => ({ tool, ...stats }))
    .sort((a, b) => b.total - a.total);
  const toolTotal = toolBreakdown.reduce((s, b) => s + b.total, 0);
  const toolDone = toolBreakdown.reduce((s, b) => s + b.done, 0);
  const toolError = toolBreakdown.reduce((s, b) => s + b.error, 0);

  return {
    timestamp,
    codingHarness,
    model,
    ...(effort ? { effort } : {}),
    provider,
    durationMinutes,
    costUsd,
    commits: opts.commits?.length,
    planCompletion,
    tokens: {
      input: formatCompactTokens(uncachedInput),
      cachedInput: formatCompactTokens(cachedInput),
      output: formatCompactTokens(output),
      ...(thinking > 0 ? { thinking: formatCompactTokens(thinking) } : {}),
      total: formatCompactTokens(total),
      cacheHitRate: `${cacheHitRatePct.toFixed(2)}%`,
    },
    tokenCounts: {
      uncachedInput,
      cachedInput,
      output,
      ...(thinking > 0 ? { thinking } : {}),
      total,
      cacheHitRatePct,
    },
    contextWindow: `${formatCompactTokens(peakTokens)} peak (${minTokens < Infinity ? minTokens.toLocaleString('en-US') : 0} → ${peakTokens.toLocaleString('en-US')} tokens)`,
    contextMetrics: {
      ...(minTokens < Infinity ? { minTokens } : {}),
      peakTokens,
    },
    verification: {
      holdoutPassed: plan.completed,
      holdoutTotal: plan.total,
      holdoutVerdict:
        plan.ratio === 1 ? 'full-pass' : plan.completed > 0 ? 'partial-pass' : 'zero-pass',
    },
    calls: {
      llmCalls,
      toolCalls: {
        total: toolTotal,
        done: toolDone,
        error: toolError,
        breakdown: toolBreakdown,
      },
    },
    ...(opts.commits ? { commitLog: opts.commits } : {}),
  };
}

/**
 * Enriches an existing RunRecordData object with exact numeric `tokenCounts`,
 * `contextMetrics`, and `verification` fields while preserving all existing keys.
 */
export function enrichRunRecord(d: RunRecordData): RunRecordData {
  const exactTokens = extractExactTokens(d);
  const context = extractContextTelemetry(d);
  const plan = getPlanStats(d.planCompletion);

  const tokenCounts: NonNullable<RunRecordData['tokenCounts']> = {
    uncachedInput: exactTokens.uncachedInput,
    cachedInput: exactTokens.cachedInput,
    output: exactTokens.output,
    ...(exactTokens.thinking > 0 ? { thinking: exactTokens.thinking } : {}),
    total: exactTokens.total,
    cacheHitRatePct: exactTokens.cacheHitRatePct,
  };

  const contextMetrics: RunRecordData['contextMetrics'] =
    context.peakTokens !== null
      ? {
          ...(context.minTokens !== null ? { minTokens: context.minTokens } : {}),
          ...(context.avgTokens !== null ? { avgTokens: context.avgTokens } : {}),
          peakTokens: context.peakTokens,
          ...(context.windowLimitTokens !== null
            ? { windowLimitTokens: context.windowLimitTokens }
            : {}),
          ...(context.peakUtilizationPct !== null
            ? { peakUtilizationPct: context.peakUtilizationPct }
            : {}),
        }
      : undefined;

  const verification: NonNullable<RunRecordData['verification']> = {
    holdoutPassed: plan.completed,
    holdoutTotal: plan.total,
    holdoutVerdict:
      plan.ratio === 1 ? 'full-pass' : plan.completed > 0 ? 'partial-pass' : 'zero-pass',
    ...(d.tests
      ? {
          agentSuitePassed: d.tests.passed,
          agentSuiteTotal: d.tests.total,
        }
      : {}),
  };

  // Preserve logical key order for readable git diffs
  const result: RunRecordData = {
    ...(d.published !== undefined ? { published: d.published } : {}),
    timestamp: d.timestamp,
    codingHarness: d.codingHarness,
    model: d.model,
    ...(d.effort !== undefined ? { effort: d.effort } : {}),
    provider: d.provider,
    durationMinutes: d.durationMinutes,
    costUsd: d.costUsd,
    ...(d.commits !== undefined ? { commits: d.commits } : {}),
    ...(d.tests !== undefined ? { tests: d.tests } : {}),
    planCompletion: d.planCompletion,
    verification,
    ...(d.interface !== undefined ? { interface: d.interface } : {}),
    ...(d.tokens !== undefined ? { tokens: d.tokens } : {}),
    tokenCounts,
    ...(d.contextWindow !== undefined ? { contextWindow: d.contextWindow } : {}),
    ...(contextMetrics !== undefined ? { contextMetrics } : {}),
    ...(d.calls !== undefined ? { calls: d.calls } : {}),
    ...(d.commitLog !== undefined ? { commitLog: d.commitLog } : {}),
    ...(d.costBreakdown !== undefined ? { costBreakdown: d.costBreakdown } : {}),
    ...(d.sliceBreakdown !== undefined ? { sliceBreakdown: d.sliceBreakdown } : {}),
    ...(d.notes !== undefined ? { notes: d.notes } : {}),
    ...(d.notesDetails !== undefined ? { notesDetails: d.notesDetails } : {}),
  };

  return result;
}

export function syncRunsDirectory(runsDir: string): { updated: number; files: string[] } {
  const files = fs
    .readdirSync(runsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  let updated = 0;

  for (const file of files) {
    const fullPath = path.join(runsDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw) as RunRecordData;
    const enriched = enrichRunRecord(data);
    const formatted = `${JSON.stringify(enriched, null, 2)}\n`;
    if (formatted !== raw) {
      fs.writeFileSync(fullPath, formatted, 'utf8');
      updated += 1;
    }
  }

  return { updated, files };
}

function readGitCommitsFromRepo(repoDir: string) {
  try {
    const out = execFileSync(
      'git',
      ['-C', repoDir, 'log', '--pretty=format:%h|%cr|%an|%s', '-n', '25'],
      { encoding: 'utf8' }
    );
    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [hash, relativeTime, author, ...msgParts] = line.split('|');
        return {
          hash: hash.trim(),
          relativeTime: relativeTime.trim(),
          author: author.trim(),
          message: msgParts.join('|').trim(),
        };
      });
  } catch {
    return undefined;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const runsDir = path.resolve(process.cwd(), 'src/content/runs');

  if (args.includes('--sync') || args.includes('--backfill') || args.length === 0) {
    const res = syncRunsDirectory(runsDir);
    console.log(
      `[ingest-run] Synced ${res.files.length} run records (${res.updated} updated with exact numeric telemetry).`
    );
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const transcriptPath = getArg('--transcript');
  if (!transcriptPath) {
    console.error(
      'Usage: node --experimental-strip-types scripts/ingest-run.ts [--sync] | [--transcript <events.jsonl> --harness <name> --model <name> --provider <name> --duration <min> [--repo <dir>] [--out <file.json>]]'
    );
    process.exit(2);
  }

  const content = fs.readFileSync(path.resolve(transcriptPath), 'utf8');
  const events = parseRawTranscriptJsonl(content);
  const repoDir = getArg('--repo');
  const commits = repoDir ? readGitCommitsFromRepo(path.resolve(repoDir)) : undefined;

  const planCompletion: Record<string, boolean> = {
    S1: false,
    S2: false,
    S3: false,
    S4: false,
    S5: false,
    S6: false,
    S7: false,
  };
  if (commits) {
    for (const c of commits) {
      const st = matchCommitStageId(c.message);
      if (st && st in planCompletion) {
        planCompletion[st] = true;
      }
    }
  }

  const record = buildRunRecordFromEvents({
    events,
    codingHarness: getArg('--harness') ?? 'Unknown Harness',
    model: getArg('--model') ?? 'unknown-model',
    effort: getArg('--effort'),
    provider: getArg('--provider') ?? 'Unknown',
    timestamp: getArg('--timestamp') ?? new Date().toISOString(),
    durationMinutes: Number(getArg('--duration') ?? 0),
    planCompletion,
    commits,
  });

  const outPath = getArg('--out');
  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    console.log(`[ingest-run] Wrote ingested run record to ${outPath}`);
  } else {
    console.log(JSON.stringify(record, null, 2));
  }
}
