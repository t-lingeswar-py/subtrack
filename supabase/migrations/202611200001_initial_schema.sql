create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text not null default '', avatar_url text,
  default_currency text not null default 'INR' check (default_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  service_name text not null check (length(trim(service_name)) between 1 and 100), category text not null default 'Other',
  amount numeric(12,2) not null check (amount > 0), currency text not null default 'INR' check(currency ~ '^[A-Z]{3}$'),
  billing_cycle text not null check(billing_cycle in ('weekly','monthly','quarterly','half_yearly','yearly')),
  start_date date not null, next_payment_date date not null, payment_method text not null default 'Other', website_url text,
  auto_renewal boolean not null default true, trial_end_date date, usage_status text not null default 'occasionally_used' check(usage_status in ('frequently_used','occasionally_used','rarely_used','not_used')),
  status text not null default 'active' check(status in ('active','paused','cancelled')), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  amount numeric(12,2) not null check(amount > 0), currency text not null default 'INR', payment_date date not null,
  payment_method text not null default 'Other', status text not null default 'paid' check(status in ('paid','pending','failed')),
  notes text, created_at timestamptz not null default now()
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade, days_before integer not null check(days_before in (0,3,7)),
  is_enabled boolean not null default true, created_at timestamptz not null default now(), unique(subscription_id,days_before)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null, title text not null, message text not null,
  notification_type text not null default 'reminder', is_read boolean not null default false, created_at timestamptz not null default now(),
  unique(subscription_id,notification_type,message)
);
create index subscriptions_user_status_next on public.subscriptions(user_id,status,next_payment_date);
create index payments_user_date on public.payment_history(user_id,payment_date desc);
create index reminders_due on public.reminders(user_id,is_enabled,subscription_id);
create index notifications_user_unread on public.notifications(user_id,is_read,created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_history enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
create policy "Profile owner access" on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy "Subscription owner access" on public.subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "Payment owner access" on public.payment_history for all using(user_id=auth.uid() and exists(select 1 from public.subscriptions s where s.id=subscription_id and s.user_id=auth.uid())) with check(user_id=auth.uid() and exists(select 1 from public.subscriptions s where s.id=subscription_id and s.user_id=auth.uid()));
create policy "Reminder owner access" on public.reminders for all using(user_id=auth.uid() and exists(select 1 from public.subscriptions s where s.id=subscription_id and s.user_id=auth.uid())) with check(user_id=auth.uid() and exists(select 1 from public.subscriptions s where s.id=subscription_id and s.user_id=auth.uid()));
create policy "Notification owner access" on public.notifications for all using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Keep subscription and user ownership aligned for child rows.
create or replace function public.enforce_child_owner() returns trigger language plpgsql as $$
begin if not exists(select 1 from public.subscriptions where id=new.subscription_id and user_id=new.user_id) then raise exception 'subscription does not belong to user'; end if; return new; end $$;
create trigger payment_owner_guard before insert or update on public.payment_history for each row execute function public.enforce_child_owner();
create trigger reminder_owner_guard before insert or update on public.reminders for each row execute function public.enforce_child_owner();
