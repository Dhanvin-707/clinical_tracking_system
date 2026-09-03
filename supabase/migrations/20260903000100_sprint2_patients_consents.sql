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
