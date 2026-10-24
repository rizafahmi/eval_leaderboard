# AGENTS.md

## Overview
**Capy Bench Leaderboard** is a static web application for tracking and comparing coding agent benchmark runs across stages (`S1`–`S7`), measuring completion, test pass rates, token efficiency, duration, and cost.

## Tech Stack
- **Framework**: [Astro 7](https://astro.build/) (`output: 'static'`)
- **Language**: TypeScript (`astro/tsconfigs/strict`)
- **Data Layer**: Astro Content Collections (`src/content.config.ts`) using `glob` loader and Zod schemas over JSON files in `src/content/runs/`
- **Styling**: Custom CSS (`src/styles/global.css`) + scoped Astro component styles
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
- **Test Runner**: No external test framework is installed by default. Use Node's built-in test runner (`node --test`) for utility tests, or verify changes via `pnpm build`.

## Project Structure & Conventions
- `src/content.config.ts` — Zod schema definition for the `runs` collection.
- `src/content/runs/*.json` — Individual benchmark run entries (named `<harness>-<model>-<effort>-<timestamp>.json`).
- `src/data/benchmark.ts` — Benchmark stage definitions (`S1`–`S7`) and task prompt metadata.
- `src/utils/format.ts` — Formatting and calculation helpers (duration, cost, token parsing, plan stats).
- `src/pages/index.astro` — Main leaderboard table with client-side filtering and sorting.
- `src/pages/runs/[id].astro` — Detailed view for an individual benchmark run.
