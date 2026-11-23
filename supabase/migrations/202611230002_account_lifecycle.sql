-- Payment history is intentionally protected when an individual plan is
-- deleted. When the entire profile is deleted, remove that user's payment
-- rows first so the subscription foreign key does not block account cleanup.
create or replace function public.remove_profile_payment_history()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.payment_history where user_id = old.id;
  return old;
end;
$$;

revoke all on function public.remove_profile_payment_history() from public;

drop trigger if exists profiles_remove_payment_history on public.profiles;
create trigger profiles_remove_payment_history
  before delete on public.profiles
  for each row execute function public.remove_profile_payment_history();

-- A profile should not be deleted directly through the Data API; account
-- deletion must go through Supabase Auth so the identity and profile stay in
-- sync. Users can still read and update their own profile.
drop policy if exists "Profile owner access" on public.profiles;
drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;

create policy "Profiles select own"
  on public.profiles for select
  using (id = auth.uid());

create policy "Profiles update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, default_currency, timezone, reminder_days)
  on public.profiles to authenticated;
