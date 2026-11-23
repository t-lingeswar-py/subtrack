"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAuthContext } from "@/lib/dal/auth";
import { subscriptionFormSchema } from "@/lib/validations/subscriptions";

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  default_currency: z.enum(["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD"]),
  timezone: z.string().trim().min(1).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }),
});

const idSchema = z.string().uuid();
const usageSchema = z.enum(["frequently_used", "occasionally_used", "rarely_used", "not_used"]);
const statusSchema = z.enum(["active", "paused", "cancelled"]);
const formValues = (form: FormData) => Object.fromEntries(form.entries());

export async function addSubscription(form: FormData) {
  const parsed = subscriptionFormSchema.safeParse(formValues(form));
  if (!parsed.success) redirect("/dashboard/subscriptions?error=invalid_subscription#add");

  const { supabase, user } = await requireAuthContext();
  const subscription = parsed.data;
  const { error } = await supabase.from("subscriptions").insert({
    ...subscription,
    user_id: user.id,
    website_url: subscription.website_url || null,
    trial_end_date: subscription.trial_end_date || null,
    auto_renewal: subscription.auto_renewal === "on" || subscription.auto_renewal === true,
  });

  if (error) redirect("/dashboard/subscriptions?error=save_failed#add");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/calendar");
  redirect("/dashboard/subscriptions?success=created");
}

export async function updateSubscription(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  const parsed = subscriptionFormSchema.safeParse(formValues(form));
  if (!id.success) redirect("/dashboard/subscriptions?error=invalid_subscription");
  if (!parsed.success) redirect(`/dashboard/subscriptions/${id.data}?error=invalid_subscription`);

  const { supabase, user } = await requireAuthContext();
  const subscription = parsed.data;
  const { data, error } = await supabase.from("subscriptions").update({
    ...subscription,
    website_url: subscription.website_url || null,
    trial_end_date: subscription.trial_end_date || null,
    auto_renewal: subscription.auto_renewal === "on" || subscription.auto_renewal === true,
  }).eq("id", id.data).eq("user_id", user.id).select("id").maybeSingle();

  if (error || !data) redirect(`/dashboard/subscriptions/${id.data}?error=update_failed`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/calendar");
  revalidatePath(`/dashboard/subscriptions/${id.data}`);
  redirect(`/dashboard/subscriptions/${id.data}?success=updated`);
}

export async function updateUsage(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  const usage = usageSchema.safeParse(form.get("usage_status"));
  if (!id.success || !usage.success) redirect("/dashboard/subscriptions?error=invalid_usage_status");

  const { supabase, user } = await requireAuthContext();
  const { data, error } = await supabase.from("subscriptions")
    .update({ usage_status: usage.data })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect(`/dashboard/subscriptions/${id.data}?error=usage_update_failed`);
  revalidatePath(`/dashboard/subscriptions/${id.data}`);
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
  redirect(`/dashboard/subscriptions/${id.data}?success=usage_updated`);
}

export async function changeStatus(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  const status = statusSchema.safeParse(form.get("status"));
  if (!id.success || !status.success) redirect("/dashboard/subscriptions?error=invalid_status");

  const { supabase, user } = await requireAuthContext();
  const { data, error } = await supabase.from("subscriptions")
    .update({ status: status.data })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect(`/dashboard/subscriptions/${id.data}?error=status_update_failed`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/calendar");
  revalidatePath(`/dashboard/subscriptions/${id.data}`);
  redirect(`/dashboard/subscriptions/${id.data}?success=status_updated`);
}

export async function deleteSubscription(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) redirect("/dashboard/subscriptions?error=invalid_subscription");

  const { supabase, user } = await requireAuthContext();
  const { data, error } = await supabase.from("subscriptions")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/dashboard/subscriptions?error=delete_failed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/calendar");
}

export async function updateProfile(form: FormData) {
  const parsed = profileSchema.safeParse(formValues(form));
  if (!parsed.success) redirect("/dashboard/settings?error=invalid_profile");

  const { supabase, user } = await requireAuthContext();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) redirect("/dashboard/settings?error=profile_save_failed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?success=profile_saved");
}

export async function updateReminders(form: FormData) {
  const { supabase } = await requireAuthContext();
  const days = [0, 3, 7].filter((day) => form.get(`day_${day}`) === "on");
  const { error } = await supabase.rpc("update_reminder_preferences", { p_days_before: days });
  if (error) redirect("/dashboard/settings?error=reminders_failed");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
  redirect("/dashboard/settings?success=reminders_saved");
}

export async function markRead(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) redirect("/dashboard/notifications?error=invalid_notification");

  const { supabase, user } = await requireAuthContext();
  const { error } = await supabase.from("notifications")
    .update({ is_read: true })
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) redirect("/dashboard/notifications?error=notification_update_failed");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function deleteAccount(form: FormData) {
  const parsed = z.object({
    current_password: z.string().min(8),
    confirmation: z.literal("DELETE"),
  }).safeParse(formValues(form));
  if (!parsed.success) redirect("/dashboard/settings?error=account_confirmation_required");

  const { user } = await requireAuthContext();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey || !user.email) {
    redirect("/dashboard/settings?error=account_delete_unavailable");
  }

  const verifier = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { error: verificationError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (verificationError) redirect("/dashboard/settings?error=reauthentication_failed");

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
  if (deletionError) redirect("/dashboard/settings?error=account_delete_failed");

  revalidatePath("/");
  redirect("/?account=deleted");
}
