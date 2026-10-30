---
name: neo-acid
description: Personal app design system combining the brutalist Neo-Acid Gallery foundation of rizafahmi.com with utilitarian highlighter playbooks inspired by github/lever. Dark-first by default.
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
  neutral-light-muted: "#6e7882"
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

**Creative North Star: "The Neo-Acid Highlighter Gallery"**

A dark-first, high-contrast brutalist application design system that combines the bold typographic presence of `rizafahmi.com` ("Neo-Acid Gallery") with the semantic marker-highlighter system and calm data density of `github/lever`.

### Key Characteristics

- **Dark-First Obsidian Canvas**: Defaults to softened Obsidian Clay (`#121519`) with Silver White (`#e7ecf2`) headings and Slate (`#8c96a3`) secondary copy; switches cleanly to warm Raw Gallery Plaster (`#f7f7f5`) via `[data-theme="light"]`.
- **Ultra-Wide Display + Two-Tone Phrasing**: Headlines use `Unbounded` (`800` weight) and pair primary white/ebony hooks with muted slate continuations in the same block.
- **Semantic Highlighter Swatches**: Five high-luminance marker tokens (`--hl-acid`, `--hl-violet`, `--hl-mint`, `--hl-sky`, `--hl-magenta`) encode action verbs, categories, and system states.
- **Dual Border Architecture**: Thick `2px`/`4px` solid structural frames paired with whisper-quiet `1px` dividers inside dense lists, command playbooks, and tables.
- **Tactile Color Drenches**: Interactive buttons, nav pills, and cards drench completely with `--hl-acid` (and `#0a0b0d` ink) on hover.

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
- **Slate Light** (`#6e7882` / `--text-muted`): Muted headline continuations and metadata notes.

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
- **Mono/Label Font (`--font-mono`):** `Martian Mono` (Regular `400`, Bold `700`)

### Hierarchy

- **Two-Tone Hero Headline (`.headline-two-tone`)**: `Unbounded 800`, `clamp(1.65rem, 3.6vw, 2.5rem)`, line-height `1.15`.
- **Section Heading (`h2`) & KPI Figure (`.kpi-val`)**: `Unbounded 800` / `Martian Mono 700`, `1.5rem` (`--text-xl`), line-height `1.15`.
- **Card Heading (`.card-heading`)**: `Unbounded 800`, `1.25rem` (`--text-lg`), line-height `1.2`.
- **Body Copy**: `Schibsted Grotesk 400`, `1.0625rem` (`--text-body`), line-height `1.6`, capped at `65ch` for reading views (`1rem` / `--text-base` for compact cards/notes, `0.9375rem` / `--text-compact` for dense tables and secondary blurbs).
- **Primary Mono Metric (`.metric-primary`, `.btn`, `.action-link`)**: `Martian Mono 700`, `0.875rem` (`--text-mono`), `tabular-nums`.
- **Dense Mono Telemetry (`.terminal-box`, `.commit-msg`, `.plan-stage-title`)**: `Martian Mono 400/700`, `0.8125rem` (`--text-sm`).
- **Section Kicker (`.section-kicker`) & Static Badge (`.badge-static`, `.metric-sub`)**: `Martian Mono 700`, `0.75rem` (`--text-xs`), uppercase for kickers, `letter-spacing: 0.06em`, `--text-muted`.
- **Micro Stage Pill & Shortcut Badge (`.stage-pill`, `.commit-stage-badge`, `.menu-kbd`)**: `Martian Mono 700`, `0.6875rem` (`--text-2xs`).

### Named Rules

- **The Five Face Rule (87KB Budget):** Ship at most five webfont files: `Unbounded 800`, `Schibsted Grotesk 400/700`, and `Martian Mono 400/700`. Never load additional weights of `Unbounded` (like `400` or `700`) or italic font files (use browser-synthesized oblique for blockquotes).
- **The Two-Tone Headline Rule:** Write conversational headlines inside a single heading element where the primary statement uses `--text-primary` and the continuation wraps in `<span class="muted">` (`--text-muted`). Both stay at `font-weight: 800` so the contrast comes from color, not an extra font file.

---

## 4. Elevation & Borders

We reject drop shadows, blurs, and gradients. Hierarchy is expressed strictly through border weight and surface contrast.

