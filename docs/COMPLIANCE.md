# Compliance Notes (demo-grade)

This project demonstrates 21 CFR Part 11 / HIPAA-style controls but is **not
audited or validated for production clinical use**. Real deployments need
independent validation, qualified infrastructure, and operational procedures.

## What is implemented

- **Immutable audit trail** — `audit_log` has no UPDATE/DELETE grants; writes
  go through a SECURITY DEFINER RPC that chains SHA-256 hashes
  (each entry hashes its predecessor). `audit_chain_verify()` recomputes the
  whole chain and flags tampering.
- **Electronic signatures** — approving/rejecting a protocol requires
  re-authentication with the signer's password within a 5-minute window; the
  signature is SHA-256-hashed and stored with the action, signer, and reason.
- **Consent integrity** — consent PDFs are SHA-256-hashed at upload; the
  verification flow re-hashes the file and compares. Tampered files fail.
- **Role-based access** — 7 roles; RLS policies + server-side role checks gate
  every write. Status transitions and entry workflows are enforced in SQL.
- **SAE escalation** — SEVERE events are marked serious, timestamped for
  ethics notification, and push notifications to all active Regulatory
  Affairs users with a 24-hour deadline payload.
- **Compliance reports** — audit trail exports (CSV/JSON) include the chain
  verification status.

## What is NOT implemented (production gaps)

- Real identity verification, qualified e-signature certificates
- Encrypted-at-rest PHI handling, de-identification pipeline, retention/legal
  hold policies
- SMS/email transport (OTP codes and notifications are demo-logged; the SAE
  alert is an in-app notification only)
- Backup/disaster-recovery runbooks, environment separation hardening
- Formal validation evidence (IQ/OQ/PQ)

## Operational reminders

- The Supabase service role key must never be shipped to the client.
- Audit entries depend on the database clock; keep the DB time source reliable.
- Bucket `consent-pdfs` should stay private with signed-URL access only.
