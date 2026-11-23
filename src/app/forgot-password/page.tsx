"use client";
import Link from "next/link";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError("Password reset is unavailable until Supabase is configured.");
      return;
    }

    setIsSending(true);
    try {
      const supabase = createBrowserClient(url, key);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      if (resetError) setError(resetError.message);
      else setMessage("If that address has an account, a reset link is on its way.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The reset request could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/login" className="auth-back"><ArrowLeft size={15} aria-hidden="true"/> Back to log in</Link>
      <div className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">s</span>subtrack</Link>
        <div className="auth-kicker">ACCOUNT RECOVERY</div>
        <h1>Reset your password.</h1>
        <p>We’ll email you a secure link to get back in.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-note" role="status">{message}</div>}
        <form onSubmit={send} className="auth-form">
          <label>Email address<span className="input-wrap"><Mail aria-hidden="true"/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required/></span></label>
          <button className="button button-primary full-button" disabled={isSending}>
            {isSending ? "Sending link…" : "Send reset link"}{!isSending && <ArrowRight size={15} aria-hidden="true"/>}
          </button>
        </form>
        <div className="auth-switch"><Link href="/login">Back to login</Link></div>
        <div className="auth-foot"><ShieldCheck size={14} aria-hidden="true"/> We only confirm the request was sent, not whether an account exists.</div>
      </div>
    </main>
  );
}
