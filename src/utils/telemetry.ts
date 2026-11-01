import {
  formatHarnessName,
  formatProviderName,
  getPlanStats,
  getStepRangeCount,
  matchCommitStageId,
  matchSliceStageId,
  parseTokenString,
} from './format.ts';
import {
  computeCostEconometrics,
  type ComputedCostMetrics,
} from '../data/pricing.ts';

export const STAGE_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] as const;
export type StageId = (typeof STAGE_IDS)[number];

export interface RunRecordData {
  published?: boolean;
  timestamp: string;
  codingHarness: string;
  model: string;
  effort?: string;
  provider: string;
  durationMinutes: number;
  costUsd: number;
  commits?: number;
  tests?: {
    passed: number;
    total: number;
    durationSeconds?: number;
    details?: string;
  };
  planCompletion: Record<string, boolean>;
  interface?: {
    type?: 'cli' | 'desktop' | 'web';
    command?: string;
    details?: string;
  };
  tokens?: {
    input?: string;
    cachedInput?: string;
    output?: string;
    thinking?: string;
    total?: string;
    cacheHitRate?: string;
  };
  tokenCounts?: {
    uncachedInput: number;
    cachedInput: number;
    output: number;
    thinking?: number;
    total: number;
    cacheHitRatePct: number;
  };
  contextWindow?: string;
  contextMetrics?: {
    minTokens?: number;
    avgTokens?: number;
    peakTokens: number;
    windowLimitTokens?: number;
    peakUtilizationPct?: number;
  };
  verification?: {
    holdoutPassed: number;
    holdoutTotal: number;
    holdoutVerdict: 'full-pass' | 'partial-pass' | 'zero-pass';
    agentSuitePassed?: number;
    agentSuiteTotal?: number;
  };
  calls?: {
    llmCalls?: number;
    toolCalls?: {
      total?: number;
      done?: number;
      error?: number;
      breakdown?: Array<{
        tool: string;
        total: number;
        done?: number;
        error?: number;
      }>;
    };
  };
  commitLog?: Array<{
    hash: string;
    relativeTime?: string;
    author?: string;
    message: string;
  }>;
  costBreakdown?: Array<{
    component: string;
    tokens: string;
    rate2026?: string;
    cost2026: string;
    rate2027?: string;
    cost2027?: string;
  }>;
  sliceBreakdown?: Array<{
    slice: string;
    stepRange: string;
    llmCalls: number;
    manageTaskPolls?: number;
    thinkingTokens?: number;
    costUsd: number;
  }>;
  notes?: string[];
  notesDetails?: Array<{
    title: string;
    bullets: string[];
  }>;
}

export interface ExactTokenTelemetry {
  uncachedInput: number;
  cachedInput: number;
  output: number;
  thinking: number;
  total: number;
  cacheHitRatePct: number;
}

export interface ContextTelemetry {
  minTokens: number | null;
  avgTokens: number | null;
  peakTokens: number | null;
  windowLimitTokens: number | null;
  peakUtilizationPct: number | null;
}

export interface StageCellTelemetry {
  stageId: StageId;
  completed: boolean;
  wasAttempted: boolean;
  llmCalls: number;
  costUsd: number;
  thinkingTokens: number;
  stepCount: number;
  pollingCalls: number;
  callSharePct: number;
  costSharePct: number;
  isPeakCost: boolean;
}

export interface AnalyzedRun {
  id: string;
  data: RunRecordData;
  displayHarness: string;
  displayProvider: string;
  plan: ReturnType<typeof getPlanStats>;
  tokens: ExactTokenTelemetry;
  context: ContextTelemetry;
  costMetrics: ComputedCostMetrics;
  llmCalls: number;
  toolTotalCalls: number;
  toolDoneCalls: number;
  toolErrorCalls: number;
  toolSuccessRatePct: number | null;
  toolErrorRatePct: number | null;
  pollingCalls: number;
  pollingSharePct: number;
  estimatedPollingWasteUsd: number;
  tokensPerCompletedSlice: number | null;
  costPerCompletedSlice: number | null;
  thinkingShareOfOutputPct: number;
  stages: Record<StageId, StageCellTelemetry>;
  nonStageLlmCalls: number;
  nonStageCostUsd: number;
  peakStageId: StageId | null;
  isParetoFrontier: boolean;
  paretoOrder: number | null;
  dominatedBy: string[];
}

