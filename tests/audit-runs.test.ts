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
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import {
  MAX_COMMIT_LOG_ENTRIES,
  buildRunRecordFromEvents,
  parseRawTranscriptJsonl,
  readGitCommitsFromRepo,
} from '../scripts/ingest-run.ts';
import {
  BENCHMARK_AGENTS_MD,
  BENCHMARK_PLAN,
  BENCHMARK_PROMPT,
  BENCHMARK_README_CONTRACT,
} from '../src/data/benchmark.ts';

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

      // 3. Verification holdout summary must match planCompletion S1..S7 and track agentPlanCompletion divergences
      assert.ok(data.verification, `${run.id}: missing verification block`);
      const sKeys = Object.keys(data.planCompletion);
      const passedCount = Object.values(data.planCompletion).filter(Boolean).length;
      assert.equal(data.verification!.holdoutPassed, passedCount);
      assert.equal(data.verification!.holdoutTotal, sKeys.length);
      if (data.agentPlanCompletion) {
        const claimedCount = Object.values(data.agentPlanCompletion).filter(Boolean).length;
        assert.equal(data.verification!.agentClaimedPassed, claimedCount);
        const expectedUnverified = sKeys.filter(
          (k) => Boolean(data.agentPlanCompletion?.[k]) && !data.planCompletion[k]
        );
        assert.deepEqual(data.verification!.unverifiedSlices ?? [], expectedUnverified);
      }
      if (data.commitLog && data.commits !== undefined) {
        const nonInitCommits = data.commitLog.filter(
          (c, idx, arr) => !(idx === arr.length - 1 && /^init$/i.test(c.message.trim()))
        ).length;
        if (data.commitLog.length < MAX_COMMIT_LOG_ENTRIES) {
          assert.equal(
            data.commits,
            nonInitCommits,
            `${run.id}: commits (${data.commits}) !== non-init commitLog count (${nonInitCommits})`
          );
        } else {
          assert.ok(
            data.commits >= nonInitCommits,
            `${run.id}: commits (${data.commits}) < truncated non-init commitLog count (${nonInitCommits})`
          );
        }
      }

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
  const publishedRuns = rawRuns.filter((r) => r.data.published !== false);
  const analyzed = analyzeAndRankRuns(publishedRuns);
  const byId = new Map(analyzed.map((r) => [r.id, r]));

  const frontier = analyzed.filter((r) => r.isParetoFrontier);
  assert.ok(frontier.length >= 2, 'Expected at least 2 runs on the 7/7 Pareto frontier');

  // Every frontier run must be a 7/7 full pass and non-dominated by any other 7/7 run
  for (const fRun of frontier) {
    assert.equal(fRun.plan.ratio, 1, `Frontier run ${fRun.id} must be 7/7 full pass`);
    assert.equal(fRun.dominatedBy.length, 0);
  }

  // OpenCode hy4-flash-free ($0.00, 45m) and Codex CLI gpt-6-sol ($3.14, 25m) must both be on the frontier
  const frontierIds = new Set(frontier.map((r) => r.id));
  assert.ok(
    frontierIds.has('opencode-hy4-flash-free-high-20261117-0755'),
    'Lowest cost 7/7 run (OpenCode hy4-flash-free: $0.00, 45m) must be on the Pareto frontier'
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
  assert.ok(ablations.length >= 8, `Expected at least 8 published ablation presets, found ${ablations.length}`);

  for (const preset of ablations) {
    assert.ok(byId.has(preset.runAId), `Preset ${preset.id} references missing/unpublished runAId ${preset.runAId}`);
    assert.ok(byId.has(preset.runBId), `Preset ${preset.id} references missing/unpublished runBId ${preset.runBId}`);
  }

  const musePreset = ablations.find((p) => p.id === 'harness-muse-spark-1-3-contrib');
  assert.ok(musePreset, 'Missing harness-muse-spark-1-3-contrib preset');
  assert.ok(
    musePreset.findingHeadline.includes('57/57 tests') && musePreset.findingHeadline.includes('37.69M tokens'),
    `Muse Spark preset headline must reflect actual Pi telemetry (57/57 tests, 37.69M tokens): ${musePreset.findingHeadline}`
  );

  const paretoPreset = ablations.find((p) => p.id === 'pareto-cost-vs-speed');
  assert.ok(paretoPreset, 'Missing pareto-cost-vs-speed preset');
  assert.ok(
    frontierIds.has(paretoPreset.runAId) && frontierIds.has(paretoPreset.runBId),
    `pareto-cost-vs-speed runs (${paretoPreset.runAId}, ${paretoPreset.runBId}) must both lie on the Pareto frontier`
  );
});

