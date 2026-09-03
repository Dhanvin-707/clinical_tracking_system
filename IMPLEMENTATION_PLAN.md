# Clinical Trials Tracking System — Solo Developer Implementation Plan

**Repo:** `~/Documents/command/clinical_tracking_system` (cloned, empty, `main`, SSH remote set)
**Stack (decided):** Next.js 15 (App Router, TypeScript) + Supabase (Postgres, Auth w/ OTP 2FA, Realtime, Storage) + Tailwind CSS + shadcn-style components via 21st CLI
**Compliance depth:** Demo-grade — real hash chain, append-only audit, re-auth e-signs; documented as not FDA-audited
**Methodology:** Solo sequential sprints (the 12-sprint PBL breakdown, executed by one dev)

---

## 1. Architecture Overview

Single Next.js codebase. Supabase handles auth, Postgres, realtime notifications, and consent-PDF storage — no separate backend server needed.

| Concern | Solution |
|---|---|
| Frontend | App Router, server components for reads, client components for forms/realtime |
| Auth | Supabase Auth: email/password + OTP (SMS mock via console log in demo) as 2FA; JWT session |
| RBAC | 7-role enum on `profiles`; RLS policies + server-side role checks in actions |
| Database | Supabase Postgres; schema via SQL migration files committed to `supabase/migrations/` |
| Audit trail | Append-only `audit_log` table, SHA-256 hash chain, enforced by trigger + RPC |
| Consent PDFs | Supabase Storage bucket `consent-pdfs`, private, served via signed URLs |
| Realtime | Supabase Realtime channels for notification bell + AE alerts |
| Charts | Recharts; PDF/CSV export via `jspdf`/`papaparse` |
| UI supply | 21st CLI (`21st search`/`21st add`) for tables/forms/dialogs; `21st generate` sketches for unique screens (EDC builder, AE timeline, dashboards) |
| Deploy | Vercel (app) + Supabase (DB/auth); GitHub Actions CI |

## 2. Repository Layout

```
clinical_tracking_system/
├── app/
│   ├── (auth)/login, otp, reset-password
│   ├── (portal)/
│   │   ├── dashboard/            # role-based home
│   │   ├── users/                # Admin user CRUD
│   │   ├── patients/             # register, list, detail, consent
│   │   ├── protocols/            # CRUD, workflow, versions, deviations
│   │   ├── edc/                  # form builder + data entry + review
│   │   ├── adverse-events/       # AE forms, SAE, timeline
│   │   ├── audit/                # audit viewer + compliance reports
│   │   └── notifications/        # center + preferences
│   └── api/                      # route handlers + server actions
├── components/                   # ui/ (shadcn), module components, charts
├── lib/
│   ├── supabase/                 # client, server, middleware helpers
│   ├── auth/                     # RBAC helpers, requireRole()
│   ├── audit/                    # hash chain logic (crypto.subtle SHA-256)
│   └── edc/                      # schema types + validation engine (shared)
├── supabase/
│   ├── migrations/               # numbered SQL migrations
│   └── seed.sql                  # demo users per role + sample data
├── tests/                        # Vitest unit + Playwright e2e
└── docs/                         # Swagger/OpenAPI + compliance notes
```

## 3. Data Model (Postgres tables)

- `profiles` — id (FK auth.users), full_name, role enum (7 roles), phone, is_active
- `patients` — auto_id (e.g. PT-0001), demographics, enrollment_status, medical_history JSONB
- `consents` — patient_id, file_path, sha256_hash, consented_at, verified_at, withdrawn_at
- `protocols` — title, objective, methodology, criteria, status (DRAFT→UNDER_REVIEW→APPROVED→ACTIVE→CLOSED), current_version
- `protocol_versions` — immutable rows; active version is read-only
- `signatures` — protocol_id, user_id, action (approve/reject), re_auth_ts, sha256_hash
- `deviations` — protocol_id, description, severity (minor/major/critical), escalated_at
- `edc_forms` — protocol_id, version, schema JSONB (fields + validation rules)
- `edc_entries` — form_id, patient_id, data JSONB, status (DRAFT→QUERY→CLEANED→LOCKED)
- `adverse_events` — patient_id, protocol_id, date, severity, causality, outcome, is_sae, reported_at
- `audit_log` — id, ts, user_id, action, module, entity, before JSONB, after JSONB, prev_hash, hash (append-only, hash chain)
- `notifications` — user_id, type, payload, read_at
- `sprints`/`tasks` (optional) — Scrum burndown data for the dashboard

## 4. Compliance Approach (demo-grade)

- **Immutability:** `audit_log` has no UPDATE/DELETE grants; inserts only via SECURITY DEFINER RPC that computes `hash = SHA256(prev_hash || ts || user || action || before || after)`
- **E-signatures:** every approve/reject requires password re-auth within 5 min, then signature row + audit entry
- **Consent:** SHA-256 of uploaded PDF stored; verify endpoint re-hashes and compares
- **21 CFR Part 11 report:** query audit_log by filter → PDF/CSV with chain verification status
- **HIPAA note:** demo-only; no real PHI; docs state "not audited for production clinical use"

## 5. Sprint-by-Sprint Implementation

### Sprint 0 — Scaffold (prereq)
- [x] `create-next-app` in repo root, Tailwind, ESLint (shadcn init deferred to Sprint 1 UI work)
- [ ] Supabase project created by user (cloud, ap-southeast-2); `supabase init` + migration workflow setup
- [x] `lib/supabase/*` server/client/middleware helpers; `.env.local` wired (anon key only)
- [x] `requireRole()` RBAC helper (Sprint 1)
- [x] GitHub Actions CI (lint + typecheck + test) — full deploy pipeline deferred to Sprint 12