function parseExactIntString(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '').trim();
  if (/^\d+$/.test(cleaned)) {
    return Number(cleaned);
  }
  return null;
}

export function extractExactTokens(d: RunRecordData): ExactTokenTelemetry {
  if (d.tokenCounts) {
    return {
      uncachedInput: d.tokenCounts.uncachedInput,
      cachedInput: d.tokenCounts.cachedInput,
      output: d.tokenCounts.output,
      thinking: d.tokenCounts.thinking ?? computeThinkingTokensFallback(d),
      total: d.tokenCounts.total,
      cacheHitRatePct: d.tokenCounts.cacheHitRatePct,
    };
  }

  let uncachedInput: number | null = null;
  let cachedInput: number | null = null;
  let output: number | null = null;
  let total: number | null = null;
  let reasoningFromLabel: number | null = null;

  if (d.costBreakdown && d.costBreakdown.length > 0) {
    for (const row of d.costBreakdown) {
      const comp = row.component.toLowerCase();
      const val = parseExactIntString(row.tokens);
      if (val === null) continue;
      if (comp.startsWith('total')) {
        total = val;
      } else if (comp.includes('cached') && !comp.includes('uncached')) {
        cachedInput = val;
      } else if (comp.includes('input') || comp.includes('uncached')) {
        uncachedInput = val;
      } else if (comp.includes('output')) {
        output = val;
        const reasoningMatch = row.component.match(/incl\.\s*([0-9,]+)\s*reasoning/i);
        if (reasoningMatch) {
          reasoningFromLabel = parseExactIntString(reasoningMatch[1]);
        }
      }
    }
  }

  const finalUncached = uncachedInput ?? Math.round(parseTokenString(d.tokens?.input));
  const finalCached = cachedInput ?? Math.round(parseTokenString(d.tokens?.cachedInput));
  const finalOutput = output ?? Math.round(parseTokenString(d.tokens?.output));
  const finalTotal =
    total ??
    (finalUncached + finalCached + finalOutput || Math.round(parseTokenString(d.tokens?.total)));

  const sliceThinkingSum =
    d.sliceBreakdown && d.sliceBreakdown.length > 0
      ? d.sliceBreakdown.reduce((sum, s) => sum + (s.thinkingTokens ?? 0), 0)
      : 0;

  const finalThinking =
    reasoningFromLabel ??
    (sliceThinkingSum > 0 ? sliceThinkingSum : Math.round(parseTokenString(d.tokens?.thinking)));

  const totalPrompt = finalUncached + finalCached;
  const computedHitRate =
    totalPrompt > 0 ? Number(((finalCached / totalPrompt) * 100).toFixed(2)) : 0;

  return {
    uncachedInput: finalUncached,
    cachedInput: finalCached,
    output: finalOutput,
    thinking: finalThinking,
    total: finalTotal,
    cacheHitRatePct: computedHitRate,
  };
}

function computeThinkingTokensFallback(d: RunRecordData): number {
  if (d.sliceBreakdown && d.sliceBreakdown.length > 0) {
    const sum = d.sliceBreakdown.reduce((acc, s) => acc + (s.thinkingTokens ?? 0), 0);
    if (sum > 0) return sum;
  }
  return Math.round(parseTokenString(d.tokens?.thinking));
}

