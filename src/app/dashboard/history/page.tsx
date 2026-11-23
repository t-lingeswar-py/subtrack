import { CreditCard } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { addPayment, deletePayment, updatePayment } from "@/app/dashboard/history/actions";
import { requireAuthContext } from "@/lib/dal/auth";
import { currency, dateInTimeZone } from "@/lib/calculations";
import { paymentMethods, supportedCurrencies } from "@/lib/validations/subscriptions";

type Query = { error?: string; from?: string; to?: string; success?: string };
const validDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const paymentErrors: Record<string, string> = {
  invalid_payment: "Check the payment date, amount, currency, and service.",
  payment_save_failed: "We couldn’t save this payment. Check that the subscription still exists.",
  payment_update_failed: "We couldn’t update this payment. Please try again.",
  payment_delete_failed: "We couldn’t delete this payment. Please try again.",
};

export default async function History({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const from = validDate(query.from) ? query.from : undefined;
  const to = validDate(query.to) ? query.to : undefined;
  const { supabase, user } = await requireAuthContext();
  const [{ data: profile }, { data: paymentRows }, { data: subscriptionRows }] = await Promise.all([
    supabase.from("profiles").select("default_currency,timezone").eq("id", user.id).maybeSingle(),
    supabase.from("payment_history").select("*,subscriptions(service_name)").eq("user_id", user.id).order("payment_date", { ascending: false }),
    supabase.from("subscriptions").select("id,service_name,amount,currency,payment_method").eq("user_id", user.id).order("service_name"),
  ]);

  const payments = (paymentRows ?? []).filter((payment) => (!from || payment.payment_date >= from) && (!to || payment.payment_date <= to));
  const subscriptions = subscriptionRows ?? [];
  const defaultCurrency = profile?.default_currency || "INR";
  const paidTotal = payments.filter((payment) => payment.status === "paid" && payment.currency === defaultCurrency)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const today = dateInTimeZone(new Date(), profile?.timezone || "Asia/Kolkata");

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div><div className="eyebrow">PAYMENT RECORDS</div><h1>Payment history</h1><p>Only payments you record appear here. Due dates never mark a payment as paid.</p></div>
      </div>

      {query.error && <div className="form-error" role="alert">{paymentErrors[query.error] || "We couldn’t complete that payment action."}</div>}
      {query.success && <div className="form-note" role="status">{query.success === "payment_created" ? "Payment record saved." : query.success === "payment_deleted" ? "Payment record deleted." : "Payment record updated."}</div>}
      <section className="metric-grid history-metrics" aria-label="Payment summary">
        <article className="metric-card"><div className="metric-top"><span>Payment records</span><CreditCard size={16} aria-hidden="true"/></div><strong>{payments.length}</strong><small>In the selected date range</small></article>
        <article className="metric-card"><div className="metric-top"><span>Paid total ({defaultCurrency})</span></div><strong>{currency(paidTotal, defaultCurrency)}</strong><small>Paid records in your default currency only</small></article>
      </section>

      <section className="panel subscription-panel" aria-label="Payment records">
        <div className="toolbar">
          <form className="filter-form" action="/dashboard/history">
            <label>From <input type="date" name="from" defaultValue={from}/></label>
            <label>To <input type="date" name="to" defaultValue={to}/></label>
            <button className="button button-quiet button-small">Filter</button>
          </form>
        </div>
        {payments.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">SUBSCRIPTION</th><th scope="col">PAYMENT DATE</th><th scope="col">METHOD</th><th scope="col">STATUS</th><th scope="col">AMOUNT</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{payments.map((payment) => (
                <tr key={payment.id}>
                  <td data-label="Subscription">{payment.subscriptions?.service_name || "Subscription"}</td>
                  <td data-label="Payment date">{new Date(`${payment.payment_date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</td>
                  <td data-label="Method">{payment.payment_method}</td>
                  <td data-label="Status"><span className={`status status-${payment.status}`}>{payment.status}</span></td>
                  <td data-label="Amount" className="table-amount">{currency(Number(payment.amount), payment.currency)}</td>
                  <td data-label="Actions"><div className="row-actions">
                    <details className="payment-edit">
                      <summary className="text-action">Edit</summary>
                      <form action={updatePayment} className="history-edit-form">
                        <input type="hidden" name="id" value={payment.id}/>
                        <input type="hidden" name="subscription_id" value={payment.subscription_id}/>
                        <label>Amount<input name="amount" type="number" step="0.01" min="0.01" max="9999999999.99" defaultValue={payment.amount} required/></label>
                        <label>Currency<select name="currency" defaultValue={payment.currency}>{supportedCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
                        <label>Date<input name="payment_date" type="date" defaultValue={payment.payment_date} required/></label>
                        <label>Method<select name="payment_method" defaultValue={payment.payment_method}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
                        <label>Status<select name="status" defaultValue={payment.status}><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
                        <button className="button button-primary button-small">Save payment</button>
                      </form>
                    </details>
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={payment.id}/>
                      <ConfirmSubmitButton className="text-action text-danger" ariaLabel={`Delete payment for ${payment.subscriptions?.service_name || "subscription"}`} confirmLabel="Delete payment" message="Delete this payment record? This cannot be undone.">Delete</ConfirmSubmitButton>
                    </form>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty-state"><div className="empty-icon"><CreditCard size={18}/></div><h2>No payment records yet.</h2><p>Record a payment after you confirm it with the merchant.</p></div>}
      </section>

      <section className="panel add-panel">
        <div className="panel-heading"><div><h2>Record a payment</h2><p>Enter what happened; this does not charge a card or contact a merchant.</p></div></div>
        {subscriptions.length ? (
          <form action={addPayment} className="subscription-form">
            <label>Subscription<select name="subscription_id" required>{subscriptions.map((subscription) => <option value={subscription.id} key={subscription.id}>{subscription.service_name}</option>)}</select></label>
            <label>Amount<input name="amount" type="number" step="0.01" min="0.01" max="9999999999.99" required/></label>
            <label>Currency<select name="currency" defaultValue={defaultCurrency}>{supportedCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
            <label>Payment date<input name="payment_date" type="date" defaultValue={today} required/></label>
            <label>Payment method<select name="payment_method" defaultValue="Other">{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
            <label>Status<select name="status" defaultValue="paid"><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
            <button className="button button-primary form-wide">Save payment record</button>
          </form>
        ) : <div className="empty-inline">Add a subscription before recording a payment.</div>}
      </section>
    </main>
  );
}
