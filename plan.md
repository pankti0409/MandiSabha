# PROJECT LOCATION (non-negotiable)
ALL work happens inside the existing `fe/` folder. This is a frontend-only project. Do not create or edit anything outside `fe/`, except reading the zip and `.agent/`. Run every command from `fe/` (`npm install`, `npm run dev`, `npm run lint`, `npx tsc --noEmit`, `npm run build`). If `fe/` is a git repo, commit a "baseline before plan2" checkpoint first. If it is not, run `git init` inside `fe/` and commit.

# WORKING STYLE
Complete everything in one continuous run: brief plan artifact, implement, verify in the browser, fix, repeat. Do not stop for approval. Before writing UI code, discover and read every relevant skill in `.agent/skills/` (frontend design, React/Next.js, Tailwind, accessibility, animation, browser verification) and follow `.agent/rules/`. Prefer this plan where a skill conflicts with it. Keep the existing palette tokens, fonts, illustration style, routes, typed API client, SSE contract, i18n keys and Demo Mode numbers (20 quintals of onions, Surat best at ₹2,140/q, freight ₹6,200, net ₹36,600, +₹8,200 vs local). Do not rewrite from scratch.

# JOB 1: ADD THE SCROLL ANIMATION FROM THE ZIP (landing page only)

## 1.1 Extract and inspect
1. Find the new zip in the workspace root and extract it to a temporary folder (for example `/tmp/scroll-zip`), NOT into `fe/`.
2. Inspect what the animation is made of: an image sequence (frames), a video, Lottie/JSON, SVG, canvas/WebGL code, a GSAP/ScrollTrigger snippet, or a React/HTML component. Write a short note on what you found and which implementation approach you chose.
3. **Take ONLY the scroll animation.** Do not import any other content from the zip: no pages, headings, copy, navbar, footer, buttons, fonts, global CSS, layout wrappers, or unrelated assets. If the zip contains a full demo site, extract just the animation logic and its assets.
4. Copy only the required assets into `fe/public/scroll-anim/` (or `fe/components/landing/scroll-anim/` for code). Optimize: convert frames to WebP or AVIF where sensible, keep the total payload reasonable for Vercel free tier and low bandwidth, and lazy-load. Remove unused files. Document licences or credits if the zip includes any.

## 1.2 Implement as one reusable component
Create `fe/components/landing/ScrollAnimation.tsx` (client component, dynamically imported, `ssr: false` where needed).
- Bind progress to scroll with `useScroll` and `useTransform` (or the technique the zip already uses if it is better). Use a sticky pinned stage inside a tall scroll track (for example a 300 to 500vh wrapper with a `sticky top-0 h-dvh` stage) so the animation scrubs smoothly as the user scrolls.
- If it is an image sequence: preload progressively, draw to a `<canvas>` with `requestAnimationFrame`, cap DPR at 2, show a skeleton until the first frames are ready, and reduce frame count on small screens or slow connections.
- Pause or unmount when off-screen (IntersectionObserver). Clean up all listeners.
- Respect `prefers-reduced-motion` and `Save-Data`: show one static representative frame instead.
- Keep it `aria-hidden` (decorative) unless it carries meaning, and never trap scroll or block interaction.
- Do NOT add any other scroll animations anywhere else in the project, and do not remove existing scroll reveals unless they conflict. This job adds this one animation only.

## 1.3 Place it in the landing page
Put it in a full-bleed section on `/`, positioned where it strengthens the story (after the hero and before or as part of "How it works"). Give the section a clear heading and short supporting copy in all three languages (en, hi, gu, added to `locales/`). Overlay text must fade in and out in step with the scroll so it never covers the focal part of the animation. The section must not cause horizontal scroll or layout shift, and must degrade gracefully on mobile.

## 1.4 Transparency: make the animation clear
- Inspect the frames or layers for baked-in backgrounds (solid black/white, gradients, shadows). Remove or neutralize them so the animation sits cleanly on the page background. Options in order of preference: use assets that already have alpha; key out a flat background in a build script; or blend with `mix-blend-mode` (`multiply` on light, `screen` on dark) and a soft radial `mask-image` so edges dissolve into the page.
- Tune opacity so the subject is crisp and high-contrast, and any decorative layers behind it are subtle. No muddy, washed-out, or ghosted look. Nothing overlapping the animation may reduce its legibility, and headings and body text placed over it must stay at WCAG AA contrast.
- Expose the tuning as named constants at the top of the file (`SUBJECT_OPACITY`, `BACKDROP_OPACITY`, `BLEND_MODE_LIGHT`, `BLEND_MODE_DARK`, `EDGE_MASK`) so it can be adjusted quickly. Verify in both themes.

