# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Evaluator & Maintainer (Riza Fahmi)**: Runs single-task coding agent evaluations against the Capy Bench starter repository and publishes verified telemetry and field notes.
- **Developers, Engineering Leads, and AI Practitioners**: Inspect and compare coding harnesses (CLI, Desktop, Web) and language models on a realistic backend/CLI engineering workflow to inform tool and model selection.

## Product Purpose

Capy Bench Leaderboard (`eval.rizafahmi.com`) is a public leaderboard and technical field-note archive for **Capy Bench**, an end-to-end coding agent benchmark. It evaluates how coding harnesses and LLMs execute a 7-stage Outside-In TDD plan (`S1`–`S7`) to build a bounded Elixir/OTP HTTP benchmark CLI (`./cb`). Success means readers can immediately see which harness + model pairs finish the full specification, verify their test rigor, and compare wall-clock duration, token consumption, cache efficiency, and real API cost.

## Positioning

Unlike synthetic single-function coding puzzles or frontend boilerplate benchmarks, Capy Bench tests disciplined Outside-In TDD across a stateful 7-slice Elixir/OTP systems specification — covering CLI argument validation, HTTP/TLS certificate verification, monotonic rate pacing (`5s` window, `100ms` minimum spacing, `<= 50` starts), per-request `2s` total timeouts and cancellation, `p50`/`p95` latency rank calculation, and real foreground `SIGINT` (`Ctrl-C`) handling — paired with granular per-slice telemetry, cost breakdowns, and qualitative engineering field notes.

## Operating Context

- Each evaluation starts from an identical starter repository containing `AGENTS.md`, `README.md` (the V1 CLI product contract), and `PLAN.md` (Preparation + slices `S1`–`S7`).
- Agents are prompted once to work through `PLAN.md` sequentially: write one failing behavior test at a time, implement only what passes it, run formatting and linting, verify against local HTTP/HTTPS test servers, mark the slice complete, and commit.
- Run records are stored as static JSON entries in `src/content/runs/<harness>-<model>-<effort>-<timestamp>.json` and validated at build time via Astro Content Collections (`src/content.config.ts`).
- Visitors use two primary surfaces:
  - **Main Leaderboard (`/`)**: Summary KPIs, interactive client-side filtering (search, harness, provider, full-pass toggle) and multi-column sorting across all published runs.
  - **Run Detail (`/runs/<id>`)**: Per-stage (`S1`–`S7`) completion matrix, token & cache hit rate telemetry, LLM/tool call breakdowns, per-slice cost/step tables, git commit logs, and qualitative engineering notes.
  - **About & Benchmark Plan (`/about`)**: Full methodology, judging rubric, target CLI output, and copyable `PLAN.md`, `README.md` V1 contract, and `PROMPT.md` specifications.

## Capabilities and Constraints

- **Static Architecture**: Built with Astro 7 (`output: 'static'`), TypeScript (`strict`), and zero external UI runtime dependencies.
- **Schema-Validated Telemetry**: Every run entry conforms to the Zod schema in `src/content.config.ts`. Optional telemetry fields (tokens, cache hit rate, tool calls, cost breakdown, slice breakdown, commit log, notes) degrade gracefully when a harness does not expose them.
- **Ranking Order**: Runs sort by plan completion ratio (`S1`–`S7`), then test pass ratio, then lowest API cost (`costUsd`), then fastest wall-clock duration (`durationMinutes`).
- **Scope Discipline**: Focused exclusively on the Capy Bench S1–S7 Elixir/OTP CLI specification (`./cb`) and maintainer-verified runs.

## Brand Commitments

- **Identity**: Personal engineering benchmark by Riza Fahmi (`rizafahmi.com`), hosted at `eval.rizafahmi.com` under the brand mark `CAPY.BENCH`.
- **Visual System**: Bound to the **Neo-Acid** design system (`DESIGN.md` — dark-first Obsidian Clay `#121519` and Raw Gallery Plaster `#f7f7f5` light mode, `Unbounded 800` two-tone display headlines, `Schibsted Grotesk` body, `Martian Mono` telemetry, 5 semantic highlighter swatches `--hl-*`, dual `2px`/`4px` + `1px` borders, `0px` radius, zero shadows or gradients).
- **Voice**: Direct, empirical, systems-engineering field notes — concrete numbers, exact commands, and unvarnished observations of agent behavior without marketing hype.

## Evidence on Hand

- **Verified Run Dataset**: 12 published benchmark run JSON files in `src/content/runs/` spanning harnesses (`agy`, `codex-cli`, `cursor-cli`, `pi`, `zcode`) and models (`gemini-3-8-flash`, `gpt-6-sol`, `gpt-6-1-sol`, `glm-5-3`, `glm-5-3-flash`, `laguna-s-2-1-free`, `muse-spark-1-3-contrib`, `auto`).
- **Benchmark Artifacts**: Complete `BENCHMARK_STAGES`, `BENCHMARK_PLAN` (`PLAN.md`), `BENCHMARK_README_CONTRACT` (`README.md`), and `BENCHMARK_PROMPT` (`PROMPT.md`) in `src/data/benchmark.ts`.
- **No Fabricated Claims**: Future work must never invent synthetic runs, unverified model scores, testimonials, or external endorsements.

## Product Principles

1. **Empirical Telemetry Over Hype**: Lead with verifiable outcomes — stage completion (`S1`–`S7`), test counts, wall-clock minutes, token/cache breakdowns, and exact dollar cost.
2. **Graceful Partial Telemetry**: Harnesses expose different levels of observability; the interface must present rich breakdowns when available and remain clean and comparable when optional fields are absent.
3. **Inspection-First Scanability**: Readers should be able to scan the full leaderboard at a glance, filter/sort immediately without page reloads, and drill into a single run's commit log, tool distribution, and failure notes in one click.
4. **Reproducible Specification**: Keep the exact prompt, TDD plan, and V1 CLI contract first-class citizens of the site so every score is grounded in the exact problem the agent solved.
