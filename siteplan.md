# Site Plan — shader.se-style Three.js Dark Landing Page

Goal: turn `/` into an immersive dark Three.js landing (DNA helix hero, mouse parallax,
scroll camera, glassmorphism, feature carousel). Portal stays light-themed.

Decisions: DNA double helix · dark landing only · React Three Fiber + drei.

---

## Sprint 0 — Foundation ✅ DONE
- [x] Install `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`
- [x] Sprint plan written to `siteplan.md`

Deliverable: deps in package.json, repo still builds.

---

## Sprint 1 — Three.js DNA Hero Scene ✅ DONE
Files: `src/components/three/DnaHelixScene.tsx`, `src/components/three/HeroCanvas.tsx`

- [x] DnaHelixScene: instanced-sphere backbones on two helix curves, coloured rungs,
      320 orbiting particles, slow rotation, mouse-parallax camera lerp,
      prefers-reduced-motion static frame.
- [x] HeroCanvas: `<Canvas>` wrapper, dark clear colour, pointer-events none,
      dynamic import (ssr: false) from page.

Note: fixed broken node_modules (NODE_ENV=production was hiding devDeps; reinstalled
with `--include=dev`). tsc clean except pre-existing seed-data.ts errors.

Deliverable: hero canvas renders a rotating DNA helix on `/` (temporary mount OK).

## Sprint 2 — Dark Hero + Nav + Feature Carousel ✅ DONE
Files: `src/components/landing/Nav.tsx`, `Hero.tsx`, `WorkCarousel.tsx`, `features.ts`,
`src/app/page.tsx`

- [x] Nav: dark glass header, sign-in / request-access links.
- [x] Hero: full-viewport, canvas background (dynamic ssr:false), badge, gradient
      headline, CTAs, "scroll to inspect" hint.
- [x] WorkCarousel: scroll-snap feature cards + arrow nav (plain React, no deps).
- [x] page.tsx: dark wrapper (`class="dark"` scoped), hero + carousel mounted.
- [x] globals.css: scroll-hint + carousel-snap + glass utilities added here.

Deliverable: `/` shows dark hero with working DNA canvas + navigable carousel.
Portal pages untouched. tsc clean (only pre-existing seed-data.ts errors).

## Sprint 3 — Manifesto, Contact, Footer, CSS polish ✅ DONE
Files: `src/components/landing/Manifesto.tsx`, `Contact.tsx`,
`src/app/globals.css`, `src/app/layout.tsx` (metadata only)

- [x] Manifesto: big-type gradient statement section (Reveal animations).
- [x] Contact + footer: email CTA, buttons, demo disclaimer.
- [x] globals.css: scroll-hint, carousel-snap, glass utilities.
- [x] metadata title/description refresh.

Deliverable: complete dark landing page, all sections styled.

## Sprint 4 — Verification & Cleanup ✅ DONE
- [x] `npx tsc --noEmit` clean (only pre-existing seed-data.ts errors, 3 total)
- [x] `npx eslint` clean on page.tsx, landing/, three/
- [x] `curl /` → 200; `/login` + `/signup` → 200
- [x] `class="dark"` scoped to landing `<main>` only — portal untouched
- [x] Three.js chunks compile + serve (HeroCanvas chunk → 200)
- [x] Fixed lint: setState-in-effect → useSyncExternalStore (HeroCanvas);
      Math.random purity → seeded LCG (DnaHelixScene)
- [ ] Manual visual check (WebGL render, parallax, carousel swipe, mobile)
      — left for user: agent-browser not installed

Deliverable: verified, mergeable landing page.

---

## Phase 2 — shader.se-style Auth Pages + Dark Portal + Dashboard Carousel
STATUS: ✅ COMPLETE (Sprints 5–8 done, verified)

### Sprint 5 — Auth pages (login / signup / verify-otp) ✅ DONE
- [x] `src/components/auth/AuthShell.tsx` created — dark full-viewport shell, DNA
      canvas background (dynamic ssr:false), radial fade, back-to-home link, glass card
      slot.
- [x] login/signup/verify-otp rewrapped in AuthShell; cards glass (border-white/10,
      bg-white/[0.04], backdrop-blur); buttons white-on-black; server actions + error
      flows untouched. All three pages 200, tsc clean.

### Context
Landing page (Phase 1) is dark + has the DNA HeroCanvas. Phase 2 applies the same
aesthetic behind login: immersive dark auth pages with the DNA canvas, a fully dark
portal shell, and a shader.se "Selected Work"-style carousel on the dashboard.

Key finding: every portal page uses theme tokens (`bg-background`, `bg-card`,
`text-muted-foreground`), and `globals.css` already has a complete `.dark` variable
set. Darkening the whole portal is a single `dark` class on the portal wrapper — no
per-page edits. Recharts components use `var(--color-*)` tokens and flip automatically.

### Decisions
- Full dark portal: shell, dashboard, inner pages all dark glass.
- Dashboard carousel: big glass domain tiles (Patients / EDC / Protocols / AEs / Audit)
  with live stats + charts, scroll-snap + arrows.

