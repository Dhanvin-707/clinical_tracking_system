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
