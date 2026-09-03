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
