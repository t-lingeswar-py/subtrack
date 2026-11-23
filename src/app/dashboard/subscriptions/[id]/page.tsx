import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { changeStatus, deleteSubscription, updateSubscription, updateUsage } from "@/app/dashboard/actions";
import { requireAuthContext } from "@/lib/dal/auth";
import { currency, dateInTimeZone, monthlyEquivalent, type Cycle } from "@/lib/calculations";
import { paymentMethods, subscriptionCategories, supportedCurrencies } from "@/lib/validations/subscriptions";

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function daysUntil(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export default async function SubscriptionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, user } = await requireAuthContext();
  const [{ data: subscription }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
  ]);
  if (!subscription) notFound();

  const monthlyCost = monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle as Cycle);
  const today = dateInTimeZone(new Date(), profile?.timezone || "Asia/Kolkata");
  const trialDays = subscription.trial_end_date ? daysUntil(today, subscription.trial_end_date) : null;
  const externalWebsite = typeof subscription.website_url === "string" && /^https?:\/\//i.test(subscription.website_url)
    ? subscription.website_url
    : null;

  return (
    <main className="dashboard-content">
      <Link href="/dashboard/subscriptions" className="back-link"><ArrowLeft size={15}/> All subscriptions</Link>
      <div className="detail-heading">
        <div>
          <span className="service-icon service-large" aria-hidden="true">{subscription.service_name.slice(0, 1).toUpperCase()}</span>
          <div><div className="eyebrow">{subscription.category.toUpperCase()}</div><h1>{subscription.service_name}</h1></div>
        </div>
        <span className={`status status-${subscription.status}`}>{subscription.status}</span>
      </div>

      {query.error && <div className="form-error" role="alert">{query.error === "invalid_subscription" ? "Check the service name, price, cycle, and dates." : query.error === "usage_update_failed" ? "We couldn’t update the usage estimate." : query.error === "status_update_failed" ? "We couldn’t update the plan status." : "We couldn’t save your changes. Please try again."}</div>}
      {query.success === "updated" && <div className="form-note" role="status">Plan details saved.</div>}
      {query.success === "usage_updated" && <div className="form-note" role="status">Usage estimate updated.</div>}
      {query.success === "status_updated" && <div className="form-note" role="status">Plan status updated in SubTrack.</div>}
      {trialDays !== null && trialDays >= 0 && trialDays <= 14 && (
        <section className="trial-reminder" aria-label="Trial ending soon">
          <b>{trialDays === 0 ? "Trial ends today" : `Trial ends in ${trialDays} day${trialDays === 1 ? "" : "s"}`}</b>
          <span>Review the plan before {dateLabel(subscription.trial_end_date)}. SubTrack cannot cancel a merchant plan for you.</span>
        </section>
      )}

      <section className="detail-stats" aria-label="Subscription summary">
        <div><small>PLAN PRICE</small><b>{currency(Number(subscription.amount), subscription.currency)} <span>/ {subscription.billing_cycle.replace("_", " ")}</span></b></div>
        <div><small>MONTHLY EQUIVALENT</small><b>{currency(monthlyCost, subscription.currency)}</b></div>
        <div><small>NEXT EXPECTED DATE</small><b>{dateLabel(subscription.next_payment_date)}</b></div>
        <div><small>PAYMENT METHOD</small><b>{subscription.payment_method}</b></div>
      </section>

      <section className="detail-grid">
        <article className="panel detail-card">
          <div className="panel-heading">
            <div><h2>Plan details</h2><p>Update the information used for forecasts and reminders.</p></div>
            {externalWebsite && <a href={externalWebsite} target="_blank" rel="noopener noreferrer" className="icon-link" aria-label={`Open ${subscription.service_name} website`}><ExternalLink size={15}/></a>}
          </div>
          {subscription.trial_end_date && <div className="detail-trial-date"><span>Trial end</span><b>{dateLabel(subscription.trial_end_date)}</b></div>}
          <form action={updateSubscription} className="subscription-form">
            <input type="hidden" name="id" value={subscription.id}/>
            <label>Service name<input name="service_name" defaultValue={subscription.service_name} required maxLength={100}/></label>
            <label>Category<select name="category" defaultValue={subscription.category}>{subscriptionCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label>Amount<input name="amount" type="number" step="0.01" min="0.01" max="9999999999.99" defaultValue={subscription.amount} required/></label>
            <label>Currency<select name="currency" defaultValue={subscription.currency}>{supportedCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Billing cycle<select name="billing_cycle" defaultValue={subscription.billing_cycle}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="half_yearly">Half-yearly</option><option value="yearly">Yearly</option></select></label>
            <label>Start date<input name="start_date" type="date" defaultValue={subscription.start_date} required/></label>
            <label>Trial end date <span className="optional">optional</span><input name="trial_end_date" type="date" defaultValue={subscription.trial_end_date || ""}/></label>
            <label>Next expected date<input name="next_payment_date" type="date" defaultValue={subscription.next_payment_date} required/></label>
            <label>Payment method<select name="payment_method" defaultValue={subscription.payment_method}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
            <label className="form-wide">Service website <span className="optional">optional</span><input name="website_url" type="url" defaultValue={subscription.website_url || ""}/></label>
            <label className="form-wide">Notes <span className="optional">optional</span><textarea name="notes" defaultValue={subscription.notes || ""} rows={2} maxLength={2000}/></label>
            <label className="checkbox-label form-wide"><input name="auto_renewal" type="checkbox" defaultChecked={subscription.auto_renewal}/> Expected to renew automatically</label>
            <button className="button button-primary form-wide">Save changes</button>
          </form>
        </article>

        <aside className="detail-side">
          <article className="panel detail-card">
            <div className="panel-heading"><div><h2>Usage check-in</h2><p>Your own estimate; no activity is monitored.</p></div></div>
            <form action={updateUsage} className="usage-form">
              <input type="hidden" name="id" value={subscription.id}/>
              <select name="usage_status" defaultValue={subscription.usage_status} aria-label="How often do you use this service?">
                <option value="frequently_used">Frequently used</option>
                <option value="occasionally_used">Occasionally used</option>
                <option value="rarely_used">Rarely used</option>
                <option value="not_used">Not used</option>
              </select>
              <button className="button button-quiet button-small">Update usage</button>
            </form>
            {["rarely_used", "not_used"].includes(subscription.usage_status) && (
              <div className="savings-note"><Sparkles size={16} aria-hidden="true"/><span>Review this plan: {currency(monthlyCost, subscription.currency)} per month is a potential saving, not a guaranteed one.</span></div>
            )}
          </article>

          <article className="panel detail-card">
            <div className="panel-heading"><div><h2>Plan status</h2><p>Status changes here do not change billing with the merchant.</p></div></div>
            <div className="detail-actions">
              <form action={changeStatus}>
                <input type="hidden" name="id" value={subscription.id}/>
                <input type="hidden" name="status" value={subscription.status === "active" ? "paused" : "active"}/>
                <button className="button button-quiet button-small">{subscription.status === "active" ? "Pause in SubTrack" : "Reactivate in SubTrack"}</button>
              </form>
              {subscription.status !== "cancelled" && <form action={changeStatus}>
                <input type="hidden" name="id" value={subscription.id}/>
                <input type="hidden" name="status" value="cancelled"/>
                <ConfirmSubmitButton className="button button-quiet button-small text-danger" message="Mark this plan as cancelled in SubTrack? This does not cancel billing with the merchant.">Mark cancelled here</ConfirmSubmitButton>
              </form>}
              <Link className="button button-quiet button-small" href="/dashboard/history">Record a payment <ArrowUpRight size={13}/></Link>
              <form action={deleteSubscription}>
                <input type="hidden" name="id" value={subscription.id}/>
                <ConfirmSubmitButton className="text-action text-danger" message={`Delete ${subscription.service_name}? Recorded payment history may prevent deletion.`}>Delete plan data</ConfirmSubmitButton>
              </form>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
