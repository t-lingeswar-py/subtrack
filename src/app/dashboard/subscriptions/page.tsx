import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { changeStatus, deleteSubscription } from "@/app/dashboard/actions";
import { requireAuthContext } from "@/lib/dal/auth";
import { currency, dateInTimeZone } from "@/lib/calculations";
import { subscriptionCategories } from "@/lib/validations/subscriptions";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";

type SearchParams = {
  q?: string;
  category?: string;
  status?: string;
  sort?: string;
  error?: string;
  success?: string;
};

const subscriptionErrors: Record<string, string> = {
  invalid_subscription: "Check the service name, price, cycle, and dates.",
  save_failed: "We couldn’t save this subscription. Please try again.",
  delete_failed: "We couldn’t delete this plan. Remove any linked payment records first, then try again.",
};

function readableDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function Subscriptions({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { supabase, user } = await requireAuthContext();
  const [{ data: subscriptionRows }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
  ]);

  const subscriptions = subscriptionRows ?? [];
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const matching = subscriptions.filter((subscription) =>
    (!query || subscription.service_name.toLocaleLowerCase().includes(query)) &&
    (!params.category || subscription.category === params.category) &&
    (!params.status || subscription.status === params.status),
  );
  const rows = [...matching].sort((a, b) => {
    switch (params.sort) {
      case "amount_desc": return Number(b.amount) - Number(a.amount);
      case "amount_asc": return Number(a.amount) - Number(b.amount);
      case "name": return a.service_name.localeCompare(b.service_name);
      default: return a.next_payment_date.localeCompare(b.next_payment_date);
    }
  });
  const today = dateInTimeZone(new Date(), profile?.timezone || "Asia/Kolkata");

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR RECURRING PAYMENTS</div>
          <h1>Subscriptions</h1>
          <p>Keep plans, costs, and expected renewal dates in one place.</p>
        </div>
        <Link className="button button-primary" href="#add"><Plus size={16}/> Add subscription</Link>
      </div>

      {params.error && <div className="form-error" role="alert">{subscriptionErrors[params.error] || "We couldn’t complete that subscription action."}</div>}
      {params.success === "created" && <div className="form-note" role="status">Subscription saved.</div>}

      <section className="panel subscription-panel" aria-label="Subscription list">
        <div className="toolbar">
          <form className="filter-form" action="/dashboard/subscriptions">
            <label className="search-wrap">
              <Search size={16} aria-hidden="true"/>
              <span className="sr-only">Search subscriptions</span>
              <input name="q" defaultValue={params.q} placeholder="Search plans"/>
            </label>
            <label className="sr-only" htmlFor="subscription-category">Filter by category</label>
            <select id="subscription-category" name="category" defaultValue={params.category || ""}>
              <option value="">All categories</option>
              {subscriptionCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="subscription-status">Filter by status</label>
            <select id="subscription-status" name="status" defaultValue={params.status || ""}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <label className="sr-only" htmlFor="subscription-sort">Sort subscriptions</label>
            <select id="subscription-sort" name="sort" defaultValue={params.sort || "next"}>
              <option value="next">Soonest renewal</option>
              <option value="amount_desc">Highest cost</option>
              <option value="amount_asc">Lowest cost</option>
              <option value="name">Service name</option>
            </select>
            <button className="button button-quiet button-small"><SlidersHorizontal size={14}/> Apply</button>
          </form>
          <span className="result-count">{rows.length} of {subscriptions.length} plans</span>
        </div>

        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">SERVICE</th><th scope="col">CATEGORY</th><th scope="col">PRICE</th><th scope="col">BILLING</th><th scope="col">NEXT EXPECTED</th><th scope="col">STATUS</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{rows.map((subscription) => (
                <tr key={subscription.id}>
                  <td><Link className="table-service" href={`/dashboard/subscriptions/${subscription.id}`}><span className="service-icon service-generic" aria-hidden="true">{subscription.service_name.slice(0, 1).toUpperCase()}</span>{subscription.service_name}</Link></td>
                  <td>{subscription.category}</td>
                  <td className="table-amount">{currency(Number(subscription.amount), subscription.currency)}<small className="billing-unit"> / {subscription.billing_cycle.replace("_", " ")}</small></td>
                  <td>{subscription.billing_cycle.replace("_", " ")}</td>
                  <td>{readableDate(subscription.next_payment_date)}</td>
                  <td><span className={`status status-${subscription.status}`}>{subscription.status}</span></td>
                  <td><div className="row-actions">
                    <form action={changeStatus}>
                      <input type="hidden" name="id" value={subscription.id}/>
                      <input type="hidden" name="status" value={subscription.status === "active" ? "paused" : "active"}/>
                      <button className="text-action">{subscription.status === "active" ? "Pause" : subscription.status === "paused" ? "Resume" : "Reactivate"}</button>
                    </form>
                    <form action={deleteSubscription}>
                      <input type="hidden" name="id" value={subscription.id}/>
                      <ConfirmSubmitButton className="text-action text-danger" ariaLabel={`Delete ${subscription.service_name}`} message={`Delete ${subscription.service_name}? Recorded payment history is retained and may prevent deletion.`}>Delete</ConfirmSubmitButton>
                    </form>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Search size={18}/></div>
            <h2>{subscriptions.length ? "No plans match these filters." : "Start with your first recurring payment."}</h2>
            <p>{subscriptions.length ? "Try another search or reset the filters." : "Add the services you pay for to see upcoming dates and your monthly commitment."}</p>
            {subscriptions.length ? <Link href="/dashboard/subscriptions" className="button button-quiet button-small">Reset filters</Link> : <Link href="#add" className="button button-primary button-small">Add your first subscription</Link>}
          </div>
        )}
      </section>

      <section className="panel add-panel" id="add" aria-labelledby="add-subscription-title">
        <div className="panel-heading">
          <div><h2 id="add-subscription-title">Add a subscription</h2><p>Forecast dates are estimates. Payments are recorded separately.</p></div>
          <Plus size={19} aria-hidden="true"/>
        </div>
        <SubscriptionForm today={today}/>
      </section>
    </main>
  );
}