export function extractContextTelemetry(d: RunRecordData): ContextTelemetry {
  if (d.contextMetrics) {
    return {
      minTokens: d.contextMetrics.minTokens ?? null,
      avgTokens: d.contextMetrics.avgTokens ?? null,
      peakTokens: d.contextMetrics.peakTokens,
      windowLimitTokens: d.contextMetrics.windowLimitTokens ?? null,
      peakUtilizationPct: d.contextMetrics.peakUtilizationPct ?? null,
    };
  }

  const raw = d.contextWindow;
  if (!raw) {
    return {
      minTokens: null,
      avgTokens: null,
      peakTokens: null,
      windowLimitTokens: null,
      peakUtilizationPct: null,
    };
  }

  let minTokens: number | null = null;
  let avgTokens: number | null = null;
  let peakTokens: number | null = null;
  let windowLimitTokens: number | null = null;
  let peakUtilizationPct: number | null = null;

  const utilMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)%\s*out\s*of\s*([0-9]+(?:\.[0-9]+)?[kKmM])/i);
  if (utilMatch) {
    peakUtilizationPct = Number(utilMatch[1]);
    windowLimitTokens = Math.round(parseTokenString(utilMatch[2]));
  }

  const avgMatch = raw.match(/([0-9]+(?:\.[0-9]+)?[kKmM])\s*avg/i);
  if (avgMatch) {
    avgTokens = Math.round(parseTokenString(avgMatch[1]));
  }

  const arrowExactMatch = raw.match(
    /(~?[0-9,]+(?:\.[0-9]+)?[kKmM]?)\s*→\s*(~?[0-9,]+(?:\.[0-9]+)?[kKmM]?)/
  );
  if (arrowExactMatch) {
    const startRaw = arrowExactMatch[1].replace(/^~/, '');
    const endRaw = arrowExactMatch[2].replace(/^~/, '');
    minTokens = parseExactIntString(startRaw) ?? Math.round(parseTokenString(startRaw));
    peakTokens = parseExactIntString(endRaw) ?? Math.round(parseTokenString(endRaw));
  }

  if (!peakTokens) {
    const peakMatch = raw.match(/(~?[0-9,]+(?:\.[0-9]+)?[kKmM]?)\s*peak/i);
    if (peakMatch) {
      const pRaw = peakMatch[1].replace(/^~/, '');
      peakTokens = parseExactIntString(pRaw) ?? Math.round(parseTokenString(pRaw));
    }
  }

  return {
    minTokens,
    avgTokens,
    peakTokens,
    windowLimitTokens,
    peakUtilizationPct,
  };
}

