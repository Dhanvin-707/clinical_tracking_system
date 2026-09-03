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
