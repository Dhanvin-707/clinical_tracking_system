-- ============================================================
-- CLINICAL TRACKING SYSTEM — COMBINED SETUP (run once, in SQL Editor)
-- Generated from supabase/migrations in dependency order.
-- Fix: security-definer functions now include extensions in search_path
-- ============================================================

-- >>> supabase/migrations/20260903000000_sprint1_auth_users_audit.sql

-- Clinical Tracking System — Sprint 1
-- Roles, profiles, and the append-only hash-chained audit log.

create extension if not exists pgcrypto;

-- 7 system roles for RBAC
create type public.user_role as enum (
  'Researcher',
  'DataManager',
  'PrincipalInvestigator',
  'RegulatoryAffairs',
  'Administrator',
  'LabTechnician',
  'QualityAssurance'
);

-- Profiles: one row per auth.users account
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.user_role not null default 'Researcher',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Every authenticated user can read their own profile.
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Administrators can read all profiles (for the user-management screen).
create policy "profiles_read_admin"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'Administrator' and p.is_active
  ));

-- Administrators can create, update, and disable profiles.
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'Administrator' and p.is_active
  ));

create policy "profiles_update_admin"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'Administrator' and p.is_active
  ));

-- New user profiles are created by the handle_new_user trigger (self-insert).
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'Researcher')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Append-only audit log with a SHA-256 hash chain.
-- No UPDATE/DELETE grants; inserts only via the RPC below.
-- ============================================================
create table public.audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  user_id uuid references auth.users (id),
  action text not null,
  module text not null,
  entity text not null,
  before_data jsonb,
  after_data jsonb,
  prev_hash text not null,
  hash text not null
);

alter table public.audit_log enable row level security;

-- Readable by any authenticated user; immutable to everyone.
create policy "audit_log_read_all"
  on public.audit_log for select
  using (auth.role() = 'authenticated');

revoke update, delete on public.audit_log from authenticated, anon;
revoke insert, update, delete on public.audit_log from anon;

