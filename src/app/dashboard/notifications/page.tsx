import { Bell, Check, Clock3 } from "lucide-react";
import { markRead } from "@/app/dashboard/actions";
import { requireAuthContext } from "@/lib/dal/auth";

export default async function Notifications({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { supabase, user }] = await Promise.all([searchParams, requireAuthContext()]);
  const { data: itemRows } = await supabase
    .from("notifications")
    .select("*,subscriptions(service_name,amount,currency,next_payment_date)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = itemRows ?? [];
  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">IN-APP REMINDERS</div>
          <h1>Notifications</h1>
          <p>Renewal reminders for dates you entered. A reminder is not a payment confirmation.</p>
        </div>
        <span className="page-heading-note"><Bell size={15} aria-hidden="true"/>{unreadCount} unread</span>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error === "notification_update_failed"
            ? "We couldn’t update this reminder. Please try again."
            : "We couldn’t complete that notification action. Please try again."}
        </div>
      )}

      <section className="panel notification-list" aria-label="Your renewal reminders">
        {items.length ? items.map((item) => (
          <article className={`notification-row ${item.is_read ? "" : "notification-unread"}`} key={item.id}>
            <div className="notification-icon"><Bell size={16} aria-hidden="true"/></div>
            <div className="notification-copy">
              <b>{item.title}</b>
              <p>{item.message}</p>
              <small><Clock3 size={12} aria-hidden="true"/><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></small>
            </div>
            {item.is_read ? (
              <span className="read-check"><Check size={15} aria-label="Read"/></span>
            ) : (
              <form action={markRead}>
                <input type="hidden" name="id" value={item.id}/>
                <button className="text-action">Mark read</button>
              </form>
            )}
          </article>
        )) : (
          <div className="empty-state">
            <div className="empty-icon"><Bell aria-hidden="true"/></div>
            <h2>You’re all caught up.</h2>
            <p>In-app reminders appear here when the scheduled reminder job is configured.</p>
          </div>
        )}
      </section>
    </main>
  );
}
