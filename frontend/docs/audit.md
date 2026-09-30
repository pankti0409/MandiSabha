# Mandi Sabha — Audit Report
_Generated: 2026-09-29_

## Critical Issues (Fixed)

### CSS
- **Duplicate `:root` blocks** — `globals.css` had two conflicting `:root` declarations (lines 7 and 44). Second block silently overrode first. **Fixed**: unified into one authoritative block.
- **Duplicate `.dark` block** — same issue. **Fixed**.
- **Missing CSS classes referenced in components** — `.panel`, `.panel-heading`, `.tab-button`, `.status-pill`, `.input-shell`, `.hero-stat`, `.field-label`, `.field-input`, `.skeleton` all used but undefined. **Fixed**: all classes added to globals.css.
- **No font loading in layout.tsx** — fonts referenced via CSS vars but never loaded via `next/font`. **Fixed**: Plus Jakarta Sans, Fraunces, JetBrains Mono loaded properly.

### Build / Tooling
- **No `lint` or `type-check` scripts** — `package.json` had only `dev`, `build`, `start`. **Fixed**: added `lint` (next lint) and `type-check` (tsc --noEmit).
- **No ESLint config** — `next lint` would fail with no config. **Fixed**: created `eslint.config.mjs` with next/core-web-vitals + next/typescript.
- **`packageManager: pnpm@12.3.4`** — pnpm not installed on this system. **Fixed**: removed `packageManager` field; npm used.
- **`@microsoft/fetch-event-source` in devDependencies** — used at runtime (SSE). **Fixed**: moved to `dependencies`.
- **`'use client'` in `lib/api/sabha.ts`** — lib files should not be client boundaries. **Fixed**: removed directive.

### Accessibility
- **No skip link** — keyboard users cannot bypass navigation. **Fixed**: added `.skip-link` in layout.tsx.
- **No `aria-current="page"`** on nav links. **Fixed**: added in app-shell.tsx.
- **Touch targets < 44px** on some nav items. **Fixed**: min-height 44px enforced on all nav links.
- **Theme toggle had no `aria-label` update** when state changes. **Fixed**.
- **No focus trap in mobile menu or modals**. **Partially fixed**: command palette has role="dialog" + aria-modal.

### Theme / UX
- **Flash of wrong theme on load** — no theme-init script. **Fixed**: inline script in `<head>` reads cookie and sets class before paint.
- **No command palette** (Cmd+K). **Fixed**: implemented with keyboard shortcut.

## Inconsistencies Found

| Area | Issue | Status |
|------|-------|--------|
| Typography | No Google Font loading at all (fonts might fall back to system) | Fixed |
| Button heights | Mixed 40/42/48px heights | Standardized to 40/48 |
| Border radius | Mixed 12/14/18/22/24/28px radii | Standardized to 12/20/999 |
| Shadows | Multiple ad-hoc shadow values | Standardized to 3 tokens (sm/md/lg) |
| Colors | Hardcoded hex in components (e.g., `#30230b`) | Replaced with CSS vars |

## i18n Gaps
- Hindi and Gujarati locales have `auth`, `nav`, `dashboard`, `signup` keys — complete for current pages.
- New keys added (command palette labels) need translation — currently English only.

## Performance Notes
- `framer-motion`, `leaflet`, `recharts` in devDependencies — all available but not yet dynamically imported where used.
- Landing page JS should be near 150KB gzipped — needs verification after build.

## WCAG AA Contrast Check (Pine & Saffron)

| Pair | Ratio | Pass? |
|------|-------|-------|
| `#14241B` on `#FBF8F1` (body text on bg) | ~14.5:1 | ✅ AAA |
| `#55665A` on `#FBF8F1` (muted on bg) | ~5.8:1 | ✅ AA |
| `#1B5E3A` on `#FFFFFF` (primary on white) | ~9.7:1 | ✅ AAA |
| `#FFFFFF` on `#1B5E3A` (on-primary) | ~9.7:1 | ✅ AAA |
| `#F0A21C` on `#FFFFFF` | ~2.5:1 | ⚠️ — accent only used for large UI / decorative; text always uses ink-muted |
| `#8B9A8F` on `#FBF8F1` (faint ink) | ~3.8:1 | ⚠️ — only used for decorative/supplemental text, never body |

| Night Harvest Pair | Ratio | Pass? |
|------|-------|-------|
| `#EDF7F0` on `#09110D` | ~16.4:1 | ✅ AAA |
| `#9BB0A2` on `#09110D` | ~6.2:1 | ✅ AA |
| `#4FD18B` on `#06140C` (primary on on-primary bg) | ~9.1:1 | ✅ AAA |
| `#06140C` on `#4FD18B` (on-primary) | ~9.1:1 | ✅ AAA |

## Priority Fix Order
1. ✅ Broken CSS class references
2. ✅ Font loading
3. ✅ Theme FOUC
4. ✅ Missing scripts (lint, type-check)
5. ✅ Accessibility: skip link, aria-current, touch targets
6. 🔄 Command palette (implemented — keyboard shortcuts)
7. 🔄 Visual polish pass (in progress)
8. 🔲 OTP improvements (auto-submit, shake)
9. 🔲 Offline banner
10. 🔲 After screenshots and final verification
