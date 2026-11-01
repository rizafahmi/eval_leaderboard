# AGENTS.md

## Overview
**Capy Bench Leaderboard** is a static web application for tracking and comparing coding agent benchmark runs across stages (`S1`–`S7`), measuring completion, test pass rates, token efficiency, duration, and cost.

## Tech Stack
- **Framework**: [Astro 7](https://astro.build/) (`output: 'static'`)
- **Language**: TypeScript (`astro/tsconfigs/strict`)
- **Data Layer**: Astro Content Collections (`src/content.config.ts`) using `glob` loader and Zod schemas over JSON files in `src/content/runs/`
- **Design System**: [Neo-Acid](./DESIGN.md) (`src/styles/tokens.css` + `src/styles/global.css`) — Dark-first Obsidian Clay (`#121519`) / Raw Gallery Plaster (`#f7f7f5`), `Unbounded 800` two-tone headlines, 5 semantic highlighter swatches (`--hl-*`), dual `2px`/`4px` + `1px` borders, `0px` radius, zero shadows/gradients
- **Package Manager**: `pnpm`

## Operating the Project

### Development Server
Run the Astro dev server as a background process so a new server is not started on every coding session:
```bash
astro dev --background
# or via pnpm:
pnpm astro dev --background
```

### Build & Preview
```bash
pnpm build     # Builds the static site to dist/ and validates content schemas
pnpm preview   # Previews the production build locally
```

## Testing & Verification
- **Build & Schema Check**: Run `pnpm build` to verify that all JSON benchmark entries in `src/content/runs/` conform to the Zod schema in `src/content.config.ts` and that all static routes compile cleanly.
- **Test & Conservation Audit Runner**: Run `pnpm test` (`node --experimental-strip-types --test tests/*.test.ts`) to verify exact integer token conservation, cache hit rate math, slice call/cost conservation, contiguous step ranges, Pareto frontier calculation, and raw JSONL transcript ingestion.
- **Run Ingestion & Sync CLI**: Run `pnpm ingest --sync` to normalize/backfill exact numeric telemetry across `src/content/runs/*.json`, or `pnpm ingest --transcript <events.jsonl> ...` to ingest a raw harness session log.

## Project Structure & Conventions
- `src/content.config.ts` — Zod schema definition for the `runs` collection (including exact numeric `tokenCounts`, `contextMetrics`, and `verification`).
- `src/content/runs/*.json` — Individual benchmark run entries (named `<harness>-<model>-<effort>-<timestamp>.json`).
- `src/data/benchmark.ts` — Benchmark stage definitions (`S1`–`S7`) and task prompt metadata.
- `src/data/pricing.ts` — Versioned model token pricing catalog and counterfactual cost engine (billed, standard API, 2027 comparison, and uncached counterfactuals).
- `src/utils/format.ts` — Formatting and calculation helpers (duration, cost, token parsing, plan stats).
- `src/utils/telemetry.ts` — Econometric analysis, Speed × Cost Pareto frontier solver, cross-run `S1`–`S7` bottleneck matrix, and controlled ablation discovery.
- `src/pages/index.astro` — Main leaderboard table with pricing lenses, Pareto frontier plot, stage bottleneck matrix, and client-side filtering/sorting.
- `src/pages/compare.astro` — Interactive head-to-head run comparison and controlled ablation workbench.
- `src/pages/runs/[id].astro` — Detailed forensic view for an individual benchmark run.
- `scripts/ingest-run.ts` — Raw JSONL transcript & git history ingestion and telemetry normalization CLI.
- `tests/audit-runs.test.ts` — Automated conservation law and econometric regression test suite.