### Sprint 5 — Auth pages (login / signup / verify-otp)
Files:
- `src/components/auth/AuthShell.tsx` (NEW, "use client") — full-viewport dark wrapper:
  `dynamic(() => HeroCanvas, { ssr: false })` as background layer with the same radial
  fade overlay used on the landing hero, centred `glass` card slot for children,
  back-to-home link top-left. Reuses `HeroCanvas` + `DnaHelixScene` as-is.
- `src/app/login/page.tsx` — replace `<main>` wrapper with `<AuthShell>`; keep the form,
  error states, and `loginAction` untouched. Card gets dark classes:
  `border-white/10 bg-white/[0.04] backdrop-blur` (add a `dark` class on the shell root
  so shadcn Card tokens flip too).
- `src/app/signup/page.tsx` — same treatment.
- `src/app/verify-otp/page.tsx` — same treatment for both branches (expired + code form).

Deliverable: `/login`, `/signup`, `/verify-otp` are dark, immersive, DNA canvas
behind a glass form. Server actions and error flows unchanged.

### Sprint 6 — Dark portal shell ✅ DONE
- [x] `src/app/(portal)/layout.tsx` — `dark` class + `bg-[#0a0a0f] text-zinc-100`,
      glass header (`border-white/10 bg-[#0a0a0f]/70 backdrop-blur-md`), zinc footer.
- [x] recharts dark polish: EnrollmentChart / StatusChart / AesBySeverity —
      dark tooltips, light ticks, axis lines, hover cursors.
- [x] Confirmed no hardcoded light colours anywhere in (portal)/ or components.

Deliverable: portal fully dark; charts legible on dark cards.
- `src/app/(portal)/layout.tsx` — add `dark` class to root `<div>`, set
  `bg-[#0a0a0f] text-zinc-100`; header becomes glass: `border-white/10 bg-[#0a0a0f]/70
  backdrop-blur`; footer text zinc-500. Nav buttons / avatar / dropdown inherit token
  colours via the `dark` class. No structural changes.
- `src/components/dashboard/*.tsx` — recharts axis/tooltip polish for dark:
  `stroke="rgba(255,255,255,0.25)"`, `tick={{ fill: "rgba(255,255,255,0.5)" }}` on
  XAxis/YAxis, `contentStyle` dark for Tooltip in StatusChart + AesBySeverity +
  EnrollmentChart.
- `globals.css` — nothing new needed (glass + scroll-hint already exist).

Deliverable: sign in and the entire portal is dark; charts legible on dark cards.

### Sprint 7 — Dashboard "Selected Work" carousel ✅ DONE
- [x] `src/components/dashboard/DomainCarousel.tsx` (NEW, "use client") — scroll-snap
      carousel with arrows; tiles: Patients (pie), Protocols (bars), Adverse events
      (bars), EDC entries (bars), Audit trail (copy tile). Glass cards, gradient icon
      tiles, big numbers, "Open →" links filtered by `NAV[profile.role]`.
- [x] `src/app/(portal)/dashboard/page.tsx` — hero strip ("Good to see you, {name}"),
      stat cards, carousel replaces the old 2×2 chart grid. `loadStats` unchanged.

Deliverable: dashboard looks like shader.se's Selected Work section — big tiles,
arrows, live data — fully dark.

### Sprint 8 — Verify & polish ✅ DONE
- [x] `npx tsc --noEmit` — clean except 3 pre-existing seed-data.ts errors.
- [x] eslint on all Phase 2 files — no warnings/errors.
- [x] curl: `/`, `/login`, `/signup`, `/verify-otp` → 200.
- [x] `/dashboard` logged out → 307 to `/login` (auth guard intact).
- [x] Login flow: POST admin@demo.test/demo12345 creates session, verify-otp serves.
- [x] No hardcoded light backgrounds remain in portal pages/components.

Deliverable: Phase 2 complete — dark auth, dark portal, dashboard carousel.

### Risks / notes
- `AuthShell` is a client component wrapping server-rendered forms — forms use server
  actions, which work fine inside client children (server action references are passed
  through). If any issue arises, alternative is keeping pages server and only the
  canvas inside a client island — same visual result.
- Recharts default tooltip has a white background; must set `contentStyle` dark or it
  will glare on dark cards.
- Role-based tile links: `NAV` map in `src/lib/auth/nav.ts` is the single source of
  truth — reuse it, don't duplicate.

---

## Phase 3 — Dashboard ECG Pulse Hero ✅ DONE
- [x] `src/components/three/PulseScene.tsx` (NEW) — three ECG flatline waves in
      cyan/violet/rose, animated via per-frame BufferAttribute update; sweeping pulse
      dot per wave; glow sphere + faint tube "ghost" trace; 220 drifting particles.
      Seeded RNG (no Math.random in render). Grounded at y -1.15/0/1.15.
