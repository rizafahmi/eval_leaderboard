---
name: neo-acid
description: Dark-first Neo-Acid foundation with a calm field-note reading treatment: restrained chrome, comfortable typography, and on-demand benchmark detail.
colors:
  neutral-dark-bg: "#121519"
  neutral-dark-surface: "#1b2026"
  neutral-dark-elevated: "#222831"
  neutral-dark-text: "#c2cad6"
  neutral-dark-heading: "#e7ecf2"
  neutral-dark-muted: "#8c96a3"
  neutral-dark-border-strong: "#434a56"
  neutral-dark-border-subtle: "#262c36"
  neutral-light-bg: "#f7f7f5"
  neutral-light-surface: "#ecece6"
  neutral-light-elevated: "#ffffff"
  neutral-light-text: "#3f454d"
  neutral-light-heading: "#0a0b0d"
  neutral-light-muted: "#59636d"
  neutral-light-border-strong: "#0a0b0d"
  neutral-light-border-subtle: "#d8dad3"
  highlighter-ink: "#0a0b0d"
  hl-acid: "#c5f82a"
  hl-violet: "#a984ff"
  hl-mint: "#5ae67a"
  hl-sky: "#8ce0ff"
  hl-magenta: "#ff6ed4"
  accent-cobalt: "#1a3bf5"
typography:
  display:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.15
  heading:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
  heading-sm:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  compact:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "Martian Mono, JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  mono-sm:
    fontFamily: "Martian Mono, JetBrains Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  mono-xs:
    fontFamily: "Martian Mono, JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.35
  mono-2xs:
    fontFamily: "Martian Mono, JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
  reading-display:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.3
  comparison-display:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)"
    fontWeight: 800
    lineHeight: 1.3
rounded:
  none: "0px"
  sm: "2px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-dark-heading}"
    textColor: "{colors.neutral-dark-bg}"
    hoverBackgroundColor: "{colors.hl-acid}"
    hoverTextColor: "{colors.highlighter-ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.25rem"
    border: "2px solid {colors.neutral-dark-border-strong}"
  badge-highlighter:
    backgroundColor: "{colors.hl-acid}"
    textColor: "{colors.highlighter-ink}"
    rounded: "{rounded.none}"
    padding: "0.15rem 0.45rem"
  card-brutalist:
    backgroundColor: "transparent"
    border: "2px solid {colors.neutral-dark-border-strong}"
    padding: "1.5rem"
    rounded: "{rounded.none}"
---

# Design System: Neo-Acid (`neo-acid`)

## 1. Overview

**Creative North Star: "A quiet field-note archive"**

Capy Bench retains Neo-Acid’s Obsidian/Plaster surfaces, two-tone Unbounded headlines, square corners, and five semantic swatches. Its reading surfaces use restraint: one clear outcome at a time, generous spacing, and technical depth revealed only when the reader asks.

### Key Characteristics

- **Dark-First Obsidian Canvas**: Defaults to softened Obsidian Clay (`#121519`) with Silver White (`#e7ecf2`) headings and Slate (`#8c96a3`) secondary copy; switches cleanly to warm Raw Gallery Plaster (`#f7f7f5`) via `[data-theme="light"]`.
- **Ultra-Wide Display + Two-Tone Phrasing**: Headlines use `Unbounded` (`800` weight) and pair primary white/ebony hooks with muted slate continuations in the same block.
- **Restrained Color**: Highlighters remain available for true status and emphasis, not repeated decoration or navigation fills.
- **Open Reading Structure**: `1px` subtle separators organize navigation, run rows, and disclosures; heavy structural frames remain for explicit controls and technical media, not every section.
- **Progressive Detail**: Native non-exclusive disclosures keep all benchmark evidence accessible without presenting it all at once.

---

## 2. Colors

### Base Surfaces & Ink (Dark Mode Default — `:root`)

- **Obsidian Clay** (`#121519` / `--bg-canvas`): Default dark application background.
- **Obsidian Surface** (`#1b2026` / `--bg-surface`): Subtle row hovers, table headers, and callout fills.
- **Obsidian Elevated** (`#222831` / `--bg-elevated`): Dropdown menus and form inputs.
- **Silver White** (`#e7ecf2` / `--text-primary`): Primary headings and high-emphasis copy.
- **Plaster Gray** (`#c2cad6` / `--text-secondary`): Comfortable long-form body text.
- **Slate Dark** (`#8c96a3` / `--text-muted`): Muted headline continuations, kickers, and right-aligned command notes.

### Light Mode Overrides (`[data-theme="light"]`)

- **Raw Gallery Plaster** (`#f7f7f5` / `--bg-canvas`): Warm off-white background.
- **Plaster Alt** (`#ecece6` / `--bg-surface`): Subtle surface fill for table headers and callouts.
- **Ebony Ink** (`#0a0b0d` / `--text-primary`): Crisp near-black text and structural borders.
- **Slate Light** (`#59636d` / `--text-muted`): Readable muted text on Plaster, including metadata, navigation, and input placeholders.

