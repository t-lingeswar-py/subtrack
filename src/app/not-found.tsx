import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="auth-page system-page">
      <section className="auth-card system-card" aria-labelledby="not-found-title">
        <span className="system-icon"><Compass size={22} aria-hidden="true"/></span>
        <div className="auth-kicker">404 · OFF THE MAP</div>
        <h1 id="not-found-title">This page isn’t here.</h1>
        <p>The link may be out of date, or the page may have moved. Let’s get you back on track.</p>
        <div className="system-actions">
          <Link className="button button-primary" href="/"><ArrowLeft size={15} aria-hidden="true"/> Back to SubTrack</Link>
          <Link className="button button-quiet" href="/login">Log in</Link>
        </div>
      </section>
    </main>
  );
}