export function analyzeSingleRun(id: string, d: RunRecordData): AnalyzedRun {
  const plan = getPlanStats(d.planCompletion);
  const tokens = extractExactTokens(d);
  const context = extractContextTelemetry(d);
  const costMetrics = computeCostEconometrics(tokens, d.model, d.costUsd);

  const llmCalls =
    d.calls?.llmCalls ??
    (d.sliceBreakdown ? d.sliceBreakdown.reduce((sum, s) => sum + s.llmCalls, 0) : 0);
  const toolTotalCalls = d.calls?.toolCalls?.total ?? 0;
  const toolDoneCalls = d.calls?.toolCalls?.done ?? 0;
  const toolErrorCalls = d.calls?.toolCalls?.error ?? 0;
  const toolSuccessRatePct =
    toolTotalCalls > 0 ? Number(((toolDoneCalls / toolTotalCalls) * 100).toFixed(1)) : null;
  const toolErrorRatePct =
    toolTotalCalls > 0 ? Number(((toolErrorCalls / toolTotalCalls) * 100).toFixed(1)) : null;

  const slicePolls =
    d.sliceBreakdown?.reduce((sum, s) => sum + (s.manageTaskPolls ?? 0), 0) ?? 0;
  const toolManageTask =
    d.calls?.toolCalls?.breakdown?.find((b) => b.tool === 'manage_task')?.total ?? 0;
  const pollingCalls = slicePolls > 0 ? slicePolls : toolManageTask;
  const pollingSharePct =
    llmCalls > 0 ? Number(((pollingCalls / llmCalls) * 100).toFixed(1)) : 0;

  let estimatedPollingWasteUsd = 0;
  if (d.sliceBreakdown && d.sliceBreakdown.length > 0 && slicePolls > 0) {
    for (const s of d.sliceBreakdown) {
      if ((s.manageTaskPolls ?? 0) > 0 && s.llmCalls > 0) {
        estimatedPollingWasteUsd += (s.manageTaskPolls! / s.llmCalls) * s.costUsd;
      }
    }
    estimatedPollingWasteUsd = Number(estimatedPollingWasteUsd.toFixed(2));
  } else if (pollingCalls > 0 && llmCalls > 0) {
    estimatedPollingWasteUsd = Number(((pollingCalls / llmCalls) * d.costUsd).toFixed(2));
  }

  const committedStageIds = new Set<string>();
  if (d.commitLog) {
    for (const c of d.commitLog) {
      const st = matchCommitStageId(c.message);
      if (st) committedStageIds.add(st);
    }
  }

  const stages = {} as Record<StageId, StageCellTelemetry>;
  for (const stageId of STAGE_IDS) {
    const completed = Boolean(d.planCompletion[stageId]);
    stages[stageId] = {
      stageId,
      completed,
      wasAttempted: completed || committedStageIds.has(stageId),
      llmCalls: 0,
      costUsd: 0,
      thinkingTokens: 0,
      stepCount: 0,
      pollingCalls: 0,
      callSharePct: 0,
      costSharePct: 0,
      isPeakCost: false,
    };
  }

  let nonStageLlmCalls = 0;
  let nonStageCostUsd = 0;

  if (d.sliceBreakdown && d.sliceBreakdown.length > 0) {
    for (const row of d.sliceBreakdown) {
      const st = matchSliceStageId(row.slice) as StageId | null;
      const steps = getStepRangeCount(row.stepRange) ?? 0;
      if (st && stages[st]) {
        stages[st].llmCalls += row.llmCalls;
        stages[st].costUsd = Number((stages[st].costUsd + row.costUsd).toFixed(4));
        stages[st].thinkingTokens += row.thinkingTokens ?? 0;
        stages[st].stepCount += steps;
        stages[st].pollingCalls += row.manageTaskPolls ?? 0;
        if (row.llmCalls > 0) {
          stages[st].wasAttempted = true;
        }
      } else {
        nonStageLlmCalls += row.llmCalls;
        nonStageCostUsd = Number((nonStageCostUsd + row.costUsd).toFixed(4));
      }
    }
  }

  const totalSliceCost =
    d.sliceBreakdown?.reduce((sum, s) => sum + s.costUsd, 0) || d.costUsd || 0;
  const totalSliceCalls =
    d.sliceBreakdown?.reduce((sum, s) => sum + s.llmCalls, 0) || llmCalls || 0;

  let maxStageCost = 0;
  let peakStageId: StageId | null = null;

  for (const stageId of STAGE_IDS) {
    const cell = stages[stageId];
    cell.callSharePct =
      totalSliceCalls > 0 ? Number(((cell.llmCalls / totalSliceCalls) * 100).toFixed(1)) : 0;
    cell.costSharePct =
      totalSliceCost > 0 ? Number(((cell.costUsd / totalSliceCost) * 100).toFixed(1)) : 0;
    if (cell.costUsd > maxStageCost && cell.costUsd > 0) {
      maxStageCost = cell.costUsd;
      peakStageId = stageId;
    }
  }

  if (peakStageId && maxStageCost > 0) {
    for (const stageId of STAGE_IDS) {
      if (stages[stageId].costUsd === maxStageCost) {
        stages[stageId].isPeakCost = true;
      }
    }
  }

  const tokensPerCompletedSlice =
    plan.completed > 0 ? Math.round(tokens.total / plan.completed) : null;
  const costPerCompletedSlice =
    plan.completed > 0 ? Number((d.costUsd / plan.completed).toFixed(2)) : null;
  const thinkingShareOfOutputPct =
    tokens.output > 0 ? Number(((tokens.thinking / tokens.output) * 100).toFixed(1)) : 0;

  return {
    id,
    data: d,
    displayHarness: formatHarnessName(d.codingHarness),
    displayProvider: formatProviderName(d.provider),
    plan,
    tokens,
    context,
    costMetrics,
    llmCalls,
    toolTotalCalls,
    toolDoneCalls,
    toolErrorCalls,
    toolSuccessRatePct,
    toolErrorRatePct,
    pollingCalls,
    pollingSharePct,
    estimatedPollingWasteUsd,
    tokensPerCompletedSlice,
    costPerCompletedSlice,
    thinkingShareOfOutputPct,
    stages,
    nonStageLlmCalls,
    nonStageCostUsd,
    peakStageId,
    isParetoFrontier: false,
    paretoOrder: null,
    dominatedBy: [],
  };
}

