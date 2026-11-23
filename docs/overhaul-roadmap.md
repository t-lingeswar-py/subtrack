# SubTrack product and engineering overhaul

## Product direction

Make SubTrack a **recurring-spend control center**: it helps a person understand what renews, how much their recurring commitments cost, and what action they can take before money leaves their account. Its edge should be renewal intelligence and clear action paths, not a decorative dashboard or a claim that it can see bank or merchant activity.

### Product principles

1. **Separate forecast from fact.** Subscription cadence produces an estimated commitment. A payment-history row is a user-entered record. A processor-confirmed transaction is a third, distinct state.
2. **Explain every insight.** Show the services and math behind a total, savings estimate, or alert. Usage status stays self-reported until a real integration exists.
3. **Make the next action obvious.** From a renewal, a person can review the plan, open the merchant, mark their own payment record, or snooze an alert. Never imply SubTrack cancelled or paid a third-party service when it did not.
4. **Use calm, accessible finance UX.** Prioritize hierarchy, scanability, responsive tables, keyboard access, reduced motion, understandable empty states, and clear currency/date localization over ornamental motion.
5. **Earn trust before monetization.** Keep third-party purchases and rewards behind real partner capabilities, clear economics, and compliance review.

## Findings from the current implementation

- Server Actions generally check for a signed-in user, but several mutations silently ignore database errors or expose database error messages in redirect URLs. Next.js treats Server Actions as public endpoints and recommends validating and authorizing every invocation.
- Reminder settings are stored once per subscription. New subscriptions can therefore ignore a user's saved preferences. The reminder job's uniqueness key is built from message text, which can suppress the same offset on a later renewal cycle.
- Subscription, forecast, and payment-history concepts are mixed in the UI. Forecast totals and recorded paid spending need separate labels and definitions.
- The visual system is concentrated in a very compressed global stylesheet. This makes responsive behavior, page-level ownership, and safe iteration harder than it needs to be.
- Several pages are server-rendered and data-connected, which is a good base. The next step is a consistent data-access, validation, UI-component, and error-state architecture rather than a rewrite that throws away working Supabase/RLS behavior.

## Recommended experience

### Main navigation

- **Overview:** a prioritized renewal inbox, monthly commitment, annual forecast, recent actual payments, and one insight with its calculation.
- **Subscriptions:** searchable list and mobile cards, saved filters, explicit status, next renewal, and a clear add/edit flow.
- **Calendar:** month and agenda views; each event says whether it is forecast or recorded, and opens a renewal action sheet.
- **Activity:** a chronological ledger of manually recorded payments, user edits, and reminder events. Do not turn a passed due date into a paid event.
- **Insights:** category trends, upcoming cash-flow forecast, price changes, and self-reported unused-plan estimates.
- **Settings:** profile, currency, timezone, notification preferences, data export, and account controls.

### High-value product capabilities

1. **Renewal inbox:** group due soon, trials ending, recently passed expected dates, and paused/cancelled plans. Actions must be honest and distinguish a local SubTrack status change from cancellation at the merchant.
2. **Trial conversion guard:** capture trial end date and show a separate countdown. Do not treat a trial as paid or add it to confirmed spending.
3. **Price-change timeline:** let a user record a changed amount and effective date. Explain how the change affects monthly and annual forecasts.
4. **Cash-flow forecast:** project expected renewal commitments on a date timeline, with recurring-cycle math and timezone-aware dates. Show the forecast separately from actual payment history.
5. **Review cadence:** a user-controlled monthly check-in surfaces the largest self-reported rarely used plans and their normalized cost. Avoid shame, false usage detection, or manipulative streaks.
6. **Import and export:** start with CSV import/export and a dry-run validation preview. Consider email receipt parsing only after a privacy/data-retention design and explicit opt-in.
7. **Household sharing:** later, add explicit workspaces and memberships with roles; never share data by weakening per-user RLS.

## Backend target architecture

Keep the first-party app on Next.js App Router and Supabase. Use Server Components for authenticated reads, small Client Components for actual interaction, Server Actions for user-originated writes, and Route Handlers only for integrations and scheduled jobs. Put shared schemas and domain calculations in `src/lib`; put SQL constraints and RLS in versioned migrations.

### Data model evolution

- Keep `subscriptions` as the current contract/forecast record.
- Add `subscription_price_events` for amount/currency changes with effective dates and source (`user_entered`, later a verified provider).
- Keep `payment_history` explicitly user-entered until a real PSP integration exists; add an origin/source and external event ID only when reconciliation is implemented.
- Give reminder notifications a stable event key based on subscription, renewal date, and offset. Use a unique constraint for idempotency.
- Store reminder preferences on the profile and derive per-subscription scheduling rows from that preference.
- For rewards, use an append-only ledger with source-event IDs and reversals, never a directly editable balance. A manual payment-history row must not earn rewards.
- Add generated database types, foreign keys that include owner identity where appropriate, check constraints for enums/amounts/dates, and indexes matching real list queries.

### Security and operations

- Every write validates untrusted form input, checks the authenticated actor, scopes affected rows by owner, and returns a user-safe error. RLS remains the final data boundary.
- Keep service-role access limited to server-only scheduled/integration code. Add job run visibility, bounded batches, idempotency, and retry-safe event handling.
- Add export and account deletion as explicit user actions with a clear retention policy. Avoid collecting card numbers, CVVs, bank credentials, or unnecessary receipt contents.
- Add database-level isolation and mutation tests before adding shared accounts or provider callbacks.

## Payments and rewards: staged recommendation

### Stage 1: action links and accurate tracking

