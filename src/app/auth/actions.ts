"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const registration = credentials.extend({
  full_name: z.string().trim().min(2).max(100),
  confirm_password: z.string(),
}).refine((value) => value.password === value.confirm_password, {
  path: ["confirm_password"],
});

export async function signIn(form: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/login?error=invalid_form");
  if (!isSupabaseConfigured()) redirect("/login?error=setup_required");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=invalid_credentials");
  redirect("/dashboard");
}

export async function signUp(form: FormData) {
  const parsed = registration.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/register?error=invalid_form");
  if (!isSupabaseConfigured()) redirect("/register?error=setup_required");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) redirect("/register?error=registration_failed");
  if (!data.session) {
    redirect("/login?message=Check+your+email+to+confirm+your+account+before+signing+in");
  }
  redirect("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
