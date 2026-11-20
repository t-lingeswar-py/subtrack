"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
const paymentSchema=z.object({subscription_id:z.string().uuid(),amount:z.coerce.number().positive(),currency:z.string().regex(/^[A-Z]{3}$/),payment_date:z.string().date(),payment_method:z.string(),status:z.enum(["paid","pending","failed"]),notes:z.string().optional()});
export async function addPayment(f:FormData){const p=paymentSchema.safeParse(Object.fromEntries(f));if(!p.success)redirect("/dashboard/history?error=Check+the+payment+details");const sb=await createClient(),{data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");const {error}=await sb.from("payment_history").insert({...p.data,user_id:user.id});if(error)redirect(`/dashboard/history?error=${encodeURIComponent(error.message)}`);revalidatePath("/dashboard/history");revalidatePath("/dashboard/analytics");}
export async function deletePayment(f:FormData){const id=String(f.get("id")),sb=await createClient(),{data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");await sb.from("payment_history").delete().eq("id",id).eq("user_id",user.id);revalidatePath("/dashboard/history");revalidatePath("/dashboard/analytics");}
