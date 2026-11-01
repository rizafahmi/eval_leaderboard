import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeAndRankRuns,
  computeStageBottleneckMatrix,
  discoverAblationPresets,
  type RunRecordData,
} from '../src/utils/telemetry.ts';
import { computeCostEconometrics } from '../src/data/pricing.ts';
import {
  buildRunRecordFromEvents,
  parseRawTranscriptJsonl,
} from '../scripts/ingest-run.ts';

const RUNS_DIR = path.resolve(process.cwd(), 'src/content/runs');

function loadAllRunRecords(): Array<{ id: string; file: string; data: RunRecordData }> {
  const files = fs
    .readdirSync(RUNS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf8');
    return {
      id: file.replace(/\.json$/, ''),
      file,
      data: JSON.parse(raw) as RunRecordData,
    };
  });
}

test('All benchmark run JSONs satisfy token, slice, step-range, and cost conservation laws', async (t) => {
  const runs = loadAllRunRecords();
  assert.ok(runs.length >= 12, `Expected at least 12 runs, found ${runs.length}`);

  for (const run of runs) {
    await t.test(`Run conservation audit: ${run.id}`, () => {
      const { data } = run;

      // 1. Exact numeric tokenCounts must exist and satisfy uncached + cached + output === total
      assert.ok(data.tokenCounts, `${run.id}: missing tokenCounts`);
      const tc = data.tokenCounts!;
      assert.equal(
        tc.uncachedInput + tc.cachedInput + tc.output,
        tc.total,
        `${run.id}: uncachedInput (${tc.uncachedInput}) + cachedInput (${tc.cachedInput}) + output (${tc.output}) !== total (${tc.total})`
      );

      // 2. Cache hit rate must equal cachedInput / (uncachedInput + cachedInput) within 0.05%
      const promptTotal = tc.uncachedInput + tc.cachedInput;
      const expectedCacheHitPct = (tc.cachedInput / promptTotal) * 100;
      assert.ok(
        Math.abs(expectedCacheHitPct - tc.cacheHitRatePct) <= 0.05,
        `${run.id}: cacheHitRatePct ${tc.cacheHitRatePct} diverges from computed ${expectedCacheHitPct.toFixed(2)}`
      );

      // 3. Verification holdout summary must match planCompletion S1..S7
      assert.ok(data.verification, `${run.id}: missing verification block`);
      const sKeys = Object.keys(data.planCompletion);
      const passedCount = Object.values(data.planCompletion).filter(Boolean).length;
      assert.equal(data.verification!.holdoutPassed, passedCount);
      assert.equal(data.verification!.holdoutTotal, sKeys.length);

      // 4. Pricing catalog consistency: billedCostUsd from pricing catalog matches recorded costUsd within $0.02
      const econ = computeCostEconometrics(tc, data.model, data.costUsd);
      assert.ok(econ.profile, `${run.id}: model "${data.model}" missing from pricing catalog`);
      assert.ok(
        Math.abs(econ.billedCostUsd - data.costUsd) <= 0.02,
        `${run.id}: catalog billedCostUsd ($${econ.billedCostUsd}) diverges from recorded costUsd ($${data.costUsd})`
      );

      // 5. Slice breakdown conservation: LLM calls, contiguous step ranges, and slice cost sum
      if (data.sliceBreakdown && data.sliceBreakdown.length > 0) {
        const sliceCallsSum = data.sliceBreakdown.reduce((sum, s) => sum + s.llmCalls, 0);
        if (data.calls?.llmCalls !== undefined) {
          assert.equal(
            sliceCallsSum,
            data.calls.llmCalls,
            `${run.id}: slice llmCalls sum (${sliceCallsSum}) !== calls.llmCalls (${data.calls.llmCalls})`
          );
        }

        const sliceCostSum = data.sliceBreakdown.reduce((sum, s) => sum + s.costUsd, 0);
        assert.ok(
          Math.abs(sliceCostSum - data.costUsd) <= 0.03,
          `${run.id}: slice costUsd sum ($${sliceCostSum.toFixed(2)}) diverges from recorded costUsd ($${data.costUsd.toFixed(2)})`
        );

        // Verify stepRange contiguity [1..N]
        let expectedNextStart = 1;
        for (const slice of data.sliceBreakdown) {
          const match = slice.stepRange.trim().match(/^(\d+)\s*[–-]\s*(\d+)$/);
          assert.ok(match, `${run.id}: invalid stepRange format "${slice.stepRange}"`);
          const start = Number(match[1]);
          const end = Number(match[2]);
          assert.ok(end >= start, `${run.id}: stepRange end (${end}) < start (${start})`);
          assert.equal(
            start,
            expectedNextStart,
            `${run.id}: stepRange "${slice.stepRange}" starts at ${start}, expected ${expectedNextStart} (gap or overlap)`
          );
          expectedNextStart = end + 1;
        }
      }
    });
  }
});