export function analyzeAndRankRuns(
  entries: Array<{ id: string; data: RunRecordData }>
): AnalyzedRun[] {
  const analyzed = entries.map((e) => analyzeSingleRun(e.id, e.data));

  // Compute Pareto frontier among 7/7 full-pass runs on (durationMinutes, costUsd)
  const fullPass = analyzed.filter((r) => r.plan.ratio === 1);
  for (const candidate of fullPass) {
    const dominators = fullPass.filter(
      (other) =>
        other.id !== candidate.id &&
        other.data.durationMinutes <= candidate.data.durationMinutes &&
        other.data.costUsd <= candidate.data.costUsd &&
        (other.data.durationMinutes < candidate.data.durationMinutes ||
          other.data.costUsd < candidate.data.costUsd)
    );
    candidate.dominatedBy = dominators.map((d) => d.id);
    candidate.isParetoFrontier = dominators.length === 0;
  }

  const frontierRuns = fullPass
    .filter((r) => r.isParetoFrontier)
    .sort(
      (a, b) =>
        a.data.durationMinutes - b.data.durationMinutes || a.data.costUsd - b.data.costUsd
    );
  frontierRuns.forEach((r, idx) => {
    r.paretoOrder = idx + 1;
  });

  // Sort runs primarily by holdout spec completion (plan.ratio), then lowest cost, then fastest duration, then agent test ratio
  return analyzed.sort((a, b) => {
    if (b.plan.ratio !== a.plan.ratio) return b.plan.ratio - a.plan.ratio;
    const testsA =
      a.data.tests && a.data.tests.total > 0 ? a.data.tests.passed / a.data.tests.total : -1;
    const testsB =
      b.data.tests && b.data.tests.total > 0 ? b.data.tests.passed / b.data.tests.total : -1;
    if (testsB !== testsA) return testsB - testsA;
    if (a.data.costUsd !== b.data.costUsd) return a.data.costUsd - b.data.costUsd;
    return a.data.durationMinutes - b.data.durationMinutes;
  });
}

export interface StageBottleneckSummary {
  stageId: StageId;
  passCount: number;
  totalRuns: number;
  passRatePct: number;
  avgCallSharePct: number;
  avgCostSharePct: number;
  avgLlmCalls: number;
  avgThinkingTokens: number;
  peakCostCount: number;
}

