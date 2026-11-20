import {
  computeLensFrontier,
  computeOutcomePlotY,
  getRunLensCost,
  isOffPeakDiscountRun,
  isZeroCostPromoRun,
  placeScatterLabels,
  type AnalyzedRun,
  type FrontierViewMode,
  type LensFrontierResult,
  type PlacedScatterLabel,
  type PricingLens,
  type ScatterLabelInput,
} from './telemetry.ts';

export interface FrontierPlotPoint {
  id: string;
  harness: string;
  harnessSlug: string;
  model: string;
  effort: string;
  provider: string;
  completed: number;
  total: number;
  isFullPass: boolean;
  durationMinutes: number;
  lensCostUsd: number;
  billedCostUsd: number;
  standardCostUsd: number;
  uncachedCostUsd: number;
  tokensTotal: string;
  cacheHitRatePct: number;
  testsLabel: string;
  isZeroCostPromo: boolean;
  isOffPeak: boolean;
  pricingBadge: string | null;
  pricingNote: string | null;
  isFrontier: boolean;
  frontierOrder: number | null;
  dominatedByCount: number;
  cx: number;
  cy: number;
  inPromoGutter: boolean;
  shortLabel: string;
}

export interface FrontierAxisTick {
  value: number;
  pos: number;
  label: string;
}

export interface FrontierQuadrantOverlay {
  xCut: number | null;
  yCut: number | null;
  xCutLabel: string;
  yCutLabel: string;
  zones: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    anchor: 'start' | 'end';
  }>;
}

export interface FrontierPlotModel {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  paidXStart: number;
  promoGutterCenter: number | null;
  promoBreakX: number | null;
  lens: PricingLens;
  mode: FrontierViewMode;
  includeZeroCostPromos: boolean;
  frontier: LensFrontierResult;
  points: FrontierPlotPoint[];
  hiddenPromoPoints: FrontierPlotPoint[];
  labels: PlacedScatterLabel[];
  xTicks: FrontierAxisTick[];
  yTicks: FrontierAxisTick[];
  frontierStepPath: string;
  passGateY: number | null;
  quadrant: FrontierQuadrantOverlay;
}

const CHART_W = 760;
const CHART_H = 360;
const PAD_L = 62;
const PAD_R = 26;
const PAD_T = 28;
const PAD_B = 46;

const LOG_COST_TICKS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

export function formatShortCostTick(val: number): string {
  if (val < 1) return `$${val.toFixed(2)}`;
  if (Number.isInteger(val)) return `$${val}`;
  return `$${val.toFixed(2)}`;
}

export function formatShortModelLabel(harness: string, model: string): string {
  const compactModel = model
    .replace('-contributor', '')
    .replace('gemini-3.8-flash-high', 'gem-3.8-flash')
    .replace('gemini-4-', 'gem-4-')
    .replace('inkling-2-small-free', 'inkling-2-sm')
    .replace('deepseek-v4-flash', 'ds-v4-flash')
    .replace('deepseek-flash', 'ds-flash')
    .replace('subq-savant-1.4', 'savant-1.4');
  const compactHarness = harness
    .replace('Antigravity CLI', 'AGY')
    .replace('Codex CLI', 'Codex')
    .replace('DeepSeek Harness', 'DSH')
    .replace('Muse Code', 'Muse')
    .replace('OpenCode', 'OC');
  return `${compactHarness}/${compactModel}`;
}

