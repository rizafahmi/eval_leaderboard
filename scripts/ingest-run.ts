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

    const stepUpdate = parsed.step_update as Record<string, unknown> | undefined;
    if (parsed.event === 'init' || parsed.event === 'result') {
      continue;
    }
    if (stepUpdate && stepUpdate.state === 'ACTIVE') {
      continue;
    }

    const evObj = stepUpdate ?? parsed;

    stepCounter += 1;
    const stepIndex =
      typeof evObj.step_index === 'number'
        ? evObj.step_index
        : typeof evObj.stepIndex === 'number'
          ? evObj.stepIndex
          : stepCounter;

    const msg = evObj.message as Record<string, unknown> | undefined;
    const resp = evObj.response as Record<string, unknown> | undefined;
    const payload = evObj.payload as Record<string, unknown> | undefined;
    const payloadModels = Array.isArray(payload?.models)
      ? (payload.models[0] as Record<string, unknown> | undefined)
      : undefined;
    const part = evObj.part as Record<string, unknown> | undefined;
    const partTokens = part?.tokens as Record<string, unknown> | undefined;
    const partCache = partTokens?.cache as Record<string, unknown> | undefined;
    const partState = part?.state as Record<string, unknown> | undefined;
    const toolInfo = evObj.tool_info as Record<string, unknown> | undefined;
    const usage =
      (evObj.usage as Record<string, unknown> | undefined) ??
      (msg?.usage as Record<string, unknown> | undefined) ??
      (resp?.usage as Record<string, unknown> | undefined) ??
      payloadModels ??
      partTokens ??
      {};

    const cachedInputTokens = Number(
      usage.cache_read_input_tokens ??
        usage.cached_input_tokens ??
        usage.cached_tokens ??
        usage.cacheReadTokens ??
        usage.cacheRead ??
        usage.cache_read_tokens ??
        partCache?.read ??
        evObj.cache_read_tokens ??
        0
    );

    const rawInput = Number(
      usage.input_tokens ??
        usage.inputTokens ??
        usage.prompt_tokens ??
        usage.uncachedInputTokens ??
        usage.input ??
        0
    );
    const hasInclusiveInput =
      usage.cached_input_tokens !== undefined ||
      usage.cached_tokens !== undefined ||
      usage.cacheReadTokens !== undefined;
    const uncachedInputTokens = Number(
      usage.uncached_input_tokens ??
        (hasInclusiveInput && rawInput >= cachedInputTokens
          ? rawInput - cachedInputTokens
          : rawInput)
    );

    const thinkingTokens = Number(
      usage.reasoning_tokens ??
        usage.reasoningTokens ??
        usage.thinking_tokens ??
        usage.thinkingTokens ??
        usage.reasoning ??
        (
          usage.output_tokens_details as Record<string, unknown> | undefined
        )?.reasoning_tokens ??
        0
    );

    const rawOutput = Number(
      usage.output_tokens ??
        usage.completion_tokens ??
        usage.outputTokens ??
        usage.output ??
        0
    );
    // OpenCode step_finish reports visible output and reasoning tokens separately
    const outputTokens =
      String(evObj.type ?? '') === 'step_finish' ? rawOutput + thinkingTokens : rawOutput;

    let role: RawTurnEvent['role'] = 'system';
    const rawType = String(
      msg?.role ?? evObj.payload_type ?? evObj.step_type ?? evObj.type ?? evObj.role ?? ''
    ).toLowerCase();
    if (
      rawType.includes('assistant') ||
      rawType.includes('agent_response') ||
      rawType.includes('planner_response') ||
      rawType.includes('turn.completed') ||
      rawType.includes('run.usage') ||
      rawType === 'step_finish' ||
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
      typeof evObj.tool_name === 'string'
        ? evObj.tool_name
        : typeof evObj.tool === 'string'
          ? evObj.tool
          : typeof part?.tool === 'string'
            ? part.tool
            : typeof msg?.toolName === 'string'
              ? msg.toolName
              : undefined;
    const toolOutput = typeof toolInfo?.output === 'string' ? toolInfo.output : '';
    const toolExitMatch = toolOutput.match(/Command exited with code (\d+)/);
    const hasNonZeroCommandExit = Boolean(toolExitMatch && toolExitMatch[1] !== '0');
    const toolError = Boolean(
      evObj.isError === true ||
        evObj.is_error === true ||
        msg?.isError === true ||
        String(evObj.status ?? '').toLowerCase() === 'error' ||
        String(evObj.state ?? '').toLowerCase() === 'error' ||
        Boolean(toolInfo?.error) ||
        String(partState?.status ?? '').toLowerCase() === 'error' ||
        hasNonZeroCommandExit
    );
    events.push({
      stepIndex,
      timestamp: typeof evObj.timestamp === 'string' ? evObj.timestamp : undefined,
      role,
      uncachedInputTokens,
      cachedInputTokens,
      outputTokens,
      thinkingTokens,
      toolName,
      toolError,
      commitMessage:
        typeof evObj.commitMessage === 'string' ? evObj.commitMessage : undefined,
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

export const MAX_COMMIT_LOG_ENTRIES = 25;

export function countNonInitCommits(
  commits: Array<{ hash: string; relativeTime?: string; author?: string; message: string }>
): number {
  return commits.filter(
    (c, idx, arr) => !(idx === arr.length - 1 && /^init$/i.test(c.message.trim()))
  ).length;
}

export function derivePlanCompletionFromCommits(
  commits?: Array<{ hash: string; relativeTime?: string; author?: string; message: string }>
): Record<string, boolean> {
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
  return planCompletion;
}

export function buildRunRecordFromEvents(opts: {
  events: RawTurnEvent[];
  codingHarness: string;
  model: string;
  effort?: string;
  provider: string;
  timestamp: string;
  durationMinutes: number;
  costUsd?: number;
  planCompletion?: Record<string, boolean>;
  agentPlanCompletion?: Record<string, boolean>;
  commits?: Array<{ hash: string; relativeTime?: string; author?: string; message: string }>;
}): RunRecordData {
  const { events, codingHarness, model, effort, provider, timestamp, durationMinutes } = opts;
  const planCompletion = opts.planCompletion ?? derivePlanCompletionFromCommits(opts.commits);

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

  if (opts.costUsd !== undefined && (!Number.isFinite(opts.costUsd) || opts.costUsd < 0)) {
    throw new Error(`Invalid costUsd "${opts.costUsd}": expected a non-negative finite number.`);
  }

  const econ = computeCostEconometrics(
    { uncachedInput, cachedInput, output, thinking, total },
    model,
    opts.costUsd ?? 0
  );
  if (!econ.profile && opts.costUsd === undefined) {
    throw new Error(
      `Model "${model}" is not in MODEL_PRICING_CATALOG. Add its pricing profile to src/data/pricing.ts or pass an explicit costUsd (CLI: --cost <usd>).`
    );
  }
  const costUsd = Number((opts.costUsd ?? econ.billedCostUsd).toFixed(2));
  const plan = getPlanStats(planCompletion);

  const toolBreakdown = [...toolCounts.entries()]
    .map(([tool, stats]) => ({ tool, ...stats }))
    .sort((a, b) => b.total - a.total);
  const toolTotal = toolBreakdown.reduce((s, b) => s + b.total, 0);
  const toolDone = toolBreakdown.reduce((s, b) => s + b.done, 0);
  const toolError = toolBreakdown.reduce((s, b) => s + b.error, 0);

  const agentCommitsCount = opts.commits ? countNonInitCommits(opts.commits) : undefined;
  const storedCommitLog = opts.commits
    ? opts.commits.slice(0, MAX_COMMIT_LOG_ENTRIES)
    : undefined;
  const claimedPlan = opts.agentPlanCompletion
    ? getPlanStats(opts.agentPlanCompletion)
    : plan;
  const unverifiedSlices = opts.agentPlanCompletion
    ? Object.keys(planCompletion).filter(
        (k) => Boolean(opts.agentPlanCompletion?.[k]) && !planCompletion[k]
      )
    : [];

  return {
    timestamp,
    codingHarness,
    model,
    ...(effort ? { effort } : {}),
    provider,
    durationMinutes,
    costUsd,
    commits: agentCommitsCount,
    planCompletion,
    ...(opts.agentPlanCompletion ? { agentPlanCompletion: opts.agentPlanCompletion } : {}),
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
      agentClaimedPassed: claimedPlan.completed,
      agentClaimedTotal: claimedPlan.total,
      ...(unverifiedSlices.length > 0 ? { unverifiedSlices } : {}),
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
    ...(storedCommitLog ? { commitLog: storedCommitLog } : {}),
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
  const claimedPlan = d.agentPlanCompletion
    ? getPlanStats(d.agentPlanCompletion)
    : plan;
  const unverifiedSlices = d.agentPlanCompletion
    ? Object.keys(d.planCompletion).filter(
        (k) => Boolean(d.agentPlanCompletion?.[k]) && !d.planCompletion[k]
      )
    : d.verification?.unverifiedSlices ?? [];

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
    agentClaimedPassed: d.verification?.agentClaimedPassed ?? claimedPlan.completed,
    agentClaimedTotal: d.verification?.agentClaimedTotal ?? claimedPlan.total,
    ...(unverifiedSlices.length > 0 ? { unverifiedSlices } : {}),
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
    ...(d.agentPlanCompletion !== undefined
      ? { agentPlanCompletion: d.agentPlanCompletion }
      : {}),
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

export function readGitCommitsFromRepo(repoDir: string) {
  try {
    const out = execFileSync(
      'git',
      ['-C', repoDir, 'log', '--pretty=format:%h|%cr|%an|%s'],
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

export function readPlanCheckboxesFromRepo(repoDir: string): Record<string, boolean> | undefined {
  try {
    const planPath = path.join(repoDir, 'PLAN.md');
    if (!fs.existsSync(planPath)) return undefined;
    const raw = fs.readFileSync(planPath, 'utf8');
    const result: Record<string, boolean> = {};
    for (let i = 1; i <= 7; i += 1) {
      const key = `S${i}`;
      result[key] = new RegExp(`- \\[[xX]\\] \\*\\*${key}\\.`).test(raw);
    }
    return result;
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
      'Usage: node --experimental-strip-types scripts/ingest-run.ts [--sync] | [--transcript <events.jsonl> --harness <name> --model <name> --provider <name> --duration <min> [--cost <usd>] [--repo <dir>] [--out <file.json>]]'
    );
    process.exit(2);
  }

  const content = fs.readFileSync(path.resolve(transcriptPath), 'utf8');
  const events = parseRawTranscriptJsonl(content);
  const repoDir = getArg('--repo');
  const commits = repoDir ? readGitCommitsFromRepo(path.resolve(repoDir)) : undefined;
  const agentPlanCompletion = repoDir
    ? readPlanCheckboxesFromRepo(path.resolve(repoDir))
    : undefined;
  const planCompletion = derivePlanCompletionFromCommits(commits);
  const costArg = getArg('--cost');
  const costUsd = costArg !== undefined ? Number(costArg) : undefined;

  const record = buildRunRecordFromEvents({
    events,
    codingHarness: getArg('--harness') ?? 'Unknown Harness',
    model: getArg('--model') ?? 'unknown-model',
    effort: getArg('--effort'),
    provider: getArg('--provider') ?? 'Unknown',
    timestamp: getArg('--timestamp') ?? new Date().toISOString(),
    durationMinutes: Number(getArg('--duration') ?? 0),
    ...(costUsd !== undefined ? { costUsd } : {}),
    planCompletion,
    ...(agentPlanCompletion ? { agentPlanCompletion } : {}),
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