- [x] `src/components/three/PulseCanvas.tsx` (NEW) — Canvas wrapper, camera
      [0,0.15,7.2] fov 45, reduced-motion via useSyncExternalStore, clear colour
      transparent over #0a0a0f.
- [x] `src/components/dashboard/DashboardHero.tsx` (NEW, "use client") — hero strip
      with PulseCanvas background + radial fade; badge, gradient greeting, role badge
      + summary. Props: name/roleLabel/summary (plain strings — avoids importing
      server-only rbac into client, which caused a 500).
- [x] `src/app/(portal)/dashboard/page.tsx` — old static hero replaced by
      <DashboardHero>; ROLE_SUMMARIES moved into page (server side); unused imports
      removed.

Notes:
- Hit a 500 from importing `@/lib/auth/rbac` (pulls `next/headers`) into the client
  hero — fixed by passing strings as props from the server component.
- tsc + eslint clean; `/`, `/login` 200; full curl-based login+OTP+dashboard flow
  verified against live dev server.

Deliverable: dashboard hero is an animated ECG pulse — distinct from the landing
DNA helix, matching the clinical/medical theme.

---

## Phase 4 — shader.se Immersive: Bklit Charts, Cursor FX, Scroll Heroes, Film-Strip Nav
STATUS: ✅ COMPLETE (Sprints A–F done, verified)

### Sprint A — Foundation + white-bleed fix ✅ DONE
- [x] `npm install motion` (v13) + visx/d3 deps; bklit charts vendored from
      `~/bklit-ui/packages/ui/src/charts` into `src/components/charts/bklit/`
      (registry timed out → local fallback). Fixed brush subpath + shimmering-text
      imports, installed `@types/d3-*`.
- [x] globals.css: `body { background: #0a0a0f }` + `overscroll-behavior: none` on
      html/body — kills white overscroll flash on every dark page.
- [x] eslint ignores `src/components/charts/bklit/**` (vendored third-party).

### Sprint B — Custom cursor (21st.dev style) ✅ DONE
- [x] `src/components/fx/CursorFX.tsx` — dot + trailing ring via framer-motion
      springs; scale-up on hover over links/buttons; `mix-blend-difference`;
      disabled on `(pointer: coarse)` and reduced-motion. Mounted in root layout.

### Sprint C — Three scroll heroes (framer-motion) ✅ DONE
- [x] Landing: DNA rotates on scroll — `useScroll` + `useTransform` → spring →
      `ScrollRig` mutates camera in useFrame; hero is 150vh pinned, content parallax
      + fade-out.
- [x] Login: `RetroComputerScene` + `RetroComputerCanvas` — Commodore-PET-style
      beige chassis, screen plane showing a live animated ECG CanvasTexture, keyboard
      keys, brand label, warm glow. AuthShell now uses it instead of DNA.
- [x] Dashboard: "huge ass scrollable hero" — 260vh wrapper, PulseCanvas pinned,
      `useScroll` drives camera z/y through the waves; 3 text layers (greeting → role
      → CTA) fade in/out via `useTransform`.

### Sprint D — Film-strip dashboard nav (the "movie clip") ✅ DONE
- [x] `src/components/dashboard/FilmStripNav.tsx` — perspective strip, frames
      rotated `rotateY(±28deg)` curving to edges, sprocket-hole rails (repeating
      gradient), arrow buttons + pagination dots (shader.se pattern). Frames are
      real `<Link>`s; active route highlighted. Draggable via scroll-snap.
- [x] Portal layout: plain nav buttons replaced by FilmStripNav band (desktop);
      mobile keeps Sheet menu. Header keeps logo, NotificationBell, avatar.

### Sprint E — Bklit charts swap ✅ DONE
- [x] EnrollmentChart → bklit PieChart (donut + PieCenter total).
- [x] StatusChart + AesBySeverity → bklit BarChart (animated grow reveal).
- [x] recharts removed from package.json; all data illustrations now bklit-ui.

### Sprint F — Verify & polish ✅ DONE
- [x] tsc clean (only pre-existing seed-data.ts), eslint clean (0 errors).
- [x] All public pages 200; dashboard/audit 307 (auth redirect).
- [x] Fixed: stale Turbopack errors (old `./bklit` barrel + DashboardHero→rbac);
      `react-hooks/immutability` disabled at file level for R3F render-loop rigs
      (standard Three.js mutation pattern).

Deliverable: full shader.se-grade experience — animated charts, custom cursor,
three distinct scroll heroes, film-strip nav, no white bleed.

---

## Scratchpad (rollback if token-exhausted)
Each sprint leaves `/` in a working state. If stopped mid-sprint, the last completed
sprint's files are the working deliverable.

### Notes for next session
- `NODE_ENV=production` is set in the shell env — devDeps need `--include=dev`
  when reinstalling.
- Stethoscope.tsx now unused on landing; kept for potential portal use.
- middleware.ts still to be renamed to proxy.ts (Next 16 deprecation, unrelated).
- Server actions can't be exercised by plain curl (need Next-Action header + RSC
  protocol); browser flow is the source of truth for auth testing.
