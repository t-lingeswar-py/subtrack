import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { ArrowLeft, ArrowRight, Mail, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
export default async function Register({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const { error } = await searchParams;
  const errorText: Record<string, string> = {
    setup_required: "Connect Supabase to enable registration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the app.",
    invalid_form: "Check your details and make sure both password fields match.",
    registration_failed: "We couldn’t create your account. Check the email address and try again.",
  };
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back"><ArrowLeft size={15} aria-hidden="true"/> Back to SubTrack</Link>
      <div className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">s</span>subtrack</Link>
        <div className="auth-kicker">A CLEARER VIEW STARTS HERE</div>
        <h1>Make room for clarity.</h1>
        <p>Create a private workspace for your recurring plans.</p>
        {error && <div className="form-error" role="alert">{errorText[error] || "We couldn’t create your account. Please try again."}</div>}
        <form action={signUp} className="auth-form">
          <label>Full name<span className="input-wrap"><UserRound aria-hidden="true"/><input name="full_name" placeholder="Your name" required minLength={2} maxLength={100} autoComplete="name"/></span></label>
          <label>Email address<span className="input-wrap"><Mail aria-hidden="true"/><input name="email" type="email" placeholder="you@example.com" required autoComplete="email"/></span></label>
          <label>Password<span className="input-wrap"><LockKeyhole aria-hidden="true"/><input name="password" type="password" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password"/></span></label>
          <label>Confirm password<span className="input-wrap"><LockKeyhole aria-hidden="true"/><input name="confirm_password" type="password" placeholder="Type your password again" required minLength={8} autoComplete="new-password"/></span></label>
          <button className="button button-primary full-button">Create account <ArrowRight size={15} aria-hidden="true"/></button>
        </form>
        <div className="auth-switch">Already have an account? <Link href="/login">Log in</Link></div>
        <div className="auth-foot"><ShieldCheck size={14} aria-hidden="true"/> Your information stays in your private workspace.</div>
      </div>
    </main>
  );
}