## 1.5 Recolor to match the site
- Recolor the animation to the existing palette instead of using its original colors. Light "Pine & Saffron": deep pine, saffron accent, warm ivory, terracotta and lagoon teal only for small data touches. Dark "Night Harvest": fresh green, saffron-gold, deep green-charcoal, cyan for live-data highlights only. Use the actual CSS variables from `globals.css`, not new hex values.
- Technique by asset type: for SVG or Lottie, map fills and strokes to CSS variables; for raster frames or video, use a duotone or gradient-map approach (SVG `feColorMatrix` or `feComponentTransfer` filter, or CSS `filter` with hue-rotate, saturate, brightness, contrast) tuned per theme, or re-render frames with a build script using the palette. Provide separate tuning for light and dark, and transition smoothly on theme change.
- The result must feel native to the site: same warmth, same restraint, no foreign neon or off-palette colors. Verify with screenshots in both themes.

# JOB 2: FULL-WIDTH, REAL-WEBSITE LAYOUT (whole project)
The current UI sits in a narrow centered column and leaves large empty side areas. Make the whole frontend fill the screen like a real, professional website or SaaS app.

**Marketing pages (`/`)**
- Sections are full-bleed (backgrounds, washes and dividers span the full viewport width). Inner content uses one consistent container: `w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10` (and up to `max-w-[1600px]` on 2xl). Use multi-column grids that actually use the width (12-column grid, asymmetric splits like 7/5), not a single narrow column.
- Navbar spans full width with content aligned to the same container. Footer is a full-width, multi-column footer.

**App shell (`/dashboard`, `/sabha/*`, `/explore`, `/history`, `/settings`)**
- Use a true application layout: `min-h-dvh` root, fixed or sticky left Sidebar (about 264px, collapsible to an icon rail) on `md+`, a sticky top bar, and a main region `flex-1 min-w-0` that fills the remaining width with padding `px-4 md:px-6 lg:px-8`. Remove `max-w-3xl`/`max-w-4xl mx-auto` wrappers on app pages. BottomTabs below `md`.
- Pages use responsive grids that fill the space: dashboard stat cards in a 1 / 2 / 4 column grid, charts side by side, tables at 100% width with sticky headers and horizontal scroll only inside the table container. Live Sabha uses the full viewport height (`h-[calc(100dvh-topbar)]`) with independently scrolling panels and no page-level double scrollbars. Result, Explore and History use 2 to 3 column layouts on wide screens. Settings uses a left sub-navigation plus a wide content pane.
- Forms (New Sabha, Settings) use a two-column layout on desktop (form left, live summary/map right) instead of a small centered card.

**Rules**
- Use `dvh` units, never `100vh` alone. No horizontal page scroll at any width. Use `min-w-0` on flex and grid children to prevent overflow.
- Audit and test at 360, 390, 768, 1024, 1280, 1440, 1920 and 2560 px. On ultra-wide screens content stays readable (capped container, backgrounds still full-bleed), never a small island in the middle.
- Keep spacing on the 4/8pt scale, three radii, three elevations, one button system, one icon stroke. Equal-height cards in rows, aligned numeric columns, consistent headers and filter bars across pages.
- Every page keeps loading, empty, error and offline states, with skeletons that match the new layout.

# JOB 3: COMPLETE, ELEGANT AUTHENTICATION
Build authentication as a complete, standard, production-style system.

## 3.1 Structure and layout (login and signup)
- Use a standard split-screen auth layout in a shared `(auth)/layout.tsx`: left brand panel (about 45 to 50% width, hidden below `lg`) with the logo, a short value proposition, a hand-drawn crop illustration, a subtle soft wash, and a small trust line; right panel with the form vertically centered in a clean card-less column (max width about 440px) on the page background. Mobile shows a compact top brand header and the form full width. Include a language switcher and theme toggle in the top corner, and a "Back to home" link.
- Clear hierarchy: title, one-line subtitle, fields, primary button, secondary links. Consistent 48px inputs, labels above fields, inline helper/error text with reserved space, visible focus rings, and a clear progress indicator on multi-step forms.

