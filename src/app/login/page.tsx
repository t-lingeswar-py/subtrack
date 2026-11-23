import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { ArrowLeft, ArrowRight, Mail, LockKeyhole, ShieldCheck } from "lucide-react";
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}) {
  const { error, message } = await searchParams;
  const errorText: Record<string, string> = {
    setup_required: "Connect Supabase to enable accounts. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the app.",
    invalid_form: "Enter a valid email address and a password with at least 8 characters.",
    invalid_credentials: "That email and password combination could not be verified.",
  };
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back"><ArrowLeft size={15} aria-hidden="true"/> Back to SubTrack</Link>
      <div className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">s</span>subtrack</Link>
        <div className="auth-kicker">YOUR PRIVATE WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p>Pick up where you left off.</p>
        {error && <div className="form-error" role="alert">{errorText[error] || "We couldn’t sign you in. Please try again."}</div>}
        {message && <div className="form-note" role="status">{message}</div>}
        <form action={signIn} className="auth-form">
          <label>Email address<span className="input-wrap"><Mail aria-hidden="true"/><input name="email" type="email" placeholder="you@example.com" required autoComplete="email"/></span></label>
          <label>Password<span className="input-wrap"><LockKeyhole aria-hidden="true"/><input name="password" type="password" placeholder="At least 8 characters" required autoComplete="current-password" minLength={8}/></span></label>
          <div className="form-between"><Link href="/forgot-password">Forgot password?</Link></div>
          <button className="button button-primary full-button">Log in <ArrowRight size={15} aria-hidden="true"/></button>
        </form>
        <div className="auth-switch">New to SubTrack? <Link href="/register">Create an account</Link></div>
        <div className="auth-foot"><ShieldCheck size={14} aria-hidden="true"/> Your information stays in your private workspace.</div>
      </div>
    </main>
  );
}