### Sprint 1 — Auth & Users
- [x] Migrations: profiles, role enum, audit_log core (also: hash-chain RPC, RLS policies, new-user trigger, promote_user helper)
- [x] Login/OTP/reset pages (`(auth)` route group); OTP delivered via console in demo
- [x] Admin user CRUD (server actions + RLS); role-based nav
- [x] UI: login card, OTP input, users table (shadcn Base UI)
- [x] RBAC tests (Vitest: roles, nav scoping)

### Sprint 2 — Patients & Consent
- [x] patients/consents migrations + auto-ID generation (sequence)
- [x] Registration, enrollment state machine, withdrawal flow
- [x] Consent upload → Storage → hash; verify endpoint
- [x] UI: registration form, patient detail w/ consent panel, withdrawal confirm
- [x] Verify: state-machine + hash/tamper tests (15 total)

### Sprint 3 — Protocol CRUD & Workflow
- [x] protocols/protocol_versions migrations; status transitions + permission checks
- [x] Versioning: ACTIVE versions immutable; edits create new version
- [x] UI: multi-section protocol form, status stepper (valid transitions only), version history viewer
- [x] Verify: workflow transition matrix tests (30 total)

### Sprint 4 — E-Signatures & Deviations
- [x] signatures + deviations migrations; re-auth window (5 min); SHA-256 signature
- [x] PI approve/reject; deviation logging + severity-based escalation to RA
- [x] UI: approval modal w/ re-auth password, e-sign confirm, deviation form + list, escalation badges
- [x] Verify: hash determinism, re-auth window, escalation tests (35 total)

### Sprint 5 — EDC Form Builder + Validation
- [x] edc_forms migrations; schema JSONB: field types (text/number/date/dropdown/checkbox), rules (required/range/regex)
- [x] Shared `lib/edc` types + validation engine (used by client mirror + server enforcement)
- [x] UI: builder (add/remove/reorder fields, property editor, preview) + form list + versioning
- [x] Verify: validation-engine tests (42 total)

### Sprint 6 — Data Entry + Export
- [x] edc_entries migrations; entry workflow DRAFT→QUERY→CLEANED→LOCKED; query logging
- [x] CSV/JSON export per form (server route, audit-logged)
- [x] UI: dynamic entry forms from schema, inline errors, DataManager review screen, export picker
- [x] Verify: CSV escaping/JSON export tests (44 total)

### Sprint 7 — Adverse Events
- [x] adverse_events migrations; SAE detection rules; 24h auto-notify RA (notification rows); ethics committee trigger
- [x] UI: AE form, SAE urgent banner, timeline view per patient/protocol, filters
- [x] Verify: SAE rules tests (47 total)

### Sprint 8 — Audit Trail & Compliance
- Hash-chain RPC + trigger; deny UPDATE/DELETE; audit query API (date/user/action/module)
- Compliance report: PDF/CSV + chain integrity check
- **UI:** audit viewer (filters, pagination, before/after diff), hash-chain integrity indicator, report download
- **Verify:** tamper test — direct SQL update rejected; chain verify endpoint detects modified row

### Sprint 9 — Notifications & Realtime
- notifications table + preferences; Realtime channel per user; SMS/email adapters (demo: logged)
- **UI:** bell w/ unread count, realtime toasts, notification center, preferences
- **Verify:** cross-user realtime push; read/unread state persists

### Sprint 10 — Dashboards & Reports
- Aggregation queries per role (enrollment, AE stats, protocol status, data progress, burndown)
- **UI:** 7 role-based dashboards, Recharts (trends, donut, burndown), export buttons — 21st sketch for layouts
- **Verify:** each role sees correct dashboard; charts render from live data

### Sprint 11 — Testing & Hardening
- Vitest: RBAC, validation engine, hash chain, state machines; Playwright e2e happy paths
- Responsive + accessibility pass (contrast, focus, labels, reduced-motion); empty/error/loading states everywhere
- **Skill:** `verify-and-stop` per acceptance criterion

### Sprint 12 — Deployment & Docs
- Vercel deploy + Supabase prod project; env management
- GitHub Actions: CI on PR, deploy on main
- Swagger/OpenAPI docs, ER diagram, compliance-notes doc, demo script + walkthrough
- Final acceptance run: full 12-sprint checklist

## 6. Skills & Tools Usage

| Skill | Where |
|---|---|
| `21st-cli-use` | Search/install shadcn components (tables, dialogs, steppers, forms) before hand-writing |
| `21st-ai` | Sketch unique screens: EDC builder, AE timeline, role dashboards; pull as design spec |
| `21st-ui-build` | Page builds using project tokens/components, then `21st review <paths>` |
| `lean-build` | Per-sprint scope discipline; explicit stop conditions |
| `verify-and-stop` | Sprint acceptance gates; no polish creep |
| `21st-design-sync` (optional) | Export final design tokens as a 21st theme |

## 7. Verification (Definition of Done per sprint)

1. `npm run lint` + `tsc --noEmit` + `npm test` pass
2. Migration applied cleanly against local Supabase
3. Manual smoke of the sprint's user flow as each relevant role
4. Acceptance criteria from Sprint section met
5. Audit entries present for every mutation in the sprint's module
6. Commit pushed to `main` (feature branch + PR merge)

## 8. Risks

- **Supabase setup needs your account** — I'll need you to create the Supabase project (or share access) in Sprint 0; local dev uses a self-hosted/cloud project URL+keys
- **SMS OTP** — real SMS needs a Twilio key; demo logs the code to server console
- **Scope size** — 12 sprints is large; sprint order is dependency-safe, so stopping after any sprint leaves a working app
- **Secrets** — Supabase service role key and any SMS keys live only in `.env.local` (gitignored); the earlier leaked GitHub PAT should be revoked and is not needed (SSH auth in use)
