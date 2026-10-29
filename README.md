<div align="center">

# 🦫 Capy Bench Leaderboard

**Personal coding agent & LLM benchmark evaluating end-to-end Elixir/OTP CLI engineering (`S1`–`S7`) on plan completion, test pass rates, token efficiency, wall-clock duration, and real cost.**

[![CI Build & Deploy](https://github.com/rizafahmi/eval_leaderboard/actions/workflows/ci.yml/badge.svg)](https://github.com/rizafahmi/eval_leaderboard/actions/workflows/ci.yml)
[![Live Leaderboard](https://img.shields.io/badge/Live_Site-eval.rizafahmi.com-c5f82a?logo=googlechrome&logoColor=0a0b0d&labelColor=121519)](https://eval.rizafahmi.com)
[![Design System](https://img.shields.io/badge/Design_System-Neo--Acid-a984ff?labelColor=121519)](./DESIGN.md)
[![Astro](https://img.shields.io/badge/Astro-7.4.2-ff5d01?logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Schema Validation](https://img.shields.io/badge/Schema-Zod-3e67b1?logo=zod&logoColor=white)](https://zod.dev/)
[![Syntax Highlighting](https://img.shields.io/badge/Shiki-ayu--dark-121519?logo=markdown&logoColor=c5f82a)](https://shiki.style/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Package Manager](https://img.shields.io/badge/pnpm-12-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-121519?logo=githubpages&logoColor=white)](https://eval.rizafahmi.com)
[![Benchmark Target](https://img.shields.io/badge/Target_Stack-Elixir_%2F_OTP_CLI-4b275f?logo=elixir&logoColor=white)](https://eval.rizafahmi.com/about)

[🌐 **Live Leaderboard**](https://eval.rizafahmi.com) • [📋 **Methodology & Specs**](https://eval.rizafahmi.com/about) • [🚀 **Getting Started**](#-getting-started) • [➕ **Add a Run**](#-adding-a-benchmark-run) • [📂 **Project Structure**](#-project-structure)

</div>

---

> 📌 **Scope Note:** Runs represent independent, single-task evaluations on an opinionated backend/CLI engineering workflow in Elixir/OTP—meant as practical engineering field notes rather than a formal academic or industry-wide study.

## 🧭 Table of Contents

- [✨ What This Repository Tracks](#-what-this-repository-tracks)
- [🧪 The Benchmark Task (`./cb`)](#-the-benchmark-task-cb)
  - [🎯 Target CLI Behavior](#-target-cli-behavior)
  - [🧱 Implementation Slices (`S1`–`S7`)](#-implementation-slices-s1s7)
  - [💬 Exact Agent Prompt (`PROMPT.md`)](#-exact-agent-prompt-promptmd)
- [📊 Ranking, Metrics & Evaluation Rules](#-ranking-metrics--evaluation-rules)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [🚀 Getting Started](#-getting-started)
  - [📋 Prerequisites](#-prerequisites)
  - [💻 Installation & Local Development](#-installation--local-development)
  - [📜 Available Scripts](#-available-scripts)
- [➕ Adding a Benchmark Run](#-adding-a-benchmark-run)
  - [1️⃣ File Naming Convention](#1️⃣-file-naming-convention)
  - [2️⃣ Minimal Run JSON Example](#2️⃣-minimal-run-json-example)
  - [3️⃣ Full Schema Reference](#3️⃣-full-schema-reference)
  - [4️⃣ Verify Your Entry](#4️⃣-verify-your-entry)
- [📂 Project Structure](#-project-structure)
- [🚢 CI/CD & Deployment](#-cicd--deployment)

---

## ✨ What This Repository Tracks

- 🏆 **Interactive Leaderboard (`/`)** — Client-side search across harness, model, provider, and effort level; dropdown filters for **Coding Harness** and **Model Provider**; and multi-column sorting (**Plan Completion**, **Tests & Commits**, **Duration**, **Token Usage**, **Cost**, and **Run Date**) powered by the View Transitions API and DOM state preservation (`moveBefore`).
- 🔍 **Detailed Run Inspection (`/runs/[id]`)** — Deep-dive telemetry for each run:
  - `S1`–`S7` progress bar and stage completion checklist
  - Copyable CLI invocation command and harness environment details (highlighted with Shiki `ayu-dark`)
  - Uncached input, cached input, output, thinking tokens, cache hit rate, and peak context window usage
  - LLM API call counts and per-tool call breakdown (`DONE` vs `ERROR` progress bars)
  - Token volume and estimated cost tables comparing **2026** and **2027** pricing rates
  - Per-slice (`S1`–`S7`) breakdown of step ranges, LLM calls, `manage_task` polls, thinking tokens, and cost
  - Git commit log and expandable engineering notes with automatic inline code tokenization
- 📋 **Benchmark Specification (`/about`)** — Full methodology, `S1`–`S7` deliverable specs, judging criteria, and one-click copyable `PLAN.md`, `README.md` (V1 CLI contract), and `PROMPT.md`.
- 🗂️ **Current Dataset (`src/content/runs/`)** — Contains **12 recorded run entries** (**10 published runs** across `Antigravity`, `Codex CLI`, `Pi`, and `ZCode`, plus **2 unpublished runs** with `"published": false`).

---

## 🧪 The Benchmark Task (`./cb`)

Every **Coding Harness + Model** pair is given the same starter repository (`README.md` V1 product contract, `PLAN.md` implementation slices `S1`–`S7`, and `AGENTS.md` conventions) and tasked with building `./cb`: a command-line HTTP benchmark tool in **Elixir/OTP** for macOS and Linux using outside-in TDD.

### 🎯 Target CLI Behavior

- ⏱️ **Paced 5-Second Window:** Paces single-flight `GET` requests over a **5-second** start window using monotonic time (`>= 100 ms` between request starts, max **50** starts, no catch-up bursts).
- 🛑 **2-Second Per-Request Timeout:** Enforces a **2-second** total timeout per request from dispatch through complete body receipt (including client queuing, DNS, TCP connection setup, and TLS handshake). Receiving headers or body chunks does not reset the deadline.
- 🔒 **Strict HTTPS Verification:** Verifies HTTPS certificates (`https://`) and hostnames using standard trust stores; rejects untrusted or hostname-mismatched certificates without disabling verification. Does not follow redirects (`3xx` counts as a completed HTTP response) or retry dropped connections.
- 🌊 **Streaming Body Discard:** Streams and discards response-body chunks rather than buffering full payloads in memory.
- 📈 **Summary & Latency Percentiles:** Prints elapsed time, requests started, completed HTTP responses by status code (`2xx`–`5xx`), transport failures (`started = responses + failures`), and completed-response `p50`/`p95` latencies using one-based `ceil(p * count)` ranks (or `n/a` when `0` responses complete).
- ⚡ **Graceful `Ctrl-C` (`SIGINT`) Handling:** Stops new request dispatches immediately on foreground terminal `Ctrl-C`, waits for any in-flight request to complete or hit its original 2s timeout, prints a partial summary to `stdout`, and exits with code `130`.

```text
$ mix deps.get
$ mix escript.build
$ ./cb --help
$ mix test

$ ./cb https://example.com/
Target: https://example.com/
Elapsed: 5.02 s
Started: 50
HTTP responses: 49 (200: 48, 503: 1)
Transport failures: 1
Latency (HTTP responses): p50 38 ms, p95 91 ms
```

### 🧱 Implementation Slices (`S1`–`S7`)

With **Preparation** (moving the V1 CLI contract into `README.md`) already checked off, agents complete `S1` through `S7` in order using outside-in TDD (one failing behavior test at a time):

| Slice | Title | Key Deliverables & Verification |
| :--- | :--- | :--- |
| **`S1`** | 🚀 **Launch the CLI** | Build executable `./cb`; print usage to `stdout` and exit `0` on `--help` / `-h`; document build, run, test, and lint commands in `README.md`; verify foreground `Ctrl-C` reaches application code. |
| **`S2`** | 🛡️ **Validate arguments** | Reject missing/malformed URLs, unsupported schemes, missing hosts, unknown flags, and extra arguments with errors on `stderr`, exit code `2`, and zero network calls. |
| **`S3`** | 🌐 **Send one bounded GET** | Execute a single `GET` against local HTTP/HTTPS test servers; verify TLS certificates; stream & discard response bodies; enforce 2s total timeout and cancellation; no redirects or retries. |
| **`S4`** | 🔄 **Run a paced 5-second loop** | Deterministically test `>= 100 ms` spacing, no catch-up bursts, no starts at/after the 5s deadline, and `<= 50` starts across fast, delayed, and timed-out responses. |
| **`S5`** | 📊 **Report outcomes & exit codes** | Count completed HTTP responses by status code (`2xx`–`5xx`) and transport failures separately (`started = responses + failures`); exit `0` if `>= 1` HTTP response completed, else exit `1`. |
| **`S6`** | ⏱️ **Report timing** | Report elapsed time (`s`) and completed-response `p50`/`p95` latency (`ms`) using one-based `ceil(p * count)` ranks (or `n/a` when `0` responses complete). |
| **`S7`** | 🛑 **Handle Ctrl-C** | Handle terminal-generated `Ctrl-C` both while pacing and during an in-flight request; stop new starts, print a single partial summary to `stdout`, and exit `130`. |

### 💬 Exact Agent Prompt (`PROMPT.md`)

Every run is initiated with the same prompt (defined in [`src/data/benchmark.ts`](src/data/benchmark.ts)):

```text
Start by reviewing @AGENTS.md to align with the project's objectives.

Process the implementation in @PLAN.md one task at a time until all done. For
each unchecked task ([ ]): implement the logic, run the code formatter, mark the
implementation as complete ([x]), validate, proof of completion then commit your
changes with a concise message.

Complete all @PLAN.md work in this conversation.
```

---

## 📊 Ranking, Metrics & Evaluation Rules

- 🥇 **Default Leaderboard Ranking Order (`src/pages/index.astro`)**:
  1. **Plan Completion Ratio** (`completed / total` stages, descending)
  2. **Test Pass Ratio** (`tests.passed / tests.total`, descending)
  3. **Total Cost** (`costUsd`, ascending)
  4. **Wall-Clock Duration** (`durationMinutes`, ascending)
- ⚖️ **Interactive Sort Tie-Breakers**: When sorting by any column in the UI, ties break by higher **Plan Completion Ratio**, followed by lower **Total Cost (`costUsd`)**.
- 🧠 **Cache Hit Rate Formula**:
  $$\text{Cache Hit Rate} = \frac{\text{CacheRead}}{\text{input} + \text{cacheRead} + \text{cacheWrite}}$$
- 🔢 **Token & Call Normalization (`src/utils/format.ts`)**:
  - Token strings support shorthand suffixes (`k` = `1,000`, `M` = `1,000,000`) and are parsed into numeric totals (`input + output`) for client-side sorting.
  - Total calls displayed under run duration equal `calls.llmCalls + calls.toolCalls.total`.
- ✅ **Release Verification & V1 Non-Goals**:
  - After `S7`, agents must run `mix format --check-formatted`, `mix test`, the documented lint command (e.g., `mix credo --strict`), live `./cb` checks against local HTTP/HTTPS servers, and the foreground-terminal `Ctrl-C` check.
  - V1 explicitly excludes configurable duration/timeout/concurrency, distributed execution, remote control, non-GET workloads, and dashboards.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| ⚡ **Framework** | [Astro 7.4](https://astro.build/) (`output: 'static'`) | Zero-JS-by-default static site generation |
| 🔷 **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) (`astro/tsconfigs/strict`) | Type-safe templates, utilities, and content schemas |
| 🗃️ **Content Layer** | Astro Content Collections + [Zod](https://zod.dev/) | Build-time `glob` loading & schema validation of `src/content/runs/*.json` |
| 🎨 **Syntax Highlighting** | [Shiki 4.5](https://shiki.style/) | Server-rendered command & markdown highlighting (`ayu-dark`) |
| 💅 **Design System** | [Neo-Acid](./DESIGN.md) (`src/styles/tokens.css` + `src/styles/global.css`) | Dark-first Obsidian Clay (`#121519`) / Raw Plaster (`#f7f7f5`), `Unbounded 800` two-tone headlines, 5 semantic highlighter swatches (`--hl-*`), `0px` radius |
| 🚀 **Navigation & Perf** | Speculation Rules API + View Transitions | Eager prefetching, moderate prerendering, and smooth table sorting/page transitions |
| 📦 **Package Manager** | [pnpm 12](https://pnpm.io/) | Fast, deterministic dependency management (`--frozen-lockfile` in CI) |
| 🌐 **Deployment** | GitHub Actions → GitHub Pages | Automated build, schema validation, and deployment to [`eval.rizafahmi.com`](https://eval.rizafahmi.com) |

---

## 🚀 Getting Started

### 📋 Prerequisites

- 🟢 **Node.js** `>= 22`
- 📦 **pnpm** `>= 12`

### 💻 Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/rizafahmi/eval_leaderboard.git
cd eval_leaderboard

# 2. Install dependencies
pnpm install

# 3. Start the Astro development server at http://localhost:4321
pnpm dev

# Or run the dev server in the background:
pnpm astro dev --background
```

### 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` / `pnpm start` | Start the local Astro development server with hot reloading (`http://localhost:4321`). |
| `pnpm astro dev --background` | Start the Astro development server as a background process. |
| `pnpm build` | Validate all `src/content/runs/*.json` entries against the Zod schema and build the static site into `dist/`. |
| `pnpm preview` | Serve the production `dist/` build locally for verification. |
| `pnpm astro ...` | Run any Astro CLI subcommand directly (e.g., `pnpm astro check`, `pnpm astro info`). |

---

## ➕ Adding a Benchmark Run

All benchmark runs live in `src/content/runs/` as individual JSON files and are validated at build time against the Zod schema in [`src/content.config.ts`](src/content.config.ts).

### 1️⃣ File Naming Convention

Name new files using the pattern:

```text
src/content/runs/<harness>-<model>-<effort>-<YYYYMMDD-HHMM>.json
```

**Examples:**
- `src/content/runs/codex-cli-gpt-6-sol-high-20261025-1935.json`
- `src/content/runs/pi-gpt-6-1-sol-high-20261025-1820.json`
- `src/content/runs/zcode-glm-5-3-flash-max-20261025-0739.json`

### 2️⃣ Minimal Run JSON Example

Only the core metadata, cost/duration metrics, and `planCompletion` map are required—all detailed telemetry sections render conditionally when provided:

```json
{
  "published": true,
  "timestamp": "2026-10-25T19:35:54+07:00",
  "codingHarness": "Codex CLI",
  "model": "gpt-6-sol",
  "effort": "High",
  "provider": "openai-codex",
  "durationMinutes": 25,
  "costUsd": 3.14,
  "commits": 8,
  "tests": {
    "passed": 31,
    "total": 31,
    "durationSeconds": 57.6,
    "details": "31 passed (mix credo --strict clean)"
  },
  "planCompletion": {
    "S1": true,
    "S2": true,
    "S3": true,
    "S4": true,
    "S5": true,
    "S6": true,
    "S7": true
  }
}
```

### 3️⃣ Full Schema Reference

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `published` | `boolean` | Optional | Defaults to `true`. Set to `false` to hide a draft/incomplete run from the leaderboard and static routes. |
| `timestamp` | `string` | ✅ **Yes** | ISO 8601 timestamp with timezone offset (e.g., `"2026-10-25T19:35:54+07:00"`). |
| `codingHarness` | `string` | ✅ **Yes** | Name of the agent harness (e.g., `"Codex CLI"`, `"Pi"`, `"ZCode"`, `"Cursor CLI"`, `"Antigravity"`). |
| `model` | `string` | ✅ **Yes** | Model identifier (e.g., `"gpt-6-sol"`, `"gpt-6.1-sol"`, `"glm-5.3"`, `"gemini-3.8-flash"`). |
| `effort` | `string` | Optional | Reasoning/thinking effort level (e.g., `"High"`, `"Max"`, `"Low"`). |
| `provider` | `string` | ✅ **Yes** | Model provider or routing platform (e.g., `"openai-codex"`, `"Z.ai"`, `"Google"`, `"OpenRouter"`). |
| `durationMinutes` | `number` | ✅ **Yes** | Total wall-clock run duration in minutes. |
| `costUsd` | `number` | ✅ **Yes** | Total estimated run cost in USD. |
| `commits` | `number` | Optional | Number of git commits recorded during the run. |
| `tests` | `object` | Optional | `{ passed: number, total: number, durationSeconds?: number, details?: string }`. |
| `planCompletion` | `Record<string, boolean>` | ✅ **Yes** | Map of stage IDs (`"S1"`–`"S7"`) to completion booleans. |
| `interface` | `object` | Optional | `{ type?: 'cli' \| 'desktop' \| 'web', command?: string, details?: string }`. |
| `tokens` | `object` | Optional | `{ input?, cachedInput?, output?, thinking?, total?, cacheHitRate? }` formatted strings (e.g., `"151.1k"`, `"11.02M"`, `"98.65%"`). |
| `contextWindow` | `string` | Optional | Peak and average context window usage summary string. |
| `calls` | `object` | Optional | `{ llmCalls?: number, toolCalls?: { total?, done?, error?, breakdown?: [{ tool, total, done?, error? }] } }`. |
| `commitLog` | `array` | Optional | Array of `{ hash: string, relativeTime?: string, author?: string, message: string }` objects. |
| `costBreakdown` | `array` | Optional | Array of `{ component: string, tokens: string, rate2026?: string, cost2026: string, rate2027?: string, cost2027?: string }`. |
| `sliceBreakdown` | `array` | Optional | Array of `{ slice: string, stepRange: string, llmCalls: number, manageTaskPolls?: number, thinkingTokens?: number, costUsd: number }`. |
| `notes` | `string[]` | Optional | Flat list of summary bullet strings for key findings. |
| `notesDetails` | `array` | Optional | Expandable structured notes: `{ title: string, bullets: string[] }[]` (supports automatic inline code formatting and `Lead: body` highlighting). |

### 4️⃣ Verify Your Entry

Run the production build to verify that your JSON file passes Zod schema validation and generates a `/runs/<id>` static page cleanly:

```bash
pnpm build
```

---

## 📂 Project Structure

```text
.
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions workflow: schema check, build & GitHub Pages deploy
├── public/                    # Static assets (favicons, Apple touch icon, OG social image, webmanifest)
├── src/
│   ├── content/
│   │   └── runs/*.json        # Individual benchmark run entries (10 published, 2 unpublished)
│   ├── data/
│   │   └── benchmark.ts       # S1–S7 stage definitions, PLAN.md, README V1 contract, and PROMPT.md
│   ├── layouts/
│   │   └── BaseLayout.astro   # Global HTML shell, SEO/OG/Twitter meta tags, JSON-LD, Speculation Rules
│   ├── pages/
│   │   ├── index.astro        # Main interactive leaderboard table with client-side filter & sort
│   │   ├── about.astro        # Benchmark methodology, S1–S7 specs & copyable prompt artifacts
│   │   └── runs/[id].astro    # Detailed telemetry & inspection view for each individual run
│   ├── styles/
│   │   └── global.css         # Neo-brutalist theme tokens, light-dark() palette & component styles
│   ├── utils/
│   │   └── format.ts          # Formatting & calculation helpers (duration, cost, tokens, note parser)
│   └── content.config.ts      # Astro Content Collection & Zod schema definition
├── AGENTS.md                  # Repository instructions and conventions for coding agents
├── astro.config.mjs           # Astro configuration (static output, site URL: eval.rizafahmi.com)
├── package.json               # Scripts & dependencies
└── tsconfig.json              # Strict TypeScript configuration
```

---

## 🚢 CI/CD & Deployment

Pushes and pull requests to `main` trigger [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. 🔍 **Validate & Build (`build` job)**: Checks out the repo on `ubuntu-latest`, configures **pnpm 12** and **Node.js 22**, installs dependencies with `pnpm install --frozen-lockfile`, and runs `pnpm run build` to validate all JSON files in `src/content/runs/` and compile static routes into `dist/`.
2. 🌐 **Deploy (`deploy` job)**: On pushes to `main`, uploads the `dist/` pages artifact and deploys it to **GitHub Pages** at [`https://eval.rizafahmi.com`](https://eval.rizafahmi.com).
