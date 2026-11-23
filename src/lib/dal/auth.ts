import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Request-scoped authenticated Supabase context for server components/actions. */
export const getAuthContext = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
});

export async function requireAuthContext() {
  const context = await getAuthContext();
  if (!context) redirect("/login?error=setup_required");
  if (!context.user) redirect("/login");
  return { supabase: context.supabase, user: context.user };
}
