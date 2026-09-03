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
