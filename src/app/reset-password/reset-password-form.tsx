"use client";
import Link from "next/link";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError("Password reset is unavailable until Supabase is configured.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createBrowserClient(url, key);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) setError(updateError.message);
      else {
        setDone(true);
        setMessage("Your password has been updated.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your password could not be updated. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/login" className="auth-back"><ArrowLeft size={15} aria-hidden="true"/> Back to log in</Link>
      <div className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">s</span>subtrack</Link>
        <div className="auth-kicker">ACCOUNT RECOVERY</div>
        <h1>Choose a new password.</h1>
        <p>Use at least 8 characters.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-note" role="status">{message}</div>}
        {!done ? (
          <form onSubmit={save} className="auth-form">
            <label>New password<span className="input-wrap"><LockKeyhole aria-hidden="true"/><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password"/></span></label>
            <label>Confirm password<span className="input-wrap"><LockKeyhole aria-hidden="true"/><input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={8} autoComplete="new-password"/></span></label>
            <button className="button button-primary full-button" disabled={isSaving}>
              {isSaving ? "Updating password…" : "Update password"}{!isSaving && <ArrowRight size={15} aria-hidden="true"/>}
            </button>
          </form>
        ) : (
          <Link href="/login" className="button button-primary full-button">Continue to login <ArrowRight size={15} aria-hidden="true"/></Link>
        )}
        <div className="auth-foot"><ShieldCheck size={14} aria-hidden="true"/> Choose a password you do not use elsewhere.</div>
      </div>
    </main>
  );
}