### Semantic Highlighter Swatches

Every highlighter swatch is calibrated to achieve **WCAG AAA (>7:1)** contrast against **Ebony Ink (`#0a0b0d` / `--hl-ink`)**:

| Token | Hex | Contrast vs `#0a0b0d` | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `--hl-acid` | `#c5f82a` | **16.4 : 1 (AAA)** | Primary brand anchor, active tab/nav, hero banner, primary hover drench |
| `--hl-violet` | `#a984ff` | **7.2 : 1 (AAA)** | **Build / Create** — new features, specs (`brief`), architecture (`refactor`) |
| `--hl-mint` | `#5ae67a` | **12.5 : 1 (AAA)** | **Loop / Shipped** — benchmarks, verification, passing checks, active status |
| `--hl-sky` | `#8ce0ff` | **13.6 : 1 (AAA)** | **Run / Automate** — scheduled jobs, CI/CD, background agents, info callouts |
| `--hl-magenta` | `#ff6ed4` | **7.8 : 1 (AAA)** | **You / Guardrails** — user preferences (`steer`, `autonomy`), destructive hover |
| `--accent-cobalt` | `#1a3bf5` | **8.6 : 1 (vs `#fff`)** | Secondary structural action, light-mode prose links and focus rings |

### Named Rules

- **The Highlighter Ink Rule:** Highlighter swatches (`--hl-*`) are **background fills**, never text colors on light surfaces. Text inside any `.hl` or `<mark data-hl>` element must always use `--hl-ink` (`#0a0b0d`), even in dark mode.
- **The Color Structure Rule:** Static application chrome is predominantly monochrome (silver/slate on obsidian, or ebony/slate on plaster). Color is reserved for semantic `.hl` badges, status indicators, and tactile hover/focus states.

---

## 3. Typography

- **Display Font (`--font-display`):** `Unbounded` (Extra Bold `800` only)
- **Body Font (`--font-body`):** `Schibsted Grotesk` (Regular `400`, Bold `700`)
- **Mono Font (`--font-mono`):** `Martian Mono` (Regular `400`, Bold `700`), reserved for code, numbers, and measurement rather than prose/navigation.

### Hierarchy

- **Reading Hero Headline (`.headline-two-tone`)**: `Unbounded 800`, `clamp(1.75rem, 3.2vw, 2.5rem)` (`2.35rem` cap in comparison), line-height `1.3`. The general primitive remains `1.65rem`–`2.5rem` with line-height `1.15`.
- **Section Heading (`h2`) & KPI Figure (`.kpi-val`)**: `Unbounded 800` / `Martian Mono 700`, `1.5rem` (`--text-xl`), line-height `1.15`.
- **Card Heading (`.card-heading`)**: `Unbounded 800`, `1.25rem` (`--text-lg`), line-height `1.2`.
- **Body Copy**: `Schibsted Grotesk 400`, `1rem`–`1.0625rem`, line-height `1.75`–`1.8`, generally capped at `65`–`70ch`.
- **Controls and Metadata**: Schibsted for navigation, filters, summaries, and descriptive labels; metadata at least `0.8125rem`, controls typically `0.9375rem`–`1rem` with `44px` minimum hit targets.
- **Measured Data**: Martian Mono for token counts, duration, cost, code, and telemetry, with tabular numerals. Default run-table metrics are `0.9375rem`.
- **Headings**: Short, two-tone page titles; space and size establish hierarchy rather than competing uppercase labels.

### Named Rules

- **The Five Face Rule (87KB Budget):** Ship at most five webfont files: `Unbounded 800`, `Schibsted Grotesk 400/700`, and `Martian Mono 400/700`. Never load additional weights of `Unbounded` (like `400` or `700`) or italic font files (use browser-synthesized oblique for blockquotes).
- **The Two-Tone Headline Rule:** Write conversational headlines inside a single heading element where the primary statement uses `--text-primary` and the continuation wraps in `<span class="muted">` (`--text-muted`). Both stay at `font-weight: 800` so the contrast comes from color, not an extra font file.

---

## 4. Elevation & Borders

We reject drop shadows, blurs, and gradients. Hierarchy is expressed strictly through border weight and surface contrast.

- **Major Reading Split:** `1px solid var(--border-subtle-color)` on the app header/footer and run ledger.
- **Structural Frame (`--border-frame`):** `2px solid var(--border-strong-color)` remains available for explicit controls and technical media; quiet reading controls may use a `1px` separator.
- **Dense Row Divider (`--border-row`):** `1px solid var(--border-subtle-color)` inside lists, tables, and `.reading-disclosure`.
- **Corner Radius (`--radius-none`):** `0px` across all buttons, badges, inputs, cards, and menus.