export function buildFrontierPlotModel(
  runs: AnalyzedRun[],
  options: {
    lens: PricingLens;
    mode: FrontierViewMode;
    includeZeroCostPromos?: boolean;
    highlightedIds?: ReadonlySet<string>;
  }
): FrontierPlotModel {
  const {
    lens,
    mode,
    includeZeroCostPromos = false,
    highlightedIds = new Set<string>(),
  } = options;

  const frontier = computeLensFrontier(runs, { lens, includeZeroCostPromos });
  const frontierSet = new Set(frontier.frontierIds);

  const visibleRuns =
    mode === 'speed-7-of-7' ? runs.filter((r) => r.plan.ratio === 1) : runs;

  const promoRunsInView = visibleRuns.filter((r) => isZeroCostPromoRun(r, lens));
  const paidRunsInView = visibleRuns.filter((r) => !isZeroCostPromoRun(r, lens));

  const showPromoGutter = includeZeroCostPromos && promoRunsInView.length > 0;
  const promoGutterW = showPromoGutter ? 78 : 0;
  const paidXStart = PAD_L + promoGutterW;
  const paidXEnd = CHART_W - PAD_R;
  const paidPlotW = paidXEnd - paidXStart;
  const plotH = CHART_H - PAD_T - PAD_B;

  const paidCosts = paidRunsInView.map((r) => getRunLensCost(r, lens)).filter((c) => c > 0);
  const rawMinCost = paidCosts.length > 0 ? Math.min(...paidCosts) : 0.1;
  const rawMaxCost = paidCosts.length > 0 ? Math.max(...paidCosts) : 15;
  const minLog = Math.log10(Math.max(0.05, rawMinCost * 0.78));
  const maxLog = Math.log10(Math.max(rawMaxCost * 1.28, rawMinCost * 2));
  const logSpan = Math.max(0.25, maxLog - minLog);

  const toPaidX = (costUsd: number): number => {
    const safe = Math.max(1e-4, costUsd);
    const t = (Math.log10(safe) - minLog) / logSpan;
    return Number((paidXStart + Math.max(0, Math.min(1, t)) * paidPlotW).toFixed(1));
  };

  // Y mapping: in both modes, BETTER is HIGHER (smaller SVG y)
  const durations = visibleRuns.map((r) => r.data.durationMinutes);
  const minDurDomain = Math.max(0, Math.floor((Math.min(...durations, 20) - 5) / 10) * 10);
  const maxDurDomain = Math.max(110, Math.ceil((Math.max(...durations, 100) + 8) / 10) * 10);
  const durSpan = Math.max(20, maxDurDomain - minDurDomain);

  const toSpeedY = (durMin: number): number => {
    // Faster (smaller duration) -> near PAD_T; slower -> near PAD_T + plotH
    const t = (durMin - minDurDomain) / durSpan;
    return Number((PAD_T + Math.max(0, Math.min(1, t)) * plotH).toFixed(1));
  };

  const outcomeMin = 3.5;
  const outcomeMax = 7.5;
  const toOutcomeY = (val: number): number => {
    const t = (outcomeMax - val) / (outcomeMax - outcomeMin);
    return Number((PAD_T + Math.max(0, Math.min(1, t)) * plotH).toFixed(1));
  };

  const promoGutterCenter = showPromoGutter ? Number((PAD_L + 34).toFixed(1)) : null;
  const promoBreakX = showPromoGutter ? Number((PAD_L + 68).toFixed(1)) : null;

  const toPoint = (r: AnalyzedRun, inPromoGutter: boolean): FrontierPlotPoint => {
    const lensCost = getRunLensCost(r, lens);
    const isPromo = lensCost <= 0;
    const isFront = frontierSet.has(r.id);
    const cx = inPromoGutter ? (promoGutterCenter ?? PAD_L + 24) : toPaidX(lensCost);
    const cy =
      mode === 'speed-7-of-7'
        ? toSpeedY(r.data.durationMinutes)
        : toOutcomeY(computeOutcomePlotY(r, runs));

    return {
      id: r.id,
      harness: r.displayHarness,
      harnessSlug: r.data.codingHarness,
      model: r.data.model,
      effort: r.data.effort ?? 'Standard',
      provider: r.displayProvider,
      completed: r.plan.completed,
      total: r.plan.total,
      isFullPass: r.plan.ratio === 1,
      durationMinutes: r.data.durationMinutes,
      lensCostUsd: lensCost,
      billedCostUsd: r.data.costUsd,
      standardCostUsd: r.costMetrics.standardApiCostUsd,
      uncachedCostUsd: r.costMetrics.uncachedCounterfactualCostUsd,
      tokensTotal: r.data.tokens?.total ?? '—',
      cacheHitRatePct: r.tokens.cacheHitRatePct,
      testsLabel: r.data.tests ? `${r.data.tests.passed}/${r.data.tests.total}` : '—',
      isZeroCostPromo: isPromo,
      isOffPeak: isOffPeakDiscountRun(r),
      pricingBadge: r.costMetrics.profile?.pricingBadge ?? null,
      pricingNote: r.costMetrics.profile?.pricingStatusNote ?? null,
      isFrontier: isFront,
      frontierOrder: frontier.frontierOrderById[r.id] ?? null,
      dominatedByCount: frontier.dominatedByById[r.id]?.length ?? 0,
      cx,
      cy,
      inPromoGutter,
      shortLabel: formatShortModelLabel(r.displayHarness, r.data.model),
    };
  };

  const paidPoints = paidRunsInView.map((r) => toPoint(r, false));
  const promoPoints = promoRunsInView.map((r) => toPoint(r, true));
  const points = showPromoGutter ? [...promoPoints, ...paidPoints] : paidPoints;
  const hiddenPromoPoints = showPromoGutter ? [] : promoPoints;

  // Stepped Pareto frontier path (ordered left->right by cost, stepping upward as speed improves)
  const frontierPts = points
    .filter((p) => p.isFrontier)
    .sort((a, b) => (a.frontierOrder ?? 99) - (b.frontierOrder ?? 99));

  let frontierStepPath = '';
  if (frontierPts.length >= 2) {
    const segs: string[] = [`M ${frontierPts[0].cx} ${frontierPts[0].cy}`];
    for (let i = 1; i < frontierPts.length; i++) {
      // Step horizontally in cost, then vertically in speed/outcome
      segs.push(`L ${frontierPts[i].cx} ${frontierPts[i - 1].cy}`);
      segs.push(`L ${frontierPts[i].cx} ${frontierPts[i].cy}`);
    }
    frontierStepPath = segs.join(' ');
  }

  // Deterministic non-overlapping labels
  const labelInputs: ScatterLabelInput[] = points.map((p) => {
    const isHl = highlightedIds.has(p.id);
    let priority = 10;
    if (isHl) priority = 100;
    else if (p.isFrontier) priority = 80 - (p.frontierOrder ?? 0);
    else if (p.inPromoGutter) priority = 65;
    else if (p.isFullPass && p.lensCostUsd === Math.max(...paidCosts)) priority = 50;
    else if (p.isFullPass && p.lensCostUsd <= 1.0) priority = 55;
    else if (!p.isFullPass && p.durationMinutes <= 22) priority = 45;
    else if (p.isFullPass) priority = 25;

    const costTag = p.isZeroCostPromo ? '$0' : formatShortCostTick(p.lensCostUsd);
    const text = p.isFrontier
      ? `F${p.frontierOrder} ${p.shortLabel} (${costTag})`
      : `${p.shortLabel} (${costTag})`;

    return {
      id: p.id,
      text,
      cx: p.cx,
      cy: p.cy,
      priority,
      required: isHl || p.isFrontier,
    };
  });

  const labels = placeScatterLabels(
    labelInputs,
    {
      xMin: PAD_L + 4,
      xMax: CHART_W - PAD_R - 2,
      yMin: PAD_T + 8,
      yMax: CHART_H - PAD_B - 4,
    },
    points.map((p) => ({ cx: p.cx, cy: p.cy, r: p.isFrontier ? 7 : 5 }))
  );

  // Axis ticks
  const xTicks: FrontierAxisTick[] = LOG_COST_TICKS.filter((t) => {
    const lt = Math.log10(t);
    return lt >= minLog - 0.02 && lt <= maxLog + 0.02;
  }).map((val) => ({
    value: val,
    pos: toPaidX(val),
    label: formatShortCostTick(val),
  }));

  let yTicks: FrontierAxisTick[];
  let passGateY: number | null = null;
  if (mode === 'speed-7-of-7') {
    const step = durSpan > 90 ? 20 : 15;
    const ticks: FrontierAxisTick[] = [];
    for (let d = Math.ceil(minDurDomain / step) * step; d <= maxDurDomain; d += step) {
      ticks.push({ value: d, pos: toSpeedY(d), label: `${d}m` });
    }
    yTicks = ticks;
  } else {
    yTicks = [7, 6, 5, 4].map((st) => ({
      value: st,
      pos: toOutcomeY(st),
      label: `${st}/7`,
    }));
    passGateY = toOutcomeY(6.5);
  }

  // Honest threshold-anchored quadrant overlay
  const medCost = frontier.thresholds.medianPaid7of7CostUsd;
  const medDur = frontier.thresholds.medianPaid7of7DurationMinutes;
  const xCut = medCost !== null && medCost > 0 ? toPaidX(medCost) : null;
  const yCut =
    mode === 'speed-7-of-7'
      ? medDur !== null
        ? toSpeedY(medDur)
        : null
      : passGateY;

  const xCutLabel = medCost !== null ? `Median 7/7 cost: ${formatShortCostTick(medCost)}` : '';
  const yCutLabel =
    mode === 'speed-7-of-7'
      ? medDur !== null
        ? `Median 7/7 time: ${Math.round(medDur)}m`
        : ''
      : '7/7 pass gate';

  const zones: FrontierQuadrantOverlay['zones'] = [];
  if (xCut !== null && yCut !== null) {
    if (mode === 'speed-7-of-7') {
      zones.push(
        { id: 'tl', label: 'Fast & low-cost', x: paidXStart + 8, y: PAD_T + 14, anchor: 'start' },
        { id: 'tr', label: 'Fast & premium', x: paidXEnd - 8, y: PAD_T + 14, anchor: 'end' },
        { id: 'bl', label: 'Slow & low-cost', x: paidXStart + 8, y: CHART_H - PAD_B - 8, anchor: 'start' },
        { id: 'br', label: 'Slow & premium', x: paidXEnd - 8, y: CHART_H - PAD_B - 8, anchor: 'end' }
      );
    } else {
      zones.push(
        { id: 'tl', label: '7/7 · below median cost', x: paidXStart + 8, y: PAD_T + 14, anchor: 'start' },
        { id: 'tr', label: '7/7 · above median cost', x: paidXEnd - 8, y: PAD_T + 14, anchor: 'end' },
        { id: 'bl', label: 'Partial (<7/7) · low cost', x: paidXStart + 8, y: CHART_H - PAD_B - 8, anchor: 'start' },
        { id: 'br', label: 'Partial (<7/7) · higher cost', x: paidXEnd - 8, y: CHART_H - PAD_B - 8, anchor: 'end' }
      );
    }
  }

  return {
    width: CHART_W,
    height: CHART_H,
    padL: PAD_L,
    padR: PAD_R,
    padT: PAD_T,
    padB: PAD_B,
    paidXStart,
    promoGutterCenter,
    promoBreakX,
    lens,
    mode,
    includeZeroCostPromos: showPromoGutter,
    frontier,
    points,
    hiddenPromoPoints,
    labels,
    xTicks,
    yTicks,
    frontierStepPath,
    passGateY,
    quadrant: {
      xCut,
      yCut,
      xCutLabel,
      yCutLabel,
      zones,
    },
  };
}
