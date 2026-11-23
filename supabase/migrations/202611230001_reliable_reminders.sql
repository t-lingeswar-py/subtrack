-- Keep each user's reminder preference in one place and use a renewal-cycle key
-- so a reminder for this month cannot suppress the same reminder next month.
alter table public.profiles
  add column if not exists reminder_days integer[] not null default array[0, 3, 7]::integer[];

alter table public.profiles
  drop constraint if exists profiles_reminder_days_allowed;
alter table public.profiles
  add constraint profiles_reminder_days_allowed
  check (reminder_days <@ array[0, 3, 7]::integer[]);

-- Preserve existing per-user settings where reminder rows already exist.
update public.profiles p
set reminder_days = case
  when exists (select 1 from public.reminders r where r.user_id = p.id)
    then coalesce(
      (select array_agg(distinct r.days_before order by r.days_before)
       from public.reminders r
       where r.user_id = p.id and r.is_enabled),
      array[]::integer[]
    )
  else array[0, 3, 7]::integer[]
end;

alter table public.notifications
  add column if not exists event_key text;

-- The previous key was based on message copy and blocked future renewals from
-- producing notifications. Existing notification rows remain intact.
alter table public.notifications
  drop constraint if exists notifications_subscription_id_notification_type_message_key;
alter table public.notifications
  drop constraint if exists notifications_user_event_key;
alter table public.notifications
  add constraint notifications_user_event_key unique (user_id, event_key);

create or replace function public.create_subscription_reminders()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.reminders (user_id, subscription_id, days_before, is_enabled)
  select distinct new.user_id, new.id, offsets.days_before, true
  from public.profiles p
  cross join unnest(p.reminder_days) as offsets(days_before)
  where p.id = new.user_id
  on conflict (subscription_id, days_before)
  do update set is_enabled = excluded.is_enabled;

  return new;
end;
$$;

drop trigger if exists subscription_default_reminders on public.subscriptions;
create trigger subscription_default_reminders
  after insert on public.subscriptions
  for each row execute function public.create_subscription_reminders();

create or replace function public.update_reminder_preferences(p_days_before integer[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;
  if p_days_before is null or not (p_days_before <@ array[0, 3, 7]::integer[]) then
    raise exception 'Reminder offsets must be selected from 0, 3, and 7 days';
  end if;

  update public.profiles
  set reminder_days = p_days_before
  where id = actor_id;

  insert into public.reminders (user_id, subscription_id, days_before, is_enabled)
  select actor_id, s.id, offsets.days_before, offsets.days_before = any(p_days_before)
  from public.subscriptions s
  cross join unnest(array[0, 3, 7]::integer[]) as offsets(days_before)
  where s.user_id = actor_id
  on conflict (subscription_id, days_before)
  do update set is_enabled = excluded.is_enabled;
end;
$$;

revoke all on function public.update_reminder_preferences(integer[]) from public;
grant execute on function public.update_reminder_preferences(integer[]) to authenticated;
