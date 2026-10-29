# 🦫 Capy Bench Leaderboard

[![CI Build & Deploy](https://github.com/rizafahmi/eval_leaderboard/actions/workflows/ci.yml/badge.svg)](https://github.com/rizafahmi/eval_leaderboard/actions/workflows/ci.yml)
[![Live Leaderboard](https://img.shields.io/badge/Live_Site-eval.rizafahmi.com-c86d51?logo=googlechrome&logoColor=white)](https://eval.rizafahmi.com)
[![Astro](https://img.shields.io/badge/Astro-7.4.2-ff5d01?logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Package Manager](https://img.shields.io/badge/pnpm-12-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Benchmark Target](https://img.shields.io/badge/Benchmark_Target-Elixir_%2F_OTP_CLI-4b275f?logo=elixir&logoColor=white)](https://eval.rizafahmi.com/about)

**Capy Bench Leaderboard** ([eval.rizafahmi.com](https://eval.rizafahmi.com)) is a static web application for tracking and comparing personal coding agent and LLM benchmark runs across implementation slices (`S1`–`S7`), measuring plan completion, test pass rates, token usage, cache efficiency, wall-clock duration, and real cost.

> 📌 **Scope Note:** Runs represent independent, single-task evaluations on an opinionated backend/CLI engineering workflow in Elixir/OTP—meant as practical engineering field notes rather than a formal academic benchmark.

---

## ✨ What This Repository Tracks

- 🏆 **Interactive Leaderboard (`/`)** — Client-side search, filtering by **Coding Harness** and **Model Provider**, and multi-column sorting (Plan Completion, Tests Passed, Duration, Total Tokens, Cost, and Run Date) with View Transitions.
- 🔍 **Detailed Run Inspection (`/runs/[id]`)** — Per-run breakdown of `S1`–`S7` checkpoint completion, exact CLI/harness invocation, token & context window telemetry, tool call breakdown (`DONE` vs `ERROR`), 2026/2027 pricing tables, per-slice cost/step breakdown, git commit history, and engineering notes.
- 📋 **Benchmark Specification (`/about`)** — Full methodology, `S1`–`S7` deliverable specs, judging criteria, and one-click copyable `PLAN.md`, `README.md` (V1 CLI contract), and `PROMPT.md`.

---

## 🧪 The Benchmark Task (`./cb`)

Every **Coding Harness + Model** pair is given the same starter repository (`README.md` V1 product contract, `PLAN.md` implementation slices `S1`–`S7`, and `AGENTS.md` conventions) and tasked with building `./cb`: a command-line HTTP benchmark tool in **Elixir/OTP** for macOS and Linux using outside-in TDD.

### Target CLI Behavior

- Paces single-flight `GET` requests over a **5-second** start window (`>= 100 ms` between request starts, max **50** starts, no catch-up bursts).
- Enforces a **2-second** total timeout per request (including connection setup, TLS handshake, headers, and full response body).
- Verifies HTTPS certificates (`https://`) using system/standard trust stores and rejects untrusted or hostname-mismatched certificates.
- Reports completed HTTP status code counts, transport failures, total elapsed time, and `p50`/`p95` latencies (`ceil(p * count)`).
- Handles foreground terminal `Ctrl-C` (`SIGINT`) gracefully, printing a partial summary and exiting with code `130`.

### 🧱 Implementation Slices (`S1`–`S7`)

| Slice | Title | Key Deliverables & Verification |
| :--- | :--- | :--- |
| **`S1`** | **Launch the CLI** | Build executable `./cb`; print usage to `stdout` and exit `0` on `--help` / `-h`; document build, run, test, and lint commands; verify foreground `Ctrl-C` reaches application code. |
| **`S2`** | **Validate arguments** | Reject missing/malformed URLs, unsupported schemes, missing hosts, unknown flags, and extra arguments with errors on `stderr`, exit code `2`, and zero network calls. |
| **`S3`** | **Send one bounded GET** | Execute a single `GET` against local HTTP/HTTPS test servers; verify TLS certificates; stream & discard response bodies; enforce 2s total timeout and cancellation; no redirects or retries. |
| **`S4`** | **Run a paced 5-second loop** | Deterministically test `>= 100 ms` spacing, no catch-up bursts, no starts at/after the 5s deadline, and `<= 50` starts across fast, slow, and timed-out responses. |
| **`S5`** | **Report outcomes & exit codes** | Count completed HTTP responses by status code (`2xx`–`5xx`) and transport failures separately (`started = responses + failures`); exit `0` if `>= 1` HTTP response completed, else exit `1`. |
| **`S6`** | **Report timing** | Report elapsed time (`s`) and completed-response `p50`/`p95` latency (`ms`) using one-based `ceil(p * count)` ranks (or `n/a` when `0` responses complete). |
| **`S7`** | **Handle Ctrl-C** | Handle terminal-generated `Ctrl-C` both while pacing and during an in-flight request; stop new starts, print a single partial summary, and exit `130`. |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Astro 7](https://astro.build/) (`output: 'static'`) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) (`astro/tsconfigs/strict`) |
| **Content Layer** | Astro Content Collections (`glob` loader + [Zod](https://zod.dev/) schema validation in `src/content.config.ts`) |
| **Syntax Highlighting** | [Shiki 4](https://shiki.style/) |
| **Styling** | Custom CSS (`src/styles/global.css`) with CSS Cascade Layers, `light-dark()` theming, Container Queries, and View Transitions |
| **Package Manager** | `pnpm` (v12) |
| **Deployment** | GitHub Actions → GitHub Pages (`https://eval.rizafahmi.com`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 22`
- **pnpm** `>= 12`

### Installation & Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start the Astro development server (http://localhost:4321)
pnpm dev

# Or run the dev server in the background:
pnpm astro dev --background
```

### Build & Preview

```bash
# Validate all run JSON entries against the Zod schema and build static output to dist/
pnpm build

# Preview the production build locally
pnpm preview
```

---

## ➕ Adding a Benchmark Run

All benchmark runs live in `src/content/runs/` as individual JSON files and are validated at build time against the Zod schema in [`src/content.config.ts`](src/content.config.ts).

### 1. File Naming Convention

Name new files using the pattern:

```text
src/content/runs/<harness>-<model>-<effort>-<YYYYMMDD-HHMM>.json
```

Example: `src/content/runs/codex-cli-gpt-6-sol-high-20261025-1935.json`

### 2. Schema Reference

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `published` | `boolean` | Optional | Defaults to `true`. Set to `false` to hide a draft/incomplete run from the leaderboard and static routes. |
| `timestamp` | `string` | **Yes** | ISO 8601 timestamp with timezone offset (e.g., `"2026-10-25T19:35:00+07:00"`). |
| `codingHarness` | `string` | **Yes** | Name of the agent harness (e.g., `"Codex CLI"`, `"Pi"`, `"ZCode"`, `"Antigravity"`). |
| `model` | `string` | **Yes** | Model identifier (e.g., `"gpt-6-sol"`, `"gpt-6.1-sol"`, `"glm-5.3"`). |
| `effort` | `string` | Optional | Reasoning/thinking effort level (e.g., `"High"`, `"Max"`, `"Low"`). |
| `provider` | `string` | **Yes** | Model provider (e.g., `"OpenAI"`, `"Z.ai"`, `"Google"`, `"Meta"`). |
| `durationMinutes` | `number` | **Yes** | Total wall-clock run duration in minutes. |
| `costUsd` | `number` | **Yes** | Total estimated run cost in USD. |
| `commits` | `number` | Optional | Number of git commits recorded during the run. |
| `tests` | `object` | Optional | `{ passed: number, total: number, durationSeconds?: number, details?: string }`. |
| `planCompletion` | `Record<string, boolean>` | **Yes** | Map of stage IDs (`"S1"`–`"S7"`) to completion booleans. |
| `interface` | `object` | Optional | `{ type?: 'cli' \| 'desktop' \| 'web', command?: string, details?: string }`. |
| `tokens` | `object` | Optional | `{ input?, cachedInput?, output?, thinking?, total?, cacheHitRate? }` formatted strings. |
| `contextWindow` | `string` | Optional | Peak context window usage summary. |
| `calls` | `object` | Optional | `{ llmCalls?: number, toolCalls?: { total?, done?, error?, breakdown?: [...] } }`. |
| `commitLog` | `array` | Optional | Array of `{ hash, relativeTime?, author?, message }` objects. |
| `costBreakdown` | `array` | Optional | Array of `{ component, tokens, rate2026?, cost2026, rate2027?, cost2027? }`. |
| `sliceBreakdown` | `array` | Optional | Array of `{ slice, stepRange, llmCalls, manageTaskPolls?, thinkingTokens?, costUsd }`. |
| `notes` | `string[]` | Optional | Summary bullet strings for key findings. |
| `notesDetails` | `array` | Optional | Expandable structured notes: `{ title: string, bullets: string[] }[]`. |

### 3. Verify Your Entry

Run `pnpm build` to verify your JSON file passes Zod schema validation and generates a `/runs/<id>` static page cleanly.

---

## 📂 Project Structure

```text
.
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions workflow: schema check, build & GitHub Pages deploy
├── public/                    # Static assets (favicons, Apple touch icon, OG social image, manifest)
├── src/
│   ├── content/
│   │   └── runs/*.json        # Individual benchmark run entries
│   ├── data/
│   │   └── benchmark.ts       # S1–S7 stage definitions, PLAN.md, README contract, and PROMPT.md
│   ├── layouts/
│   │   └── BaseLayout.astro   # Global HTML shell, SEO/OG/Twitter meta tags, header & footer
│   ├── pages/
│   │   ├── index.astro        # Main interactive leaderboard table
│   │   ├── about.astro        # Benchmark methodology, S1–S7 specs & copyable prompts
│   │   └── runs/[id].astro    # Detailed view for each individual benchmark run
│   ├── styles/
│   │   └── global.css         # Neo-brutalist theme tokens, light-dark() palette & component styles
│   ├── utils/
│   │   └── format.ts          # Formatting & calculation helpers (duration, cost, tokens, plan stats)
│   └── content.config.ts      # Astro Content Collection & Zod schema definition
├── AGENTS.md                  # Repository instructions for coding agents
├── astro.config.mjs           # Astro configuration (static output, site URL)
├── package.json               # Scripts & dependencies
└── tsconfig.json              # Strict TypeScript configuration
```

---

## 🚢 CI/CD & Deployment

Pushes and pull requests to `main` trigger [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. **Validate & Build (`build` job)**: Installs dependencies with `pnpm install --frozen-lockfile` on Node.js 22 and runs `pnpm run build` to validate all JSON files in `src/content/runs/` and compile static routes into `dist/`.
2. **Deploy (`deploy` job)**: On pushes to `main`, uploads the `dist/` artifact and deploys it to GitHub Pages at [https://eval.rizafahmi.com](https://eval.rizafahmi.com).
