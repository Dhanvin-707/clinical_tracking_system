-- Add missing promote_user function (required by scripts/seed-demo.ts).
create or replace function public.promote_user(p_email text, p_role public.user_role)
returns void
language sql security definer set search_path = public
as $$
  update public.profiles set role = p_role, updated_at = now() where email = p_email;
$$;

grant execute on function public.promote_user(text, public.user_role) to authenticated;
