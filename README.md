# SubTrack

SubTrack is a subscription management MVP built with Next.js App Router, TypeScript, Tailwind CSS, Supabase and Recharts. It keeps recurring costs and renewal dates in one user-owned workspace.

## Stack and structure

- `src/app`: App Router pages, layouts, Server Actions, auth callback and reminder endpoint
- `src/components`: dashboard charts, responsive navigation, and validated subscription forms
- `src/lib`: Supabase SSR client, auth data access, validation, and spending/date calculations
- `supabase/migrations`: PostgreSQL schema, profile trigger, indexes and RLS policies
- Next.js 16, React 19, Tailwind 4, Supabase Auth/Postgres, Zod, React Hook Form, Recharts, Lucide

## Configure Supabase

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and publishable/anon key. Keep the service role key private.
3. In Supabase **SQL Editor**, run every file in `supabase/migrations/` in filename order. For an existing project with the initial schema, apply `202611230001_reliable_reminders.sql` and then `202611230002_account_lifecycle.sql`.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL. Configure production URLs before deployment.
5. Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=<long-random-secret>
```

The first two variables power server authentication and RLS-protected queries. The service role key is used only by the server-side reminder job and account-deletion action; it must never use a `NEXT_PUBLIC_` prefix. `CRON_SECRET` protects the reminder endpoint. Keep `.env.local` out of Git.

The profile trigger creates a matching profile row whenever Supabase Auth creates a user. Dashboard queries use the signed-in Supabase session; policies on every user table compare `user_id` (or profile `id`) with `auth.uid()`.

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Without Supabase credentials the marketing page still runs; protected pages redirect to login with the exact `.env.local` setup instructions. Registration may require email confirmation depending on your Supabase Auth settings.

Useful commands:

```bash
npm run lint
npm test
npm run build
npm start
```

## Reminder scheduling

Reminder offsets (7 days, 3 days, and/or renewal day) are stored as profile preferences and applied to current and future subscriptions. The scheduled job creates idempotent in-app reminders for subscription renewals and trial end dates. Configure a daily scheduled request to `/api/cron/reminders` with `Authorization: Bearer $CRON_SECRET`. `vercel.json` includes a daily Vercel Cron schedule; configure `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment. It does not send email or create payment records.

## Deploy to Vercel

1. Push this repository to a Git provider and import it into Vercel.
2. Add the environment variables from `.env.example` to the Vercel project. Use the production Supabase URL and keys and set `NEXT_PUBLIC_SITE_URL` to the deployment URL.
3. Add the production callback URL in Supabase Auth redirect URLs.
4. Deploy. Vercel reads `vercel.json` for the daily reminder schedule (Cron availability depends on the selected Vercel plan).

## MVP notes

- Subscription costs are normalized to monthly/annual equivalents using the entered currency. Totals across different currencies are not exchange-rate converted.
- Spending history charts use manually recorded paid payment records. No bank account or payment processor is connected.
- Potential savings are estimates from the user's manual usage classifications, not detected usage.
- Deleting a subscription with existing payment history is restricted by a foreign key; delete those history entries first to preserve explicit user control.
- Account deletion requires re-entering the current password and the server-only Supabase service role key. The account-lifecycle migration removes that user's payment rows before Auth cascades delete the profile and plans.
- The JSON data export is generated from the authenticated session and includes the user's own profile, plans, reminders, notifications, and manually entered payment history.
