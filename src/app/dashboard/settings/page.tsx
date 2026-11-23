import Link from "next/link";
import { Bell, Clock3, Download, KeyRound, UserRound } from "lucide-react";
import { deleteAccount, updateProfile, updateReminders } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireAuthContext } from "@/lib/dal/auth";
import { supportedCurrencies } from "@/lib/validations/subscriptions";

const timeZones = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const { supabase, user } = await requireAuthContext();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const activeReminderDays = new Set<number>(profile?.reminder_days ?? [0, 3, 7]);
  const timezone = profile?.timezone || "Asia/Kolkata";
  const timezoneOptions = [...new Set([timezone, ...timeZones])];

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div><div className="eyebrow">YOUR WORKSPACE</div><h1>Settings</h1><p>Set how SubTrack formats your plans and when it reminds you.</p></div>
      </div>

      {query.error && <div className="form-error" role="alert">
        {query.error === "invalid_profile" ? "Check your name, currency, and time zone." : query.error === "reminders_failed" ? "We couldn’t save reminder preferences. Please try again." : query.error === "account_confirmation_required" ? "Enter your current password and type DELETE to confirm." : query.error === "reauthentication_failed" ? "Your password could not be verified. Your account has not been deleted." : query.error === "account_delete_unavailable" ? "Account deletion is temporarily unavailable. Please contact support." : query.error === "account_delete_failed" ? "Your account could not be deleted. Please try again or contact support." : "Your settings could not be saved. Please try again."}
      </div>}
      {query.success === "profile_saved" && <div className="form-note" role="status">Profile settings saved.</div>}
      {query.success === "reminders_saved" && <div className="form-note" role="status">Reminder preferences saved for current and future plans.</div>}

      <section className="settings-grid" aria-label="Account settings">
        <article className="panel settings-card">
          <div className="panel-heading"><div><h2><UserRound size={16} aria-hidden="true"/> Profile and display</h2><p>Used for the workspace and your financial summaries.</p></div></div>
          <form action={updateProfile} className="subscription-form settings-form">
            <label className="form-wide">Full name<input name="full_name" defaultValue={profile?.full_name || ""} required maxLength={100}/></label>
            <label className="form-wide">Email address<input value={user.email || ""} readOnly aria-describedby="email-help"/><small id="email-help" className="field-help">Change your sign-in email through your authentication provider.</small></label>
            <label>Default currency<select name="default_currency" defaultValue={profile?.default_currency || "INR"}>{supportedCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
            <label>Time zone<select name="timezone" defaultValue={timezone}>{timezoneOptions.map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}</select></label>
            <button className="button button-primary form-wide">Save profile settings</button>
          </form>
        </article>

        <article className="panel settings-card">
          <div className="panel-heading"><div><h2><Bell size={16} aria-hidden="true"/> Renewal reminders</h2><p>Choose when to get an in-app reminder before a renewal or trial ends.</p></div></div>
          <form action={updateReminders} className="reminder-form">
            {[
              [7, "7 days before", "Time to review the upcoming plan"],
              [3, "3 days before", "A closer reminder"],
              [0, "On the expected date", "The date is here; payment is not assumed"],
            ].map(([days, title, description]) => (
              <label className="reminder-option" key={days}>
                <input type="checkbox" name={`day_${days}`} defaultChecked={activeReminderDays.has(Number(days))}/>
                <span><b>{title}</b><small>{description}</small></span>
              </label>
            ))}
            <button className="button button-primary">Save reminder preferences</button>
          </form>
          <div className="reminder-note"><Clock3 size={14} aria-hidden="true"/> In-app alerts require the scheduled reminder job. Email alerts are not configured.</div>
        </article>

        <article className="panel settings-card settings-account-card">
          <div className="panel-heading"><div><h2><KeyRound size={16} aria-hidden="true"/> Account and data</h2><p>Manage sign-in security and keep a copy of your records.</p></div></div>
          <div className="account-actions">
            <div><b>Password</b><small>Use a secure reset link sent to {user.email}.</small></div>
            <Link href="/forgot-password" className="button button-quiet button-small">Reset password</Link>
          </div>
          <div className="account-actions">
            <div><b>Export your data</b><small>Download your profile, plans, reminders, notifications, and manually entered payment history.</small></div>
            <a href="/api/export" className="button button-quiet button-small"><Download size={14} aria-hidden="true"/> Download JSON</a>
          </div>
          <p className="data-note">The export is private to your account. Payment records are user-entered and are not processor-confirmed transactions.</p>
          <div className="delete-account-block">
            <div><b>Delete account and data</b><p>This permanently removes your SubTrack profile, plans, reminders, notifications, and payment records.</p></div>
            <form action={deleteAccount} className="delete-account-form">
              <label>Current password<input type="password" name="current_password" autoComplete="current-password" minLength={8} required/></label>
              <label>Type <b>DELETE</b> to confirm<input name="confirmation" autoComplete="off" pattern="DELETE" required/></label>
              <ConfirmSubmitButton className="button button-danger" message="Permanently delete your SubTrack account and all saved data? This action cannot be undone.">Delete my account</ConfirmSubmitButton>
            </form>
          </div>
        </article>
      </section>
    </main>
  );
}