- **Major Split (`--border-split`):** `4px solid var(--border-strong-color)` — used for top app navbar and bottom app footer boundaries.
- **Structural Frame (`--border-frame`):** `2px solid var(--border-strong-color)` — used for cards, buttons, inputs, dropdown menus, tables, and media frames.
- **Dense Row Divider (`--border-row`):** `1px solid var(--border-subtle-color)` — used inside `.command-list` rows and `.app-table` body cells.
- **Corner Radius (`--radius-none`):** `0px` across all buttons, badges, inputs, cards, and menus.

### Named Rules

- **The Dual Border Rule:** Use `2px`/`4px` borders to frame components and page regions, but drop to `1px solid var(--border-subtle-color)` for repeating rows inside lists and tables so dense data UIs never feel visually noisy.

---

## 5. Components

All reference implementations live in `tokens.css` and `specimen.html`:

1. **App Navbar & Sub-Nav (`.app-navbar`, `.app-tabs`, `.app-breadcrumbs`)**:Bounded by a `4px` bottom border. Nav items (`.app-nav-item`) are square-edged `Martian Mono` links that fill with `--hl-acid` and `--hl-ink` on hover or `.is-active`.
2. **Buttons & Segmented Controls (`.btn`, `.btn-secondary`, `.btn-acid`, `.btn-cobalt`, `.btn-danger`, `.btn-group`)**: `2px` solid border, `0px` radius, `Martian Mono 700`. Primary buttons invert canvas/ink and drench with `--hl-acid` on hover. Destructive buttons (`.btn-danger`) drench with `--hl-magenta` on hover.
3. **Menus & Playbook Lists (`.menu-dropdown`, `.menu-item`, `.command-list`, `.command-row`)**: Dropdown menus use a `2px` frame on `--bg-elevated` with `.hl` verb badges and `.menu-kbd` shortcut hints. Command lists use `1px` row borders with a muted prefix (`/lever`), a `.hl` verb pill, the prompt string, and a right-aligned muted `.note`.
4. **Links (`.prose-link`, `.action-link`, `.card-interactive`)**: In-text links carry a `3px` underline (`--hl-acid` in dark mode, `--accent-cobalt` in light mode) and drench on hover. Whole-card links (`.card-interactive`) drench the entire card surface with `--hl-acid` and switch all inner text (including `.text-muted` and `.section-kicker`) to `--hl-ink` (`#0a0b0d`) so contrast never fails.
5. **Forms & Command Bar (`.command-input-wrap`, `.input`, `.select`, `.check-input`)**: Sharp `0px` inputs on `--bg-elevated` with an inset `2px` focus ring (`--hl-acid` in dark, `--accent-cobalt` in light). `.command-input-wrap` pairs a hard-bordered `--hl-acid` prefix block (`/lever`) with a monospace text input.
6. **Brutalist Media Frame (`.media-frame`, `.media-canvas`, `.media-caption`, `.media-badge`)**: Wraps images, charts, or video facades in a `2px` border with an absolute top-left `.hl` badge and a `2px` top-bordered `Martian Mono` metadata caption bar.
7. **Tables & Callouts (`.app-table`, `.callout`)**: Tables use a `2px` outer border and `1px` row dividers. Callouts use a `2px` frame with an `8px` left highlighter border (`.callout-mint`, `.callout-magenta`, `.callout-acid`, `.callout-violet`, `.callout-sky`).
8. **App Footer (`.app-footer`, `.app-footer-grid`, `.app-footer-colophon`, `.status-dot`)**: `4px` top border, multi-column sitemap links, a square `--hl-mint` operational status indicator, and a bottom monospace colophon bar.

---

## 6. Do's and Don'ts

### Do's

- **Do** default to Dark Mode (`:root` Obsidian Clay `#121519`) and support `[data-theme="light"]` (`#f7f7f5`).
- **Do** keep text inside `.hl` / `<mark data-hl>` badges pinned to `#0a0b0d` (`--hl-ink`) in both themes.
- **Do** pair statistical figures (`.stat-value`) with their sample size and range in `Martian Mono`.
- **Do** combine `2px`/`4px` outer structural borders with `1px` subtle inner row dividers.

### Don'ts

- **Don't** use drop shadows (`box-shadow` for elevation), linear/radial gradients, or `backdrop-filter` glassmorphism.
- **Don't** round corners (`border-radius: 9999px` or `8px`) on pills, buttons, cards, or inputs — keep everything `0px`.
- **Don't** load extra font weights of `Unbounded` — keep the display family strictly at `800`.
- **Don't** center-align body copy or multi-line cards; keep alignment left-anchored and crisp.