export function computeStageBottleneckMatrix(runs: AnalyzedRun[]): StageBottleneckSummary[] {
  const runsWithSlices = runs.filter(
    (r) => r.data.sliceBreakdown && r.data.sliceBreakdown.length > 0
  );

  return STAGE_IDS.map((stageId) => {
    const passCount = runs.filter((r) => r.stages[stageId].completed).length;
    const totalRuns = runs.length;
    const passRatePct = totalRuns > 0 ? Math.round((passCount / totalRuns) * 100) : 0;

    const sliceSample = runsWithSlices.filter((r) => r.stages[stageId].llmCalls > 0);
    const denom = sliceSample.length || 1;

    const avgCallSharePct =
      sliceSample.length > 0
        ? Number(
            (
              sliceSample.reduce((s, r) => s + r.stages[stageId].callSharePct, 0) / denom
            ).toFixed(1)
          )
        : 0;
    const avgCostSharePct =
      sliceSample.length > 0
        ? Number(
            (
              sliceSample.reduce((s, r) => s + r.stages[stageId].costSharePct, 0) / denom
            ).toFixed(1)
          )
        : 0;
    const avgLlmCalls =
      sliceSample.length > 0
        ? Math.round(sliceSample.reduce((s, r) => s + r.stages[stageId].llmCalls, 0) / denom)
        : 0;
    const avgThinkingTokens =
      sliceSample.length > 0
        ? Math.round(
            sliceSample.reduce((s, r) => s + r.stages[stageId].thinkingTokens, 0) / denom
          )
        : 0;
    const peakCostCount = runsWithSlices.filter((r) => r.stages[stageId].isPeakCost).length;

    return {
      stageId,
      passCount,
      totalRuns,
      passRatePct,
      avgCallSharePct,
      avgCostSharePct,
      avgLlmCalls,
      avgThinkingTokens,
      peakCostCount,
    };
  });
}

export interface AblationPreset {
  id: string;
  category: 'harness' | 'effort' | 'model';
  badge: string;
  title: string;
  subtitle: string;
  runAId: string;
  runBId: string;
  findingHeadline: string;
}

