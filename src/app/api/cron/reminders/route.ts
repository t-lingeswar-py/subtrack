import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAGE_SIZE = 500;

function dateForTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function first<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Reminder service is not configured" }, { status: 503 });
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = new Date();
  let offset = 0;
  let processed = 0;
  let created = 0;

  while (true) {
    const { data: reminders, error } = await admin
      .from("reminders")
      .select("days_before,user_id,subscription_id,profiles!reminders_user_id_fkey(timezone),subscriptions!inner(service_name,amount,currency,next_payment_date,trial_end_date,status)")
      .eq("is_enabled", true)
      .eq("subscriptions.status", "active")
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Reminder query failed", error.code);
      return NextResponse.json({ error: "Unable to process reminders" }, { status: 500 });
    }

    const page = reminders ?? [];
    processed += page.length;
    const dueNotifications = [];

    for (const reminder of page) {
      const subscription = first(reminder.subscriptions);
      const profile = first(reminder.profiles);
      if (!subscription) continue;

      let today: string;
      try {
        today = dateForTimezone(now, profile?.timezone || "Asia/Kolkata");
      } catch {
        today = dateForTimezone(now, "Asia/Kolkata");
      }

      const when = reminder.days_before === 0 ? "today" : `in ${reminder.days_before} days`;
      const events = [
        { kind: "renewal", date: subscription.next_payment_date },
        ...(subscription.trial_end_date ? [{ kind: "trial", date: subscription.trial_end_date }] : []),
      ];

      for (const event of events) {
        const reminderDate = new Date(`${event.date}T00:00:00Z`);
        reminderDate.setUTCDate(reminderDate.getUTCDate() - reminder.days_before);
        if (reminderDate.toISOString().slice(0, 10) !== today) continue;

        const isTrial = event.kind === "trial";
        dueNotifications.push({
          user_id: reminder.user_id,
          subscription_id: reminder.subscription_id,
          title: isTrial
            ? `${subscription.service_name} trial ends ${when}`
            : `${subscription.service_name} renews ${when}`,
          message: isTrial
            ? `Your ${subscription.service_name} trial ends ${when}. Review the plan before the trial period finishes.`
            : `Your ${subscription.service_name} subscription (${subscription.currency} ${Number(subscription.amount).toFixed(2)}) is expected to renew ${when}.`,
          notification_type: `${event.kind}_${reminder.days_before}`,
          event_key: `${reminder.subscription_id}:${event.kind}:${event.date}:${reminder.days_before}`,
        });
      }
    }

    if (dueNotifications.length) {
      const { data: inserted, error: insertError } = await admin
        .from("notifications")
        .upsert(dueNotifications, {
          onConflict: "user_id,event_key",
          ignoreDuplicates: true,
        })
        .select("id");

      if (insertError) {
        console.error("Reminder notification insert failed", insertError.code);
        return NextResponse.json({ error: "Unable to save reminders" }, { status: 500 });
      }
      created += inserted?.length ?? 0;
    }

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return NextResponse.json({ date: now.toISOString(), processed, created });
}
