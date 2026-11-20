"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
const creds = z.object({ email: z.string().email(), password: z.string().min(8) });
export async function signIn(form: FormData) { const parsed = creds.safeParse(Object.fromEntries(form)); if (!parsed.success) redirect("/login?error=Enter+a+valid+email+and+password+(8+characters+minimum)"); const sb=await createClient(); const {error}=await sb.auth.signInWithPassword(parsed.data); if(error) redirect(`/login?error=${encodeURIComponent(error.message)}`); redirect("/dashboard"); }
export async function signUp(form: FormData) { const p=creds.extend({ full_name:z.string().min(2), confirm_password:z.string() }).refine(d=>d.password===d.confirm_password,{path:["confirm_password"]}).safeParse(Object.fromEntries(form)); if(!p.success) redirect("/register?error=Check+your+details+and+confirm+your+password"); const sb=await createClient(); const {data,error}=await sb.auth.signUp({email:p.data.email,password:p.data.password,options:{data:{full_name:p.data.full_name},emailRedirectTo:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/auth/callback`}}); if(error) redirect(`/register?error=${encodeURIComponent(error.message)}`); if(!data.session)redirect("/login?message=Check+your+email+to+confirm+your+account+before+signing+in"); redirect("/dashboard"); }
export async function signOut() { const sb=await createClient(); await sb.auth.signOut(); redirect("/"); }
