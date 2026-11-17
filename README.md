# Capy Bench Leaderboard

**My stack. My field notes.**

Capy Bench is my personal coding-agent evaluation, built around my chosen stack and workflow: Elixir/OTP, a command-line HTTP tool, and outside-in TDD.

A different language, framework, project, or way of working may produce different results and a different ranking. Read these as field notes from one stack and workflow, not a universal ranking of coding agents. If you rely on coding agents in your own work, build a small eval around your stack, your constraints, and how you actually ship software, or fork this repository as a starting point for tracking your own runs.

- **Live leaderboard:** [eval.rizafahmi.com](https://eval.rizafahmi.com)
- **Head-to-head comparison:** [eval.rizafahmi.com/compare](https://eval.rizafahmi.com/compare)
- **Methodology & full specs:** [eval.rizafahmi.com/about](https://eval.rizafahmi.com/about)

## What this repo is

This repository is the Astro static site that renders the leaderboard and run telemetry, not the Elixir `./cb` implementation itself.

In the benchmark task, each coding harness and model pair starts from the same starter repository and works through seven sequential slices (`S1`–`S7`) using outside-in TDD (one failing behavior test at a time) to build `./cb`, a bounded HTTP benchmark CLI for macOS and Linux.

Over a 5-second window, `./cb` paces single-flight `GET` requests (`>= 100 ms` apart, at most 50 starts), enforces a 2-second total timeout per request, verifies HTTPS certificates, reports status counts and `p50`/`p95` latencies, and handles foreground `Ctrl-C` (`SIGINT`) cleanly with exit code `130`.

Runs rank by `S1`–`S7` completion first, then wall-clock duration, test pass ratio, and API cost. Each run record tracks stage outcomes, holdout vs. agent test counts, token and cache usage, per-slice cost breakdowns, and my engineering notes.

## Local setup

Requires **Node.js 22+** and **pnpm 12+** (matching [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

```bash
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:4321`.

| Command | What it does |
| :--- | :--- |
| `pnpm dev` | Start the local Astro dev server (`pnpm start` aliases this). |
| `pnpm test` | Run the telemetry, token conservation, and schema audit suite ([`tests/audit-runs.test.ts`](tests/audit-runs.test.ts)). |
| `pnpm build` | Validate [`src/content/runs/`](src/content/runs) against the Zod schema and build static pages into `dist/`. |
| `pnpm preview` | Serve the production `dist/` build locally. |
| `pnpm ingest` | Normalize run telemetry (`--sync`) or ingest raw session transcripts via [`scripts/ingest-run.ts`](scripts/ingest-run.ts). |

## Where the details live

Instead of duplicating specifications or schemas here, check the source files directly:

- **Task contract, `PLAN.md` (`S1`–`S7`), and `PROMPT.md`:** [`src/data/benchmark.ts`](src/data/benchmark.ts) (or read them formatted on [`/about`](https://eval.rizafahmi.com/about) and [`src/pages/about.astro`](src/pages/about.astro))
- **Run record Zod schema:** [`src/content.config.ts`](src/content.config.ts)
- **Published and draft run records:** [`src/content/runs/`](src/content/runs)
- **Pricing catalog and cost counterfactuals:** [`src/data/pricing.ts`](src/data/pricing.ts) and [`src/utils/telemetry.ts`](src/utils/telemetry.ts)
- **Run ingestion and transcript audit workflow:** [`scripts/ingest-run.ts`](scripts/ingest-run.ts) and [`.agents/skills/capybench-run-ingestion/SKILL.md`](.agents/skills/capybench-run-ingestion/SKILL.md)
- **Visual system (Neo-Acid):** [`DESIGN.md`](DESIGN.md)
- **Product scope and principles:** [`PRODUCT.md`](PRODUCT.md)
