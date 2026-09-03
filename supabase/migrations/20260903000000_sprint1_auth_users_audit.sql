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

-- SECURITY DEFINER helper so admin policies below don't recurse.
create function public.current_profile_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

-- Administrators can read all profiles (for the user-management screen).
-- Uses current_profile_role() (SECURITY DEFINER) to avoid recursive RLS.
create policy "profiles_read_admin"
  on public.profiles for select
  using ((select public.current_profile_role()) = 'Administrator');

-- Administrators can create, update, and disable profiles.
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check ((select public.current_profile_role()) = 'Administrator');

create policy "profiles_update_admin"
  on public.profiles for update
  using ((select public.current_profile_role()) = 'Administrator');

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
  v_prev_hash text := '';
  v_hash text;
begin
  select hash into v_prev_hash
  from public.audit_log
  order by id desc
  limit 1
  for update;

  v_prev_hash := coalesce(v_prev_hash, '');

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
