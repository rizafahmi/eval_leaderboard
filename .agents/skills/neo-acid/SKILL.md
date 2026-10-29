---
name: neo-acid
description: Apply Riza Fahmi's personal "Neo-Acid" app design system (brutalist Obsidian/Plaster surfaces, Unbounded 800 two-tone headlines, 5 semantic highlighter swatches, dual 2px/1px borders, and zero shadows/gradients). Use when scaffolding, styling, or auditing web applications, dashboards, developer tools, or landing pages.
---

# Neo-Acid Personal Design System Skill (`neo-acid`)

This skill equips AI coding agents to build and style web applications using Riza Fahmi's **Neo-Acid** design system (`~/code/personal-design-system/neo-acid/`).

## Files in This Kit

- [DESIGN.md](./DESIGN.md): `google-labs-code/design.md`-compliant specification (YAML frontmatter tokens + 6 sections of design rules).
- [tokens.css](./tokens.css): Production-ready CSS custom properties and App Kitchen Sink component primitives (Dark mode default, `[data-theme="light"]` toggle).
- [specimen.html](./specimen.html): Interactive App Kitchen Sink reference (Navbar, Tabs, Breadcrumbs, Buttons, Dropdown Menus, Command Playbook Lists, Links, Forms, Brutalist Media Frames, Tables, Callouts, and Footer).

> **Tip — Enable Globally in Antigravity / Claude Code:**
> Symlink this folder into `~/.gemini/skills/neo-acid` so any workspace automatically discovers it:
> ```sh
> ln -s ~/code/personal-design-system/neo-acid ~/.gemini/skills/neo-acid
> ```

---

## Workflow: Applying Neo-Acid to a Project

When the user asks to apply this design system to a new or existing project:

1. **Read [DESIGN.md](./DESIGN.md) First:**
   Copy `DESIGN.md` to the target project's root directory (or merge its tokens/rules) and add a pointer in the project's `AGENTS.md` / `CLAUDE.md`.
2. **Install or Copy [tokens.css](./tokens.css):**
   Copy `tokens.css` into the project's stylesheet directory (e.g., `src/styles/tokens.css` or `assets/tokens.css`) and import it at the root layout.
3. **Self-Host the 5 Font Faces (The 87KB LCP Rule):**
   Install `@fontsource/unbounded`, `@fontsource/schibsted-grotesk`, and `@fontsource/martian-mono` and load **only** these 5 faces:
   - `Unbounded` (`800` normal) — `--font-display`
   - `Schibsted Grotesk` (`400`, `700` normal) — `--font-body`
   - `Martian Mono` (`400`, `700` normal) — `--font-mono`
4. **Set Dark Mode as Default:**
   Ensure `<html>` defaults to dark mode (`:root` is Obsidian Clay `#121519`) and toggle `data-theme="light"` on `<html>` when switching to Raw Plaster (`#f7f7f5`).

---

## Non-Negotiable Guardrails for Agents

1. **No Shadows, Gradients, or Rounded Pills:**
   - Never use `box-shadow` for elevation, `linear-gradient`/`radial-gradient`, or `backdrop-filter`.
   - Keep `border-radius: 0px` (`--radius-none`) across buttons, badges, inputs, cards, and dropdowns.
2. **The Highlighter Ink Rule (WCAG AAA):**
   - The 5 highlighter tokens (`--hl-acid: #c5f82a`, `--hl-violet: #a984ff`, `--hl-mint: #5ae67a`, `--hl-sky: #8ce0ff`, `--hl-magenta: #ff6ed4`) are **background fills**.
   - Text inside `.hl` or `<mark data-hl="...">` must **always** use `--hl-ink` (`#0a0b0d`), even in dark mode.
3. **The Two-Tone `Unbounded 800` Headline Pattern:**
   - Write hero/section headlines inside a single heading tag using `.headline-two-tone`, wrapping the conversational second sentence in `<span class="muted">`. Both remain `font-weight: 800` so no extra font weight is downloaded.
4. **The Dual Border Rule:**
   - Use `4px solid var(--border-strong-color)` (`--border-split`) for major header/footer splits.
   - Use `2px solid var(--border-strong-color)` (`--border-frame`) for cards, buttons, inputs, dropdowns, and outer table frames.
   - Use `1px solid var(--border-subtle-color)` (`--border-row`) for repeating rows inside `.command-list` and `.app-table`.
5. **Card-Wrapping Link Contrast:**
   - When an `<a>` wraps a card (`.card.card-interactive`), hovering drenches the card with `--hl-acid` and forces all child text (including `.text-muted` and `.section-kicker`) to `--hl-ink` (`#0a0b0d`).

---

## Quick Component Class Reference

| UI Element | Classes in `tokens.css` |
| :--- | :--- |
| **App Header & Nav** | `.app-navbar`, `.app-brand`, `.app-brand-mark`, `.app-nav-links`, `.app-nav-item.is-active` |
| **Tabs & Breadcrumbs** | `.app-tabs`, `.app-tab.is-active`, `.app-breadcrumbs` |
| **Two-Tone Headline** | `<h1 class="headline-two-tone">Hook. <span class="muted">Continuation.</span></h1>` |
| **Highlighter Badges** | `.hl.hl-acid`, `.hl.hl-violet`, `.hl.hl-mint`, `.hl.hl-sky`, `.hl.hl-magenta`, `<mark data-hl="violet">` |
| **Buttons** | `.btn`, `.btn-secondary`, `.btn-acid`, `.btn-cobalt`, `.btn-danger`, `.btn-sm`, `.btn-lg`, `.btn-group` |
| **Menus & Playbooks** | `.menu-dropdown`, `.menu-header`, `.menu-item`, `.menu-kbd`, `.command-list`, `.command-row` |
| **Links** | `.prose-link`, `.action-link`, `.card.card-interactive` |
| **Forms & Prompts** | `.field`, `.field-label`, `.command-input-wrap`, `.command-input-prefix`, `.input`, `.select`, `.check-input` |
| **Cards & Media** | `.card`, `.stat-value`, `.media-frame`, `.media-canvas`, `.media-badge`, `.media-caption` |
| **Tables & Callouts** | `.app-table`, `.callout.callout-mint`, `.callout.callout-magenta`, `.callout.callout-acid` |
| **Footer** | `.app-footer`, `.app-footer-grid`, `.app-footer-col`, `.app-footer-colophon`, `.status-dot` |