### Named Rules

- **The Reading Hierarchy Rule:** Prefer whitespace and subtle separators to outer card cages. Default views surface core single-line outcomes (`Outcome`, `Agent tests`, `Time`, `Tokens`, `Cost`); secondary row sub-notes and deep telemetry belong in labelled disclosures.

---

## 5. Components

All reference implementations live in `tokens.css` and `specimen.html`:

1. **App Navbar & Footer:** Compact, nonsticky navigation and a simple field-note colophon. Active navigation uses an understated underline rather than a highlighter fill.
2. **Buttons & Controls:** Square edges, Schibsted labels, at least `44px` tall. Focus uses a real outline, not a shadow. Semantic primary/destructive treatments retain Neo-Acid ink rules.
3. **Menus & Playbook Lists (`.menu-dropdown`, `.menu-item`, `.command-list`, `.command-row`)**: Dropdown menus use a `2px` frame on `--bg-elevated` with `.hl` verb badges and `.menu-kbd` shortcut hints. Command lists use `1px` row borders with a muted prefix (`/lever`), a `.hl` verb pill, the prompt string, and a right-aligned muted `.note`.
4. **Links (`.prose-link`, `.action-link`, `.card-interactive`)**: In-text links carry a `3px` underline (`--hl-acid` in dark mode, `--accent-cobalt` in light mode) and drench on hover. Whole-card links (`.card-interactive`) drench the entire card surface with `--hl-acid` and switch all inner text (including `.text-muted` and `.section-kicker`) to `--hl-ink` (`#0a0b0d`) so contrast never fails.
5. **Forms:** Search remains immediately visible; harness/provider filters, cost lens, sorting, and extra telemetry sit in “Filter & sort.” Inputs and selects use a theme-aware outline for keyboard focus.
6. **Brutalist Media Frame (`.media-frame`, `.media-canvas`, `.media-caption`, `.media-badge`)**: Wraps images, charts, or video facades in a `2px` border with an absolute top-left `.hl` badge and a `2px` top-bordered `Martian Mono` metadata caption bar.
7. **Tables & Callouts (`.app-table`, `.callout`)**: Tables use a `2px` outer border and `1px` row dividers. Callouts use a `2px` frame with an `8px` left highlighter border (`.callout-mint`, `.callout-magenta`, `.callout-acid`, `.callout-violet`, `.callout-sky`).
8. **Reading Disclosures:** Native `<details>`/`<summary>` elements, closed by default and independently expandable. Keep headings outside summary. Shared hash navigation opens enclosing disclosures and scrolls to the exact target.

---

## 6. Do's and Don'ts

### Do's

- **Do** default to Dark Mode (`:root` Obsidian Clay `#121519`) and support `[data-theme="light"]` (`#f7f7f5`).
- **Do** keep text inside `.hl` / `<mark data-hl>` badges pinned to `#0a0b0d` (`--hl-ink`) in both themes.
- **Do** pair statistical figures (`.stat-value`) with their sample size and range in `Martian Mono`.
- **Do** use `1px` separators and generous spacing on reading surfaces; reserve heavier frames for explicit controls and technical media.

### Don'ts

- **Don't** use drop shadows (`box-shadow` for elevation), linear/radial gradients, or `backdrop-filter` glassmorphism.
- **Don't** round corners (`border-radius: 9999px` or `8px`) on pills, buttons, cards, or inputs — keep everything `0px`.
- **Don't** load extra font weights of `Unbounded` — keep the display family strictly at `800`.
- **Don't** center-align body copy or multi-line cards; keep alignment left-anchored and crisp.

## 7. Benchmark Reading Surfaces

- **Leaderboard:** Model/harness, stage outcome, agent tests, duration, tokens, and billed cost by default (single-line cells). “Show extra row notes” restores secondary sub-notes (`cache hit`, `peak context`, `LLM/tool calls`, `commits`). Outcome buttons reveal stage data and field notes. Search/filter/sort updates are immediate, without row motion. Speed/cost, stage bottlenecks, and controlled comparisons appear as question-led disclosures.
- **Comparison:** Three visible result rows; presets, execution/context metrics, stage breakdown, and cache/accounting each have independent disclosures. Selectors and table headers stay synchronized with URL state and swapping.
- **Run Reports:** Modest metadata, one existing field-note lead, outcome/time/cost. Verification failures remain visible. Plan and notes are readable ledgers; deep technical sections open on demand or through anchors.
- **Methodology:** Clear seven-stage overview. Stage checks, full plan, CLI contract, prompt, and sample transcript open independently; copy controls and all deep links remain available.
- **Mobile:** Run rows stack into clean five-metric reading entries. Comparison tables use container queries, hidden desktop headers, and explicit A/B/difference labels. No page-level horizontal overflow.

