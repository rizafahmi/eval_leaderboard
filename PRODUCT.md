# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Evaluator & Maintainer (Riza Fahmi)**: Runs single-task coding agent evaluations against the Capy Bench starter repository and publishes verified telemetry and field notes.
- **Developers, Engineering Leads, and AI Practitioners**: Inspect and compare coding harnesses (CLI, Desktop, Web) and language models on a realistic backend/CLI engineering workflow to inform tool and model selection.

## Product Purpose

Capy Bench Leaderboard (`eval.rizafahmi.com`) is Riza Fahmi’s personal coding-agent evaluation and technical field-note archive. It evaluates how coding harnesses and LLMs execute a seven-stage Outside-In TDD plan (`S1`–`S7`) to build a bounded Elixir/OTP HTTP benchmark CLI (`./cb`). Readers can inspect completion, test rigor, duration, token/cache usage, and cost within this specific task and workflow—not treat the ordering as a universal ranking of coding agents.

## Positioning

Unlike synthetic single-function coding puzzles or frontend boilerplate benchmarks, Capy Bench tests disciplined Outside-In TDD across a stateful 7-slice Elixir/OTP systems specification — covering CLI argument validation, HTTP/TLS certificate verification, monotonic rate pacing (`5s` window, `100ms` minimum spacing, `<= 50` starts), per-request `2s` total timeouts and cancellation, `p50`/`p95` latency rank calculation, and real foreground `SIGINT` (`Ctrl-C`) handling — paired with granular per-slice telemetry, cost breakdowns, and qualitative engineering field notes.

## Operating Context

- Each evaluation starts from an identical starter repository containing `AGENTS.md`, `README.md` (the V1 CLI product contract), and `PLAN.md` (Preparation + slices `S1`–`S7`).
- Agents are prompted once to work through `PLAN.md` sequentially: write one failing behavior test at a time, implement only what passes it, run formatting and linting, verify against local HTTP/HTTPS test servers, mark the slice complete, and commit.
- Run records are stored as static JSON entries in `src/content/runs/<harness>-<model>-<effort>-<timestamp>.json` and validated at build time via Astro Content Collections (`src/content.config.ts`).
- Visitors explore four reading surfaces:
  - **Main Leaderboard (`/`)**: Model/harness, stage outcome, agent tests, duration, tokens, and billed cost. Search stays visible; additional filters, sorting, pricing lenses, and optional extra row notes live behind “Filter & sort.” Analysis opens through question-led disclosures.
  - **Comparison (`/compare`)**: Two selected runs and three core results, with guided pairs, execution metrics, stages, and cache accounting disclosed independently.
  - **Run Detail (`/runs/<id>`)**: An existing field-note lead, visible verification discrepancies, outcome/time/cost, and readable plan/notes. Deep telemetry, interfaces, and commits open on demand or from deep links.
  - **About & Benchmark Plan (`/about`)**: Seven-stage overview, judging rubric, and independently expandable/copyable plan, CLI contract, prompt, and sample output.

## Capabilities and Constraints

- **Static Architecture**: Built with Astro 7 (`output: 'static'`), TypeScript (`strict`), and zero external UI runtime dependencies.
- **Schema-Validated Telemetry**: Every run entry conforms to the Zod schema in `src/content.config.ts`. Optional telemetry fields (tokens, cache hit rate, tool calls, cost breakdown, slice breakdown, commit log, notes) degrade gracefully when a harness does not expose them.
- **Ranking Order**: Runs sort by plan completion ratio (`S1`–`S7`, descending), then fastest wall-clock duration (`durationMinutes`, ascending). Test pass ratio and lowest API cost (`costUsd`) break remaining ties. Incomplete runs never outrank complete runs in the default view.
- **Scope Discipline**: Focused exclusively on the Capy Bench S1–S7 Elixir/OTP CLI specification (`./cb`) and maintainer-verified runs.
- **Transferability:** Different languages, frameworks, projects, or workflows may produce different results and rankings. Make this boundary visible in the About introduction and link to it from the leaderboard; do not hide it in a disclosure or fine print.

## Brand Commitments

- **Identity**: Personal engineering benchmark by Riza Fahmi (`rizafahmi.com`), hosted at `eval.rizafahmi.com` under the brand mark `CAPY.BENCH`.
- **Visual System**: Neo-Acid foundation with a calm field-note reading treatment (`DESIGN.md`): dark-first Obsidian/Plaster, Unbounded two-tone headings, Schibsted prose and controls, Martian Mono measurements, square corners, zero shadows/gradients. Whitespace, subtle separators, and progressive disclosure take precedence over dense dashboard framing.
- **Voice**: First-person where explaining the evaluator’s choices; direct, empirical field notes elsewhere. Concrete numbers, exact commands, and unvarnished agent observations without universal “best agent” claims.

## Evidence on Hand

- **Verified Run Dataset**: 12 published benchmark run JSON files in `src/content/runs/` spanning harnesses (`agy`, `codex-cli`, `cursor-cli`, `pi`, `zcode`) and models (`gemini-3-8-flash`, `gpt-6-sol`, `gpt-6-1-sol`, `glm-5-3`, `glm-5-3-flash`, `laguna-s-2-1-free`, `muse-spark-1-3-contrib`, `auto`).
- **Benchmark Artifacts**: Complete `BENCHMARK_STAGES`, `BENCHMARK_PLAN` (`PLAN.md`), `BENCHMARK_README_CONTRACT` (`README.md`), and `BENCHMARK_PROMPT` (`PROMPT.md`) in `src/data/benchmark.ts`.
- **No Fabricated Claims**: Future work must never invent synthetic runs, unverified model scores, testimonials, or external endorsements.

## Product Principles

1. **Empirical Telemetry Over Hype**: Lead with verifiable outcomes — stage completion (`S1`–`S7`), test counts, wall-clock minutes, token/cache breakdowns, and exact dollar cost.
2. **Graceful Partial Telemetry**: Harnesses expose different levels of observability; the interface must present rich breakdowns when available and remain clean and comparable when optional fields are absent.
3. **Comfort Before Density**: Readers can understand the main outcome first, filter/sort immediately, then deliberately open technical evidence. Reduce simultaneous signals without shrinking text or hiding verification failures.
4. **Reproducible Specification**: Keep the exact prompt, TDD plan, and V1 CLI contract first-class citizens of the site so every score is grounded in the exact problem the agent solved.