test('Default ranking prioritizes completion, then time, with tests and cost breaking ties', () => {
  const makeRun = (
    id: string,
    completed: number,
    durationMinutes: number,
    costUsd: number,
    passed: number
  ): { id: string; data: RunRecordData } => ({
    id,
    data: {
      timestamp: '2026-11-12T00:00:00Z',
      codingHarness: 'Pi',
      model: 'gpt-6-sol',
      provider: 'OpenAI',
      durationMinutes,
      costUsd,
      tests: { passed, total: 10 },
      planCompletion: Object.fromEntries(
        Array.from({ length: 7 }, (_, index) => [`S${index + 1}`, index < completed])
      ),
    },
  });
  const ranked = analyzeAndRankRuns([
    makeRun('fast-four-stages', 4, 0.5, 0, 10),
    makeRun('slow-complete', 7, 100, 0, 10),
    makeRun('equal-time-costly', 7, 40, 5, 5),
    makeRun('fast-six-stages', 6, 1, 0, 10),
    makeRun('equal-time-cheap', 7, 40, 1, 5),
    makeRun('fast-complete', 7, 25, 5, 5),
    makeRun('equal-time-strong-tests', 7, 40, 5, 10),
  ]);

  assert.deepEqual(ranked.map((run) => run.id), [
    'fast-complete',
    'equal-time-strong-tests',
    'equal-time-cheap',
    'equal-time-costly',
    'slow-complete',
    'fast-six-stages',
    'fast-four-stages',
  ]);
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

test('buildRunRecordFromEvents rejects uncataloged models without explicit costUsd and accepts explicit costUsd override', () => {
  const events = parseRawTranscriptJsonl(
    JSON.stringify({
      step_index: 1,
      type: 'PLANNER_RESPONSE',
      usage: {
        uncached_input_tokens: 5000,
        cache_read_input_tokens: 0,
        output_tokens: 250,
      },
    })
  );

  assert.throws(
    () =>
      buildRunRecordFromEvents({
        events,
        codingHarness: 'Pi',
        model: 'unknown-model',
        provider: 'Unknown',
        timestamp: '2026-11-18T00:00:00Z',
        durationMinutes: 10,
      }),
    /not in MODEL_PRICING_CATALOG/
  );

  const pricedRecord = buildRunRecordFromEvents({
    events,
    codingHarness: 'Pi',
    model: 'unknown-model',
    provider: 'Unknown',
    timestamp: '2026-11-18T00:00:00Z',
    durationMinutes: 10,
    costUsd: 1.75,
  });
  assert.equal(pricedRecord.costUsd, 1.75);
});

test('readGitCommitsFromRepo and buildRunRecordFromEvents preserve early slices and full commit count beyond 25 commits', () => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'capybench-git-test-'));
  try {
    execFileSync('git', ['init'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'user.name', 'Test Agent'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'user.email', 'agent@example.com'], { cwd: tmpRepo });

    const makeCommit = (message: string) => {
      execFileSync('git', ['commit', '--allow-empty', '-m', message], { cwd: tmpRepo });
    };

    makeCommit('init');
    makeCommit('S1: URL normalization and parsing');
    makeCommit('S2: HTTP client and redirect handling');
    for (let i = 1; i <= 28; i += 1) {
      makeCommit(`chore: intermediate refactor step ${i}`);
    }

    const commits = readGitCommitsFromRepo(tmpRepo);
    assert.ok(commits, 'Expected commits array from readGitCommitsFromRepo');
    assert.equal(commits.length, 31, 'Expected all 31 commits (init + 30 agent commits)');

    const record = buildRunRecordFromEvents({
      events: [],
      codingHarness: 'Codex CLI',
      model: 'gpt-6-sol',
      provider: 'OpenAI Codex',
      timestamp: '2026-11-18T00:00:00Z',
      durationMinutes: 30,
      commits,
    });

    assert.equal(record.commits, 30, 'Full non-init agent commit count must be preserved');
    assert.equal(record.planCompletion.S1, true, 'Early S1 commit beyond top 25 must be matched');
    assert.equal(record.planCompletion.S2, true, 'Early S2 commit beyond top 25 must be matched');
    assert.equal(
      record.commitLog?.length,
      MAX_COMMIT_LOG_ENTRIES,
      `Stored commitLog must be truncated to ${MAX_COMMIT_LOG_ENTRIES} entries`
    );
  } finally {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test('Benchmark specification constants match starter repository artifacts when present', () => {
  assert.ok(BENCHMARK_AGENTS_MD.includes('Elixir 1.20.x'));
  assert.ok(BENCHMARK_PROMPT.includes('@AGENTS.md'));
  assert.ok(BENCHMARK_PLAN.includes('## Implementation slices'));
  assert.ok(BENCHMARK_README_CONTRACT.includes('cb <http-or-https-url>'));

  const starterDir = path.resolve(process.cwd(), '../capybench_runs/starter');
  if (fs.existsSync(starterDir)) {
    const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
    const stripFencesAndBackticks = (s: string) =>
      normalize(s).replace(/```[a-z]*\n?/g, '').replace(/`/g, '').replace(/\s+/g, ' ');

    const agentsMd = normalize(fs.readFileSync(path.join(starterDir, 'AGENTS.md'), 'utf8'));
    const promptMd = normalize(fs.readFileSync(path.join(starterDir, 'PROMPT.md'), 'utf8'));
    const planMd = normalize(fs.readFileSync(path.join(starterDir, 'PLAN.md'), 'utf8'));
    const readmeMd = normalize(fs.readFileSync(path.join(starterDir, 'README.md'), 'utf8'));

    assert.equal(normalize(BENCHMARK_AGENTS_MD), agentsMd);
    assert.equal(normalize(BENCHMARK_PROMPT), promptMd);
    assert.equal(normalize(BENCHMARK_PLAN), planMd);
    assert.ok(
      stripFencesAndBackticks(readmeMd).includes(stripFencesAndBackticks(BENCHMARK_README_CONTRACT)),
      'starter/README.md must contain BENCHMARK_README_CONTRACT'
    );
  }
});

