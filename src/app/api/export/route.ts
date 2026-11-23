import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 500;

async function readAllRows<T>(
  loadPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });

  const [profile, subscriptions, payments, reminders, notifications] = await Promise.all([
    supabase.from("profiles").select("full_name,email,avatar_url,default_currency,timezone,reminder_days,created_at,updated_at").eq("id", user.id).maybeSingle(),
    readAllRows(async (from, to) => await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).range(from, to)),
    readAllRows(async (from, to) => await supabase.from("payment_history").select("*").eq("user_id", user.id).order("payment_date", { ascending: true }).range(from, to)),
    readAllRows(async (from, to) => await supabase.from("reminders").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).range(from, to)),
    readAllRows(async (from, to) => await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).range(from, to)),
  ]);

  if ([profile, subscriptions, payments, reminders, notifications].some((result) => result.error)) {
    return NextResponse.json({ error: "Your export could not be prepared. Please try again." }, { status: 500 });
  }

  const exportData = {
    product: "SubTrack",
    exported_at: new Date().toISOString(),
    account: profile.data,
    subscriptions: subscriptions.data ?? [],
    payment_history: payments.data ?? [],
    reminders: reminders.data ?? [],
    notifications: notifications.data ?? [],
    note: "Payment history contains records entered by the account owner. It is not processor-confirmed payment data.",
  };
  const filename = `subtrack-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