## 3.2 Flows (mobile number + OTP, matching the existing API contract)
- **Login:** step 1 mobile (+91 prefix chip, Zod: 10 digits starting 6 to 9, strip spaces and +91), step 2 OTP. Smooth slide between steps, masked number ("+91 98•••••210"), "Change number" link, "Remember me on this device" checkbox that only affects cookie lifetime, and links to Signup and Help. If the number is not registered, show "No account found. Create one?" and pre-fill signup.
- **Signup:** 3 clear steps with a stepper: (1) Account: name, mobile, language (switches the UI instantly); (2) Farm details: village, district (autocomplete over a bundled Gujarat + Maharashtra list, extensible), crops as illustrated multi-select chips (min 1), optional default transport cost per km; (3) Verify: OTP. Required consent checkbox for Terms and Privacy (placeholder pages `/terms` and `/privacy`, localized). Preserve all input when going back or on error. On success show a short "Welcome, {name}" moment and route to `/dashboard` with the first-run checklist.
- **OtpInput:** 6 boxes, auto-advance, backspace goes back, paste splits digits, `autocomplete="one-time-code"`, WebOTP where available, auto-submit on the sixth digit, shake plus inline error on a wrong code, 30s resend countdown, lockout for 30s after 5 failures, and screen-reader announcements.
- Optional but recommended: "Continue with email" is NOT required. Keep mobile + OTP as the primary method and do not invent backend endpoints.

## 3.3 Session, security and routing
- Route Handlers in `fe/app/api/auth/`: `otp/request`, `otp/verify`, `logout`, `session` (and `refresh` if the contract supports it). In Demo Mode any valid mobile works, the OTP is `123456`, and a "Demo code: 123456" chip is shown. In real mode proxy to FastAPI and set an `httpOnly; Secure; SameSite=Lax` cookie with the JWT. Never store tokens in localStorage or expose them to client JS.
- `middleware.ts` protects `/dashboard`, `/sabha/*`, `/explore`, `/history`, `/settings`. Logged-out users go to `/login?next=<path>` and return there after login (validate `next` to allow only same-origin relative paths, to prevent open redirects). Logged-in users visiting `/login` or `/signup` go to `/dashboard`.
- `AuthProvider` with `useAuth()` exposing `user`, `status` (loading | authenticated | anonymous), `login`, `signup`, `logout`, `refresh`. A 401 anywhere clears the session, clears the React Query cache, redirects to `/login`, and shows the toast "Session expired. Please log in again."
- Logout: confirm dialog, clear cookie, clear caches, redirect to `/`. Add a profile/avatar menu in the Navbar and Sidebar with Settings and Logout.
- Rate-limit UX (lockouts, resend timers), double-submit prevention, CSRF-safe handler design (same-site cookie, method checks, origin checks in Route Handlers), input sanitization, no sensitive data in URLs or logs, and generic error messages that don't reveal account existence beyond the explicit "not registered" step already specified.
- Handle edge cases: expired OTP, network failure with Retry, browser back button behavior, refresh mid-flow (restore step from sessionStorage for non-sensitive fields only, wrapped in try/catch), and unauthorized API responses.

## 3.4 Auth i18n and accessibility
- All strings in `locales/{en,hi,gu}` with natural Hindi and Gujarati; layouts survive 30 to 40% longer text; correct fonts per script.
- Labels tied to inputs, `aria-describedby` for errors, `aria-live` announcements, focus moves to the first invalid field or the next step heading, keyboard-only completion possible, 44px touch targets, and AA contrast in both themes.

# VERIFICATION (after each job, not only at the end)
Use the browser tool in light and dark, English, Hindi and Gujarati, at the widths listed in Job 2.
1. Landing: the scroll animation scrubs smoothly, is crisp and clearly visible in both themes, matches the palette, causes no horizontal scroll or layout shift, and falls back to a static frame under reduced motion.
2. Every page fills the screen properly with no narrow centered island, no double scrollbars, and no overflow.
3. Auth end to end in Demo Mode: signup (all 3 steps) then OTP then dashboard; refresh keeps the session; logout clears it; `/dashboard` while logged out redirects to `/login?next=/dashboard` and returns after login; a wrong OTP shakes and never crashes; lockout and resend timers work; an unregistered number shows the create-account prompt.
4. Run `npm run lint`, `npx tsc --noEmit` and `npm run build` inside `fe/` and fix everything. No console errors or hydration warnings.
5. Save before and after screenshots to `fe/docs/screenshots/plan2/` and write `fe/docs/CHANGELOG-plan2.md` (what changed, which skills were used for what, known limitations).

# DEFINITION OF DONE
- The zip's scroll animation, and nothing else from the zip, is live on the landing page, clear (not washed out), and recolored to the site palette in both themes.
- The whole frontend fills the screen like a real website, with full-bleed sections on the landing page and a proper full-width app shell everywhere else.
- Login and signup follow a standard, elegant split-screen structure, and the complete auth system works end to end with protected routes and session handling.
- Lint, type-check and build pass, and screenshots plus the changelog are delivered inside `fe/docs/`.

Start now with the plan artifact, then proceed through Job 1, Job 2 and Job 3 without stopping.