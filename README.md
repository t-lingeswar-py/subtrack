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

### Production readiness checklist

- Apply every migration in filename order and verify the reminder preference RPC and account-deletion migration are present.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin. In Supabase Auth, configure that origin as the Site URL and allow the exact `/auth/callback` and `/reset-password` redirect URLs.
- Configure the service-role key and cron secret as server-only deployment variables. Do not expose either through `NEXT_PUBLIC_*`, commit `.env.local`, or use production secrets in preview environments.
- Set the Vercel environment variables for the production environment and confirm the scheduled reminder job is enabled for the selected plan.
- Before release, run `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npm run build`; then smoke-test registration, email confirmation, sign-in/out, password reset, subscription CRUD, manual payment records, export, and account deletion against a non-production Supabase project.
- Verify Supabase RLS policies and backup/restore procedures independently. A passing local build does not verify database migrations, email delivery, cron execution, or account deletion.

The app renders its own 404 page and recoverable error screens. These screens do not replace server-side monitoring: production operators should capture deployment/runtime logs and use the displayed error reference digest to correlate Next.js failures without exposing internal exception details to users.

## Troubleshooting

- **“Connect Supabase to enable accounts”**: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the local environment and restart the dev server.
- **Confirmation or recovery link returns to the wrong host**: correct the Supabase Site URL, redirect allow-list, and `NEXT_PUBLIC_SITE_URL`, then request a new email.
- **Reminder endpoint returns 401**: verify the scheduled request uses `Authorization: Bearer <CRON_SECRET>` and that the deployment secret matches.
- **Reminder endpoint returns 503**: verify `SUPABASE_SERVICE_ROLE_KEY` and the public Supabase URL are configured in the server environment.
- **Dashboard data fails to load**: verify migrations and RLS policies are applied to the connected Supabase project, then inspect server logs using the error reference shown by the app.

## MVP notes

- Subscription costs are normalized to monthly/annual equivalents using the entered currency. Totals across different currencies are not exchange-rate converted.
- Spending history charts use manually recorded paid payment records. No bank account or payment processor is connected.
- Potential savings are estimates from the user's manual usage classifications, not detected usage.
- Deleting a subscription with existing payment history is restricted by a foreign key; delete those history entries first to preserve explicit user control.
- Account deletion requires re-entering the current password and the server-only Supabase service role key. The account-lifecycle migration removes that user's payment rows before Auth cascades delete the profile and plans.
- The JSON data export is generated from the authenticated session and includes the user's own profile, plans, reminders, notifications, and manually entered payment history.
