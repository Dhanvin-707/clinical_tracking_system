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
