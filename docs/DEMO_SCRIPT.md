# Demo Script

The 5-minute walkthrough used for the final demo. Run through it in order;
each step shows a different sprint's capability.

## Setup (before demo)

1. Supabase: apply all migrations, create `consent-pdfs` bucket.
2. Create users: `researcher@demo.test` (Researcher),
   `dm@demo.test` (DataManager), `pi@demo.test` (PrincipalInvestigator),
   `ra@demo.test` (RegulatoryAffairs), `admin@demo.test` (Administrator).
3. Promote the admin: `select promote_user('admin@demo.test', 'Administrator');`

## Script

1. **Login + 2FA** (Sprint 1) — sign in as admin, enter demo OTP `482913`
   (check server console). Role-scoped nav shows Users + Audit.
2. **User management** (Sprint 1) — create a LabTechnician account, change a
   role, disable/re-enable. Point at audit entries being written.
3. **Patients + consent** (Sprint 2) — as Researcher: register a patient
   (auto-ID PT-0001), enroll, upload a consent PDF, show the SHA-256 hash,
   re-verify with the same file (pass) and a different file (fail).
4. **Protocol workflow** (Sprint 3) — create a protocol, submit for review.
5. **E-signature** (Sprint 4) — as PI: approve with password re-auth. Show the
   signature hash. Log a CRITICAL deviation; show escalation timestamp.
6. **EDC** (Sprint 5) — build a form (text/number/dropdown with rules),
   save v1. As Researcher: submit an entry; show client + server validation.
7. **Review + export** (Sprint 6) — as DataManager: raise query, mark cleaned,
   lock. Export CSV/JSON.
8. **Adverse event** (Sprint 7) — report a SEVERE event; log in as RA in
   another window and watch the notification bell update in realtime.
9. **Audit chain** (Sprint 8) — as QA: open the audit trail, show the chain
   integrity badge, export the compliance CSV.
10. **Dashboard** (Sprint 10) — show charts updating from live data.
