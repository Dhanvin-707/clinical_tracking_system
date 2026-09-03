# Clinical Tracking System

Full-stack clinical trials management platform built as PBL III (CSE20140).
Demo-grade implementation with real SHA-256 audit-chain hashing, e-signatures
with re-authentication, role-based access control, and Supabase-backed data.

**Demo only — not audited for production clinical use. Do not enter real PHI.**

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript), Tailwind, shadcn (Base UI) |
| Backend | Next.js server actions + route handlers |
| Database | Supabase (Postgres + Auth + Realtime + Storage) |
| Charts | Recharts |
| Tests | Vitest |

## Roles

Researcher · DataManager · PrincipalInvestigator · RegulatoryAffairs ·
Administrator · LabTechnician · QualityAssurance

## Modules

- **Auth** — email/password + OTP 2FA, RBAC middleware, admin user CRUD
- **Patients** — auto-ID registration, SCREENING→ENROLLED→WITHDRAWN state machine
- **Consents** — PDF upload with SHA-256 hash, re-verification, withdrawal cascade
- **Protocols** — versioned, DRAFT→UNDER_REVIEW→APPROVED→ACTIVE→CLOSED workflow
- **E-Signatures** — password re-auth (5-min window) + hashed signature records
- **Deviations** — severity-based logging, CRITICAL auto-escalation
- **EDC** — form builder, shared validation engine, entry review, CSV/JSON export
- **Adverse events** — SAE auto-detection, 24h Regulatory Affairs notification
- **Audit** — append-only SHA-256 hash chain, integrity verify, compliance export
- **Notifications** — Supabase Realtime bell + inbox with read state
- **Dashboards** — live role-aware charts

## Setup

1. `npm install` (unset `NODE_ENV=production` if it's set in your shell — it
   makes npm skip devDependencies).
2. Copy `.env.example` to `.env.local` and fill in your Supabase values.
3. In the Supabase SQL Editor, run every file in `supabase/migrations/` in order.
4. Create a Storage bucket named `consent-pdfs` (private).
5. `npm run dev` → sign up → promote yourself:
   ```sql
   select promote_user('you@example.com', 'Administrator');
   ```

## Commands

```bash
npm run dev      # dev server
npm run lint     # eslint
npm test         # vitest
npm run build    # production build
```

## Deployment

- **Vercel**: import the repo, set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy. Pushes to `main` redeploy.
- **Supabase**: cloud project holds the database; migrations are applied
  manually via SQL Editor (or via the Supabase CLI).

## Compliance notes

See `docs/COMPLIANCE.md`.