-- Chain integrity check: recompute every hash and report tampering.
create function public.audit_chain_verify()
returns table (id bigint, valid boolean, stored_hash text, computed_hash text)
language sql security definer set search_path = public, extensions
as $$
  with chain as (
    select
      id,
      ts,
      user_id,
      action,
      module,
      entity,
      before_data,
      after_data,
      prev_hash,
      hash,
      lag(hash) over (order by id) as prev_row_hash
    from public.audit_log
  )
  select
    chain.id,
    case
      when chain.id = 1 then chain.hash = encode(digest(
        coalesce(chain.prev_hash, '') || '|' ||
        to_char(chain.ts, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' ||
        coalesce(chain.user_id::text, '') || '|' ||
        chain.action || '|' || chain.module || '|' || chain.entity || '|' ||
        coalesce(chain.before_data::text, '') || '|' ||
        coalesce(chain.after_data::text, ''), 'sha256'), 'hex')
      else chain.hash = encode(digest(
        coalesce(chain.prev_hash, '') || '|' ||
        to_char(chain.ts, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' ||
        coalesce(chain.user_id::text, '') || '|' ||
        chain.action || '|' || chain.module || '|' || chain.entity || '|' ||
        coalesce(chain.before_data::text, '') || '|' ||
        coalesce(chain.after_data::text, ''), 'sha256'), 'hex')
    end as valid,
    chain.hash as stored_hash,
    encode(digest(
      coalesce(chain.prev_hash, '') || '|' ||
      to_char(chain.ts, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' ||
      coalesce(chain.user_id::text, '') || '|' ||
      chain.action || '|' || chain.module || '|' || chain.entity || '|' ||
      coalesce(chain.before_data::text, '') || '|' ||
      coalesce(chain.after_data::text, ''), 'sha256'), 'hex') as computed_hash
  from chain
  order by chain.id;
$$;

-- The only write path into the audit log.
create function public.audit_log_insert(
  p_action text,
  p_module text,
  p_entity text,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_prev_hash text;
  v_hash text;
begin
  select coalesce(hash, '') into v_prev_hash
  from public.audit_log
  order by id desc
  limit 1
  for update;

  v_hash := encode(digest(
    v_prev_hash || '|' ||
    to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' ||
    coalesce(auth.uid()::text, '') || '|' ||
    p_action || '|' || p_module || '|' || p_entity || '|' ||
    coalesce(p_before::text, '') || '|' ||
    coalesce(p_after::text, ''), 'sha256'), 'hex');

  insert into public.audit_log (user_id, action, module, entity, before_data, after_data, prev_hash, hash)
  values (auth.uid(), p_action, p_module, p_entity, p_before, p_after, v_prev_hash, v_hash);
end;
$$;

grant execute on function public.audit_log_insert(text, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.audit_chain_verify() to authenticated;

-- >>> supabase/migrations/20260903000100_sprint2_patients_consents.sql

-- Clinical Tracking System — Sprint 2
-- Patients (auto-ID, enrollment state machine) and consent records with SHA-256 verification.

create type public.enrollment_status as enum (
  'SCREENING',
  'ENROLLED',
  'WITHDRAWN'
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  auto_id text not null unique,
  full_name text not null,
  dob date not null,
  gender text not null,
  medical_history jsonb not null default '{}'::jsonb,
  enrollment_status public.enrollment_status not null default 'SCREENING',
  enrolled_at timestamptz,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.patient_id_seq start 1;

-- Auto-generate the human-facing ID (PT-0001, PT-0002, ...).
create function public.next_patient_id()
returns text
language plpgsql
as $$
begin
  return 'PT-' || lpad(nextval('public.patient_id_seq')::text, 4, '0');
end;
$$;

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  file_path text not null,
  sha256_hash text not null,
  consented_at timestamptz not null default now(),
  verified_at timestamptz,
  withdrawn_at timestamptz,
  created_by uuid references auth.users (id)
);

alter table public.patients enable row level security;
alter table public.consents enable row level security;

-- Authenticated users with any active profile can read patients and consents.
create policy "patients_read_all"
  on public.patients for select
  using (auth.role() = 'authenticated');

create policy "consents_read_all"
  on public.consents for select
  using (auth.role() = 'authenticated');

-- Researchers and DataManagers (and Admins) create/update patients.
create function public.current_profile_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create policy "patients_write_clinical"
  on public.patients for insert
  with check (
    (select public.current_profile_role()) in ('Researcher', 'DataManager', 'Administrator')
  );

create policy "patients_update_clinical"
  on public.patients for update
  using (
    (select public.current_profile_role()) in ('Researcher', 'DataManager', 'Administrator')
  );

create policy "consents_write_clinical"
  on public.consents for insert
  with check (
    (select public.current_profile_role()) in ('Researcher', 'DataManager', 'Administrator')
  );

create policy "consents_update_clinical"
  on public.consents for update
  using (
    (select public.current_profile_role()) in ('Researcher', 'DataManager', 'Administrator')
  );

-- Enrollment transitions are enforced server-side.
create function public.enroll_patient(p_patient_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.patients
    where id = p_patient_id and enrollment_status = 'SCREENING'
  ) then
    raise exception 'Only SCREENING patients can be enrolled';
  end if;

  update public.patients
  set enrollment_status = 'ENROLLED',
      enrolled_at = now(),
      updated_at = now()
  where id = p_patient_id;
end;
$$;

create function public.withdraw_patient(p_patient_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.patients
    where id = p_patient_id and enrollment_status <> 'WITHDRAWN'
  ) then
    raise exception 'Patient is already withdrawn';
  end if;

  update public.patients
  set enrollment_status = 'WITHDRAWN',
      withdrawn_at = now(),
      withdrawal_reason = p_reason,
      updated_at = now()
  where id = p_patient_id;

  update public.consents
  set withdrawn_at = now()
  where patient_id = p_patient_id and withdrawn_at is null;
end;
$$;

grant execute on function public.enroll_patient(uuid) to authenticated;
grant execute on function public.withdraw_patient(uuid, text) to authenticated;

-- >>> supabase/migrations/20260903000200_sprint3_protocols.sql

-- Clinical Tracking System — Sprint 3
-- Protocols with a status workflow and immutable version history.

create type public.protocol_status as enum (
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'CLOSED'
);

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  objective text not null default '',
  methodology text not null default '',
  inclusion_criteria text not null default '',
  exclusion_criteria text not null default '',
  status public.protocol_status not null default 'DRAFT',
  current_version integer not null default 1,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Immutable version snapshots: an ACTIVE protocol's versions cannot change.
create table public.protocol_versions (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  version integer not null,
  title text not null,
  objective text not null,
  methodology text not null,
  inclusion_criteria text not null,
  exclusion_criteria text not null,
  reason text not null default '',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (protocol_id, version)
);

alter table public.protocols enable row level security;
alter table public.protocol_versions enable row level security;

-- All authenticated users can read protocols and versions.
create policy "protocols_read_all"
  on public.protocols for select
  using (auth.role() = 'authenticated');

create policy "protocol_versions_read_all"
  on public.protocol_versions for select
  using (auth.role() = 'authenticated');

-- Protocol writes are role-gated:
--   Researchers can create DRAFT protocols.
--   PrincipalInvestigators can edit/review/approve.
--   RegulatoryAffairs can close protocols.
create policy "protocols_insert"
  on public.protocols for insert
  with check (
    (select public.current_profile_role()) in ('Researcher', 'PrincipalInvestigator', 'Administrator')
  );

create policy "protocols_update"
  on public.protocols for update
  using (
    (select public.current_profile_role()) in ('PrincipalInvestigator', 'Administrator')
  );

create policy "protocol_versions_insert"
  on public.protocol_versions for insert
  with check (
    (select public.current_profile_role()) in ('PrincipalInvestigator', 'Administrator')
  );

-- Edits to an APPROVED/ACTIVE/CLOSED protocol always create a new version;
-- only DRAFT/UNDER_REVIEW content can change in place.
create function public.edit_protocol(
  p_protocol_id uuid,
  p_title text,
  p_objective text,
  p_methodology text,
  p_inclusion text,
  p_exclusion text,
  p_reason text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status public.protocol_status;
  v_version integer;
begin
  select status, current_version into v_status, v_version
  from public.protocols where id = p_protocol_id for update;

  if v_status in ('APPROVED', 'ACTIVE', 'CLOSED') then
    insert into public.protocol_versions
      (protocol_id, version, title, objective, methodology,
       inclusion_criteria, exclusion_criteria, reason, created_by)
    values
      (p_protocol_id, v_version + 1, p_title, p_objective, p_methodology,
       p_inclusion, p_exclusion, p_reason, auth.uid());

    update public.protocols
    set current_version = v_version + 1,
        status = 'UNDER_REVIEW',
        updated_at = now()
    where id = p_protocol_id;
  else
    insert into public.protocol_versions
      (protocol_id, version, title, objective, methodology,
       inclusion_criteria, exclusion_criteria, reason, created_by)
    values
      (p_protocol_id, v_version, p_title, p_objective, p_methodology,
       p_inclusion, p_exclusion, p_reason, auth.uid());

    update public.protocols
    set title = p_title,
        objective = p_objective,
        methodology = p_methodology,
        inclusion_criteria = p_inclusion,
        exclusion_criteria = p_exclusion,
        updated_at = now()
    where id = p_protocol_id;
  end if;
end;
$$;

-- Status transitions (permission-checked).
create function public.change_protocol_status(
  p_protocol_id uuid,
  p_to public.protocol_status
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status public.protocol_status;
  v_role public.user_role;
begin
  select status into v_status from public.protocols where id = p_protocol_id for update;
  select public.current_profile_role() into v_role;

  if v_status = 'DRAFT' and p_to = 'UNDER_REVIEW' then
    if v_role not in ('Researcher', 'PrincipalInvestigator', 'Administrator') then
      raise exception 'Only Researchers/PIs can submit for review';
    end if;
  elsif v_status = 'UNDER_REVIEW' and p_to = 'DRAFT' then
    if v_role not in ('PrincipalInvestigator', 'Administrator') then
      raise exception 'Only PIs can return to draft';
    end if;
  elsif v_status = 'UNDER_REVIEW' and p_to = 'APPROVED' then
    if v_role not in ('PrincipalInvestigator', 'Administrator') then
      raise exception 'Only PIs can approve';
    end if;
  elsif v_status = 'APPROVED' and p_to = 'ACTIVE' then
    if v_role not in ('PrincipalInvestigator', 'Administrator') then
      raise exception 'Only PIs can activate';
    end if;
  elsif v_status = 'ACTIVE' and p_to = 'CLOSED' then
    if v_role not in ('RegulatoryAffairs', 'Administrator') then
      raise exception 'Only Regulatory Affairs can close';
    end if;
  else
    raise exception 'Invalid status transition: % -> %', v_status, p_to;
  end if;

  update public.protocols
  set status = p_to, updated_at = now()
  where id = p_protocol_id;
end;
$$;

grant execute on function public.edit_protocol(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.change_protocol_status(uuid, public.protocol_status) to authenticated;

-- >>> supabase/migrations/20260903000300_sprint4_signatures_deviations.sql

-- Clinical Tracking System — Sprint 4
-- Electronic signatures (re-auth required) and protocol deviations.

create type public.signature_action as enum ('APPROVE', 'REJECT');

create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  action public.signature_action not null,
  reason text not null default '',
  re_auth_ts timestamptz not null default now(),
  sha256_hash text not null,
  created_at timestamptz not null default now()
);

create type public.deviation_severity as enum ('MINOR', 'MAJOR', 'CRITICAL');

create table public.deviations (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  description text not null,
  severity public.deviation_severity not null default 'MINOR',
  escalated_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.signatures enable row level security;
alter table public.deviations enable row level security;

create policy "signatures_read_all"
  on public.signatures for select
  using (auth.role() = 'authenticated');

create policy "deviations_read_all"
  on public.deviations for select
  using (auth.role() = 'authenticated');

create policy "signatures_insert"
  on public.signatures for insert
  with check (
    (select public.current_profile_role()) in ('PrincipalInvestigator', 'Administrator')
  );

create policy "deviations_insert"
  on public.deviations for insert
  with check (
    (select public.current_profile_role()) in
      ('Researcher', 'DataManager', 'PrincipalInvestigator', 'RegulatoryAffairs', 'Administrator')
  );

-- Approve/reject a protocol with an e-signature.
-- Re-authentication happens app-side (Supabase password re-auth); this RPC
-- only accepts calls from an authenticated PI/Admin and stores the signature
-- hash computed from (user, action, reason, re-auth time).
create function public.sign_protocol(
  p_protocol_id uuid,
  p_action public.signature_action,
  p_reason text,
  p_signature_hash text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status public.protocol_status;
  v_role public.user_role;
begin
  select status into v_status from public.protocols where id = p_protocol_id for update;
  select public.current_profile_role() into v_role;

  if v_role not in ('PrincipalInvestigator', 'Administrator') then
    raise exception 'Only Principal Investigators can sign protocols';
  end if;

  if v_status <> 'UNDER_REVIEW' then
    raise exception 'Only UNDER_REVIEW protocols can be signed';
  end if;

  insert into public.signatures (protocol_id, user_id, action, reason, sha256_hash)
  values (p_protocol_id, auth.uid(), p_action, p_reason, p_signature_hash);

  update public.protocols
  set status = case when p_action = 'APPROVE' then 'APPROVED' else 'DRAFT' end,
      updated_at = now()
  where id = p_protocol_id;
end;
$$;

-- Log a deviation; CRITICAL deviations escalate to Regulatory Affairs.
create function public.log_deviation(
  p_protocol_id uuid,
  p_description text,
  p_severity public.deviation_severity
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.deviations (protocol_id, description, severity, created_by, escalated_at)
  values (
    p_protocol_id,
    p_description,
    p_severity,
    auth.uid(),
    case when p_severity = 'CRITICAL' then now() else null end
  )
  returning id into v_id;
end;
$$;

grant execute on function public.sign_protocol(uuid, public.signature_action, text, text) to authenticated;
grant execute on function public.log_deviation(uuid, text, public.deviation_severity) to authenticated;

-- >>> supabase/migrations/20260903000400_sprint5_edc.sql

-- Clinical Tracking System — Sprint 5
-- EDC form definitions (versioned JSONB schemas) and clinical data entries.

create table public.edc_forms (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  name text not null,
  version integer not null default 1,
  schema_json jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (protocol_id, name, version)
);

create type public.entry_status as enum ('DRAFT', 'QUERY', 'CLEANED', 'LOCKED');

create table public.edc_entries (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.edc_forms (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  status public.entry_status not null default 'DRAFT',
  query_note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edc_forms enable row level security;
alter table public.edc_entries enable row level security;

create policy "edc_forms_read_all"
  on public.edc_forms for select
  using (auth.role() = 'authenticated');

create policy "edc_entries_read_all"
  on public.edc_entries for select
  using (auth.role() = 'authenticated');

-- Researchers and PIs design forms; DataManagers administer entries.
create policy "edc_forms_insert"
  on public.edc_forms for insert
  with check (
    (select public.current_profile_role()) in
      ('Researcher', 'PrincipalInvestigator', 'Administrator')
  );

create policy "edc_entries_insert"
  on public.edc_entries for insert
  with check (
    (select public.current_profile_role()) in
      ('Researcher', 'LabTechnician', 'Administrator')
  );

create policy "edc_entries_update"
  on public.edc_entries for update
  using (
    (select public.current_profile_role()) in
      ('Researcher', 'DataManager', 'LabTechnician', 'Administrator')
  );

-- Entry workflow enforced server-side:
--   DRAFT -> QUERY (DataManager), QUERY -> CLEANED, CLEANED -> LOCKED.
create function public.change_entry_status(
  p_entry_id uuid,
  p_to public.entry_status,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status public.entry_status;
  v_role public.user_role;
begin
  select status into v_status from public.edc_entries where id = p_entry_id for update;
  select public.current_profile_role() into v_role;

  if v_status = 'DRAFT' and p_to = 'QUERY' then
    if v_role not in ('DataManager', 'Administrator') then
      raise exception 'Only Data Managers can raise queries';
    end if;
  elsif v_status = 'QUERY' and p_to = 'CLEANED' then
    if v_role not in ('DataManager', 'Administrator') then
      raise exception 'Only Data Managers can mark cleaned';
    end if;
  elsif v_status = 'CLEANED' and p_to = 'LOCKED' then
    if v_role not in ('DataManager', 'Administrator') then
      raise exception 'Only Data Managers can lock entries';
    end if;
  else
    raise exception 'Invalid entry transition: % -> %', v_status, p_to;
  end if;

  update public.edc_entries
  set status = p_to, query_note = coalesce(p_note, query_note), updated_at = now()
  where id = p_entry_id;
end;
$$;

grant execute on function public.change_entry_status(uuid, public.entry_status, text) to authenticated;

-- >>> supabase/migrations/20260903000500_sprint7_adverse_events.sql

-- Clinical Tracking System — Sprint 7
-- Adverse events with SAE detection and notification wiring.

create type public.ae_severity as enum ('MILD', 'MODERATE', 'SEVERE');
create type public.ae_causality as enum ('UNRELATED', 'POSSIBLE', 'PROBABLE', 'DEFINITE');

create table public.adverse_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  description text not null,
  occurred_on date not null,
  severity public.ae_severity not null default 'MILD',
  causality public.ae_causality not null default 'POSSIBLE',
  outcome text not null default '',
  is_sae boolean not null default false,
  reported_at timestamptz not null default now(),
  ethics_notified_at timestamptz,
  created_by uuid references auth.users (id)
);

alter table public.adverse_events enable row level security;

create policy "ae_read_all"
  on public.adverse_events for select
  using (auth.role() = 'authenticated');

create policy "ae_insert"
  on public.adverse_events for insert
  with check (
    (select public.current_profile_role()) in
      ('Researcher', 'DataManager', 'PrincipalInvestigator', 'Administrator')
  );

-- SAE detection: severe events are serious; also treat PROBABLE/DEFINITE
-- causality with SEVERE severity as SAE regardless of the flag.
create function public.report_adverse_event(
  p_patient_id uuid,
  p_protocol_id uuid,
  p_description text,
  p_occurred_on date,
  p_severity public.ae_severity,
  p_causality public.ae_causality,
  p_outcome text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_is_sae boolean;
  v_id uuid;
begin
  v_is_sae := (p_severity = 'SEVERE');

  insert into public.adverse_events
    (patient_id, protocol_id, description, occurred_on, severity,
     causality, outcome, is_sae, ethics_notified_at, created_by)
  values
    (p_patient_id, p_protocol_id, p_description, p_occurred_on, p_severity,
     p_causality, p_outcome, v_is_sae,
     case when v_is_sae then now() else null end,
     auth.uid())
  returning id into v_id;

  -- Notify Regulatory Affairs within 24h for SAEs.
  if v_is_sae then
    insert into public.notifications (user_id, type, payload)
    select p.id, 'SAE_REPORT',
           jsonb_build_object(
             'ae_id', v_id,
             'patient_id', p_patient_id,
             'severity', p_severity,
             'deadline_hours', 24
           )
    from public.profiles p
    where p.role = 'RegulatoryAffairs' and p.is_active;
  end if;

  return v_id;
end;
$$;

grant execute on function public.report_adverse_event(
  uuid, uuid, text, date, public.ae_severity, public.ae_causality, text
) to authenticated;

-- Notifications table (Sprint 7: realtime payload target).
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_read_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications_insert_service"
  on public.notifications for insert
  with check (
    (select public.current_profile_role()) in ('Administrator') or
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('Researcher', 'PrincipalInvestigator'))
  );

-- >>> supabase/seed.sql (promote_user helper)

-- Seed demo accounts for every role (Sprint 1).
-- Passwords are demo-only. In the Supabase Dashboard:
-- Authentication → Users → Add user (or use the Auth API), then set role here.

-- Helper: promote an existing auth user to a role (run after creating the user in Dashboard).
-- select promote_user('dhanvinambavkar@gmail.com', 'Administrator');

create or replace function public.promote_user(p_email text, p_role public.user_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles
  set role = p_role
  where email = lower(p_email);

  if not found then
    raise exception 'No profile found for %', p_email;
  end if;
end;
$$;

grant execute on function public.promote_user(text, public.user_role) to service_role;
