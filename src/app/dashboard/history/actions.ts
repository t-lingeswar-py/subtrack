"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthContext } from "@/lib/dal/auth";
import { paymentMethods, supportedCurrencies } from "@/lib/validations/subscriptions";

const paymentSchema = z.object({
  subscription_id: z.string().uuid(),
  amount: z.coerce.number().finite().positive().max(9_999_999_999.99),
  currency: z.enum(supportedCurrencies),
  payment_date: z.string().date(),
  payment_method: z.enum(paymentMethods),
  status: z.enum(["paid", "pending", "failed"]),
  notes: z.string().trim().max(2000).optional(),
});
const idSchema = z.string().uuid();
const formValues = (form: FormData) => Object.fromEntries(form.entries());

export async function addPayment(form: FormData) {
  const parsed = paymentSchema.safeParse(formValues(form));
  if (!parsed.success) redirect("/dashboard/history?error=invalid_payment");

  const { supabase, user } = await requireAuthContext();
  const { error } = await supabase.from("payment_history").insert({ ...parsed.data, user_id: user.id });
  if (error) redirect("/dashboard/history?error=payment_save_failed");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
  redirect("/dashboard/history?success=payment_created");
}

export async function deletePayment(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) redirect("/dashboard/history?error=invalid_payment");

  const { supabase, user } = await requireAuthContext();
  const { data, error } = await supabase.from("payment_history")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/dashboard/history?error=payment_delete_failed");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
  redirect("/dashboard/history?success=payment_deleted");
}

export async function updatePayment(form: FormData) {
  const id = idSchema.safeParse(form.get("id"));
  const parsed = paymentSchema.safeParse(formValues(form));
  if (!id.success || !parsed.success) redirect("/dashboard/history?error=invalid_payment");

  const { supabase, user } = await requireAuthContext();
  const { data, error } = await supabase.from("payment_history")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/dashboard/history?error=payment_update_failed");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
  redirect("/dashboard/history?success=payment_updated");
}