test('Pareto frontier, stage bottleneck matrix, and ablation presets compute deterministically', () => {
  const rawRuns = loadAllRunRecords();
  const analyzed = analyzeAndRankRuns(rawRuns);

  const frontier = analyzed.filter((r) => r.isParetoFrontier);
  assert.ok(frontier.length >= 2, 'Expected at least 2 runs on the 7/7 Pareto frontier');

  // Every frontier run must be a 7/7 full pass and non-dominated by any other 7/7 run
  for (const fRun of frontier) {
    assert.equal(fRun.plan.ratio, 1, `Frontier run ${fRun.id} must be 7/7 full pass`);
    assert.equal(fRun.dominatedBy.length, 0);
  }

  // Muse Spark ($0.14, 56m) and Codex CLI gpt-6-sol ($3.14, 25m) must both be on the frontier
  const frontierIds = new Set(frontier.map((r) => r.id));
  assert.ok(
    frontierIds.has('pi-muse-spark-1-3-contrib-high-20261026-0535'),
    'Lowest cost 7/7 run (Muse Spark) must be on the Pareto frontier'
  );
  assert.ok(
    frontierIds.has('codex-cli-gpt-6-sol-high-20261025-1935'),
    'Fastest 7/7 run (Codex CLI gpt-6-sol) must be on the Pareto frontier'
  );

  const matrix = computeStageBottleneckMatrix(analyzed);
  assert.equal(matrix.length, 7);
  assert.deepEqual(
    matrix.map((m) => m.stageId),
    ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']
  );

  const ablations = discoverAblationPresets(analyzed);
  assert.ok(ablations.length >= 4, 'Expected at least 4 controlled ablation presets');
});

test('Raw JSONL transcript ingestion parses turns and builds a valid RunRecordData entry', () => {
  const sampleJsonl = [
    JSON.stringify({
      step_index: 1,
      type: 'PLANNER_RESPONSE',
      usage: {
        uncached_input_tokens: 10000,
        cache_read_input_tokens: 0,
        output_tokens: 500,
        thinking_tokens: 200,
      },
    }),
    JSON.stringify({
      step_index: 2,
      type: 'TOOL_RESULT',
      tool_name: 'run_command',
      status: 'DONE',
    }),
    JSON.stringify({
      step_index: 3,
      type: 'PLANNER_RESPONSE',
      usage: {
        uncached_input_tokens: 2000,
        cache_read_input_tokens: 10000,
        output_tokens: 300,
        thinking_tokens: 100,
      },
    }),
  ].join('\n');

  const events = parseRawTranscriptJsonl(sampleJsonl);
  assert.equal(events.length, 3);

  const record = buildRunRecordFromEvents({
    events,
    codingHarness: 'Antigravity CLI',
    model: 'gemini-3.8-flash-high',
    effort: 'High',
    provider: 'Gemini',
    timestamp: '2026-10-26T10:00:00Z',
    durationMinutes: 12,
    planCompletion: {
      S1: true,
      S2: true,
      S3: false,
      S4: false,
      S5: false,
      S6: false,
      S7: false,
    },
  });

  assert.equal(record.tokenCounts?.uncachedInput, 12000);
  assert.equal(record.tokenCounts?.cachedInput, 10000);
  assert.equal(record.tokenCounts?.output, 800);
  assert.equal(record.tokenCounts?.thinking, 300);
  assert.equal(record.tokenCounts?.total, 22800);
  assert.equal(record.calls?.llmCalls, 2);
  assert.equal(record.calls?.toolCalls?.total, 1);
  assert.equal(record.verification?.holdoutPassed, 2);
  assert.equal(record.verification?.holdoutVerdict, 'partial-pass');
});