export function discoverAblationPresets(runs: AnalyzedRun[]): AblationPreset[] {
  const byId = new Map(runs.map((r) => [r.id, r]));
  const presets: AblationPreset[] = [];

  // 1. Harness Ablation: Pi vs Codex CLI on gpt-6-sol (High)
  const piGpt6 = runs.find(
    (r) => r.displayHarness === 'Pi' && r.data.model === 'gpt-6-sol'
  );
  const codexGpt6 = runs.find(
    (r) => r.displayHarness === 'Codex CLI' && r.data.model === 'gpt-6-sol'
  );
  if (piGpt6 && codexGpt6) {
    const tokenReductionPct = Math.round(
      ((codexGpt6.tokens.total - piGpt6.tokens.total) / codexGpt6.tokens.total) * 100
    );
    const costReductionPct = Math.round(
      ((codexGpt6.data.costUsd - piGpt6.data.costUsd) / codexGpt6.data.costUsd) * 100
    );
    presets.push({
      id: 'harness-gpt6-sol',
      category: 'harness',
      badge: 'HARNESS ABLATION',
      title: 'Pi vs. Codex CLI (gpt-6-sol · High)',
      subtitle: 'Same model & effort, different coding harness & tool schema',
      runAId: piGpt6.id,
      runBId: codexGpt6.id,
      findingHeadline: `Pi used ${tokenReductionPct}% fewer tokens and ${costReductionPct}% lower cost ($${piGpt6.data.costUsd.toFixed(2)} vs $${codexGpt6.data.costUsd.toFixed(2)}) by capping peak context at 74.4k vs 135k.`,
    });
  }

  // 2. Effort Scaling: ZCode glm-5.3-flash High vs Low (and High vs Max)
  const flashHigh = runs.find(
    (r) => r.data.model === 'glm-5.3-flash' && r.data.effort?.toLowerCase() === 'high'
  );
  const flashLow = runs.find(
    (r) => r.data.model === 'glm-5.3-flash' && r.data.effort?.toLowerCase() === 'low'
  );
  const flashMax = runs.find(
    (r) => r.data.model === 'glm-5.3-flash' && r.data.effort?.toLowerCase() === 'max'
  );
  if (flashHigh && flashLow) {
    presets.push({
      id: 'effort-glm-flash-high-vs-low',
      category: 'effort',
      badge: 'EFFORT SCALING',
      title: 'ZCode / glm-5.3-flash: High vs. Low Effort',
      subtitle: 'Higher reasoning effort reduced total turns and saved both time & money',
      runAId: flashHigh.id,
      runBId: flashLow.id,
      findingHeadline: `High effort passed 7/7 in 190 calls ($0.87, 71m), whereas Low effort spiraled in S3 (156 calls) to 344 total calls ($1.10, 111m) and missed S5.`,
    });
  }
  if (flashHigh && flashMax) {
    presets.push({
      id: 'effort-glm-flash-high-vs-max',
      category: 'effort',
      badge: 'EFFORT SCALING',
      title: 'ZCode / glm-5.3-flash: High vs. Max Effort',
      subtitle: 'Testing diminishing returns at Max reasoning budget',
      runAId: flashHigh.id,
      runBId: flashMax.id,
      findingHeadline: `Max effort nearly doubled token volume (51.95M vs 25.80M) and cost ($1.70 vs $0.87) while introducing an S5 spec miss.`,
    });
  }

  // 3. Model Generation: Pi gpt-6.1-sol vs gpt-6-sol
  const piGpt61 = runs.find(
    (r) => r.displayHarness === 'Pi' && r.data.model === 'gpt-6.1-sol'
  );
  if (piGpt61 && piGpt6) {
    presets.push({
      id: 'model-gpt61-vs-gpt6',
      category: 'model',
      badge: 'MODEL GENERATION',
      title: 'Pi: gpt-6.1-sol vs. gpt-6-sol (High)',
      subtitle: '95% vs 90% prompt cache discount + deeper 23-test suite',
      runAId: piGpt61.id,
      runBId: piGpt6.id,
      findingHeadline: `gpt-6.1-sol cut 7/7 run cost by 20% ($1.37 vs $1.72) despite +14% more tokens thanks to 95% cache read discount ($0.10/1M vs $0.20/1M).`,
    });
  }

  // 4. Model Family Tier: ZCode glm-5.3-flash (High) vs glm-5.3 (High)
  const glmFlagshipHigh = runs.find(
    (r) => r.data.model === 'glm-5.3' && r.data.effort?.toLowerCase() === 'high'
  );
  if (flashHigh && glmFlagshipHigh) {
    presets.push({
      id: 'model-glm-flash-vs-flagship',
      category: 'model',
      badge: 'FLASH VS FLAGSHIP',
      title: 'ZCode: glm-5.3-flash vs. glm-5.3 (High)',
      subtitle: 'Comparing Flash vs Flagship tier on identical 7/7 spec completion',
      runAId: flashHigh.id,
      runBId: glmFlagshipHigh.id,
      findingHeadline: `Both achieved 7/7 spec completion, but glm-5.3-flash finished 25m faster at 14.8x lower cost ($0.87 vs $12.90).`,
    });
  }

  // 5. Pareto Frontier Leaders: Muse Spark 1.3 Contributor vs Codex CLI gpt-6-sol
  const museSpark = byId.get('pi-muse-spark-1-3-contrib-high-20261026-0535');
  if (museSpark && codexGpt6) {
    presets.push({
      id: 'pareto-cost-vs-speed',
      category: 'model',
      badge: 'PARETO EXTREMES',
      title: 'Lowest Cost Leader ($0.14) vs. Fastest 7/7 Leader (25m)',
      subtitle: 'Pi / muse-spark-1.3-contributor vs. Codex CLI / gpt-6-sol',
      runAId: museSpark.id,
      runBId: codexGpt6.id,
      findingHeadline: `Muse Spark achieved 7/7 for $0.14 (56m, 85 tests), while Codex CLI / gpt-6-sol finished 2.2x faster (25m) at $3.14.`,
    });
  }

  return presets;
}
