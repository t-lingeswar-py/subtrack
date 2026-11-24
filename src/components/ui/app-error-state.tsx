"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";

function getErrorDigest(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) return null;
  return typeof error.digest === "string" ? error.digest : null;
}

export function AppErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest = getErrorDigest(error);

  return (
    <main className="auth-page system-page">
      <section className="auth-card system-card" aria-labelledby="system-error-title">
        <span className="system-icon"><AlertCircle size={22} aria-hidden="true"/></span>
        <div className="auth-kicker">SUBTRACK NEEDS A MOMENT</div>
        <h1 id="system-error-title">This page didn’t load.</h1>
        <p>Something interrupted the page. Try again, or head back to SubTrack.</p>
        {digest && <p className="system-reference">Reference: <code>{digest}</code></p>}
        <div className="system-actions">
          <button className="button button-primary" onClick={retry}><RotateCw size={15} aria-hidden="true"/> Try again</button>
          <Link className="button button-quiet" href="/"><ArrowLeft size={15} aria-hidden="true"/> Back to SubTrack</Link>
        </div>
      </section>
    </main>
  );
}
