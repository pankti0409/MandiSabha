# Mobile Responsive Retrofit & Premium Quality Audit

## Project Context
- **Project**: Mandi Sabha / VyaaparMitra (Agricultural Multi-Agent Market Intelligence)
- **Framework**: Next.js 16.3 (App Router), Tailwind CSS v4, Framer Motion, Lucide Icons
- **Target Breakpoints**:
  - `375px`: Small mobile (iPhone SE / standard phone portrait)
  - `414px`: Large mobile (iPhone Pro Max / Pixel XL)
  - `768px`: Tablet portrait / Large phone landscape
  - `1024px`: Tablet landscape / Laptop
  - `1440px`: Full desktop

## Constraints Enforced
- [x] **Zero component rewrites**: Existing components, props, logic, and structures preserved.
- [x] **Zero color scheme disruption**: Exact brand palette (`--primary: #059669`, `--accent: #F59E0B`, dark/light tokens) preserved 100%.
- [x] **Zero desktop layout changes**: Desktop multi-column grid, sidebar, landing sections remain exactly intact.

---

## Page & Component Inventory

### System & Core Architecture
- [x] **Global Viewport & Safe Areas**
  - Added Next.js `Viewport` export in `app/layout.tsx` with `viewportFit: cover`, `device-width`, and dynamic theme colors.
  - Safe area environment variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) integrated into CSS root tokens.
- [x] **Global Overflow-X Guard**
  - `overflow-x: clip` applied to `html` and `body` without breaking `position: sticky`.
  - Tap highlight color disabled (`-webkit-tap-highlight-color: transparent`) for native mobile feeling.
  - Touch delay removed (`touch-action: manipulation`).
  - Fluid media scaling (`img, video, canvas, svg { max-width: 100%; height: auto; }`).
- [x] **Mobile Typography & Ergonomics**
  - Fluid clamp scales for `.page-title` and `.page-subtitle`.
  - Min 44px tap targets for buttons on coarse pointers (`@media (pointer: coarse)`).
  - Mobile iOS input auto-zoom prevention (`font-size: 16px` on coarse pointers).
- [x] **Scroll & Performance Polish**
  - Ultra-clean, low-opacity rounded scrollbars with zero background tint.
  - Smooth momentum touch scrolling for all horizontal overflow tables (`-webkit-overflow-scrolling: touch`).

### Surfaces
- [x] **Landing Page (`/` - `MandiLanding`)**
  - Scroll video with stage dots, responsive hero headline clamp, fluid stats bar (`grid-cols-2 md:grid-cols-4`), 3-step cards, and FAQ accordion.
- [x] **App Shell (`components/app-shell.tsx`)**
  - Sticky mobile header with leaf emblem and live news marquee.
  - Collapsible mobile navigation flyout.
  - Fixed mobile bottom navigation with safe-area bottom elevation.
- [x] **Dashboard (`/dashboard`)**
  - Mobile-responsive greeting header, 4-stat metric grid, chart card, and mandi price cards.
- [x] **Mandi Explorer (`/explore`)**
  - Search input, head-to-head comparison cards, and full quotation table with horizontal touch-scroll and sticky header.
- [x] **Live Sabha & Results (`/sabha/[id]`)**
  - Multi-agent progress bar, 3-column live workspace adapting to stacked cards on phone, and GIS highway telemetry radar.
- [x] **Sabha History (`/history`)**
  - Trade ledger summary stats, crop filter chips with horizontal scroll, and responsive trade session cards.
- [x] **Settings & Preferences (`/settings`)**
  - Profile form, language selector, theme toggles, and crop selection chips.
- [x] **Auth Surfaces (`/login`, `/signup`)**
  - Auth layout with responsive mobile header and card sizing.
