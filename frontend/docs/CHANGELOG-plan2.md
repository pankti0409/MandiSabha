# Mandi Sabha — Plan 2 Changelog

## 🚀 Key Deliverables Implemented

### 1. Job 1: Scroll Animation Integration (`/`)
- **Extracted & Optimized:** Extracted only the required animation logic and optimized WebP frame sets from `mandi-sabha-scroll-animation.zip` into `fe/public/scroll-anim/` (240 desktop frames, 120 mobile frames, poster).
- **Reusable Component (`ScrollAnimation.tsx`):** Built canvas-based RAF interpolation engine with DPR capping, nearest loaded frame fallback, progressive preloading, and scroll-scrubbing.
- **Visual Harmonization:**
  - Radial vignette edge mask to dissolve boundaries smoothly into the page.
  - Themed color grading tuned for Pine & Saffron (`contrast(1.04) saturate(1.08)`) and Night Harvest dark mode.
  - Exposed tuning parameters (`SUBJECT_OPACITY`, `BACKDROP_OPACITY`, `BLEND_MODE_LIGHT`, `BLEND_MODE_DARK`, `EDGE_MASK`).
- **Trilingual Synchronized Overlays:** Narrated captions in English, Hindi, and Gujarati synchronized with scroll progress (0-30%, 35-65%, 70-100%).
- **Accessibility:** `prefers-reduced-motion` and `Save-Data` fallback displaying high-res poster and summary card.

### 2. Job 2: Full-Width Real-Website Layout (Across Entire Project)
- **Marketing Page (`/`):** Full-bleed sections spanning viewport width with container constraint (`max-w-[1440px]` / `2xl:max-w-[1600px]`), 12-column asymmetric grids, full-width responsive header, and multi-column footer.
- **Application Shell (`AppShell`):**
  - True `min-h-dvh` layout with sticky 264px collapsible left sidebar on `md+`.
  - Sticky top bar with breadcrumbs, command palette trigger (`Cmd/Ctrl+K`), quick language switcher (EN/HI/GU), theme toggle, and profile avatar dropdown.
  - Bottom navigation bar on mobile (`< md`).
  - Removed narrow column constraints on app pages (`/dashboard`, `/explore`, `/history`, `/settings`, `/sabha/*`).
- **Responsive Form Layouts:** Two-column desktop grid for New Sabha and multi-tab Settings.

### 3. Job 3: Complete, Production-Grade Authentication
- **Split-Screen Auth Layout (`AuthLayout`):**
  - Left brand panel (48% width on `lg+`) with Mandi Sabha logo, hand-drawn crop highlights, live sample verified result, and farmer trust metrics (*Zero commissions, e-NAM verified*).
  - Right form column with centered 440px layout, language switcher, and theme toggle.
- **Login Flow:**
  - 2-step phone authentication (+91 prefix, 10-digit validation).
  - 6-box auto-advancing `OtpInput` with paste handling, demo code autofill, and 30s resend timer.
  - "Remember me on this device" support.
- **Signup Flow:**
  - 3-step progressive stepper:
    1. Account (Name, Mobile, Language)
    2. Farm Details (Village, District auto-suggest, Produce chips, Transport rate)
    3. Verification (6-box OTP + Terms/Privacy consent)
- **Session & Routing Security:**
  - `middleware.ts` protecting `/dashboard`, `/sabha/*`, `/explore`, `/history`, `/settings`.
  - HTTP-only session cookies with 30-day persistence.
  - Prevention of open redirects on `next` query parameter.
  - Added localized `/terms` and `/privacy` placeholder routes.

---

## 🛠️ Verification & Build Status
- **TypeScript:** `npx tsc --noEmit` — 0 errors
- **ESLint:** `npm run lint` — 0 errors
- **Production Build:** `npm run build` — 17/17 routes compiled cleanly
- **Dev Server:** Active at `http://localhost:3000` (`HTTP 200 OK`)