Let a user open an official merchant page and then record what happened. No funds pass through SubTrack, and manual records remain clearly labeled.

### Stage 2: SubTrack's own paid plan

If SubTrack introduces Plus, use a payment provider's hosted checkout and signed server-side webhooks for SubTrack's own service. Keep provider customer/subscription identifiers server-side and separate this billing ledger from third-party subscriptions tracked by the user.

### Stage 3: partner offers and non-cash rewards

Prefer a merchant/affiliate offer catalog over an in-app cash wallet. If loyalty is introduced, define a funded, non-transferable promotion and use an append-only earn/reverse/redeem ledger. Award only from a verified eligible event; define expiry, refunds, caps, support, and terms before displaying a balance.

### Stage 4: third-party subscription purchasing

Only pursue named merchants with documented APIs, commercial agreements, user authorization, refund/reconciliation support, and country-specific compliance review. An app that accepts stored value and settles purchases with unrelated merchants can enter regulated payment-instrument territory. For India, the RBI's current PPI Master Directions distinguish closed-system instruments from instruments usable at third-party merchants. UPI AutoPay is a mandate framework administered through participating UPI apps/PSPs; it is not a generic API that lets an independent tracker charge every existing subscription.

**Recommendation:** do not build a general-purpose stored-value wallet in this phase. Explore a partner-funded offer marketplace and SubTrack's own checkout first. This is a product/technical assessment; actual funds flow requires qualified legal and payment-provider review.

## Delivery sequence

1. **Trust foundation:** stabilize reminder preferences and cycle-level deduplication; centralize validation and safe action errors; define money/date calculations; document environment setup and operational behavior.
2. **Design system:** establish tokens, typography, buttons, fields, cards, dialogs, tables, notifications, responsive shell, focus states, and reduced-motion behavior. Rebuild landing, dashboard, and subscriptions first.
3. **Renewal workflows:** add trial reminders, renewal inbox, snooze/dismiss semantics, explicit status actions, and an agenda calendar.
4. **Financial clarity:** add price-change history, forecast vs actual separation, explainable savings insights, CSV import preview, and export.
5. **Reliability:** add migrations and RLS tests, action validation tests, reminder idempotency tests, responsive/browser checks, and production error monitoring.
6. **Monetization discovery:** provider-hosted SubTrack billing, partner offers, then a rules-based reward ledger only after economics and terms are approved.

Each release should be a small, reviewable vertical slice with a before/after screenshot, a migration when needed, clear acceptance criteria, and a short rollback note.

## Work completed in this first overhaul slice

- Added profile-level reminder preferences and a transactional database function that updates the preference and every existing subscription schedule together.
- New subscriptions now inherit the saved preference in a database trigger, so the reminder row creation cannot fail as a separate second request.
- Reminder notifications now deduplicate by `subscription_id + renewal date + offset`, so a notification from one renewal cycle does not block the next cycle.
- The reminder job processes bounded pages, writes notifications in batches, counts only inserted rows, and returns generic errors instead of database details.
- Added active-route navigation, route-aware breadcrumbs, unread notification count, skip navigation, visible focus, and reduced-motion support.
- Rebuilt the subscription list and detail views around shared validation, real sort/filter controls, safe deletion confirmations, trial dates, and explicit SubTrack-only status changes.
- Calendar months now project recurring expected dates with anchored month-end math. Overdue dates are surfaced for review without being treated as payment confirmations.
- The scheduled reminder job now creates trial-end alerts as well as renewal alerts, using the same user-selected offsets and per-event idempotency keys.
- Added authenticated JSON data export and password-verified account deletion. The account-lifecycle migration prevents direct profile deletion and cleans the user's payment rows before Auth cascade cleanup.
- Added business-logic tests for cost normalization, month-end recurrence, currency formatting, and timezone date resolution.
- Added Zod + React Hook Form client validation and pending/error affordances to subscription entry; server actions still validate independently.
- Raised dashboard typography and control sizes for scanability and keyboard use, with tighter mobile calendar behavior and visible form errors.
- Hardened the unconfigured Supabase path: public/auth pages render, while protected routes redirect to a login message with the exact env keys required instead of throwing during server rendering.
- Corrected analytics month grouping to use each user's timezone and made the dashboard upcoming-payment count include every upcoming plan while only showing the nearest five rows.
- Added this roadmap and updated the Supabase migration instructions. The migration still needs to be applied to the connected Supabase project before the new reminder workflow is live there.
- Validation note: lint, TypeScript, six business-logic tests, and the production build pass. Local HTTP smoke checks returned 200 for public pages and a login redirect for protected pages without Supabase configuration. No `.env.local` credentials were present in this workspace, so migrations, RLS behavior, account deletion, and live scheduled reminders were not exercised against a database.

## Research references

- [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security): Server Actions are public endpoints and need their own authorization and input validation.
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): keep database reads and secrets on the server; use Client Components only where interaction requires them.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): use RLS as the database ownership boundary and index policy filters.
- [Supabase Cron](https://supabase.com/docs/guides/cron): Postgres jobs can run database functions or call HTTP/Edge Functions, with job run monitoring.
- [RBI Master Directions on Prepaid Payment Instruments](https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=12156&Mode=0&fn=9): stored-value and third-party merchant use have different regulatory treatment.
- [NPCI UPI AutoPay enhancement circular](https://www.npci.org.in/uploads/UPI_OC_No_223_FY_2025_26_Enhancement_of_UPI_Autopay_88b38535cb.pdf): mandates have participant lifecycle rules and user-driven operations; this is not a universal third-party subscription billing interface.
