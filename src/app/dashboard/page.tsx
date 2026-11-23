import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CirclePlus,
  CreditCard,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { requireAuthContext } from "@/lib/dal/auth";
import {
  annualEquivalent,
  currency,
  dateInTimeZone,
  monthlyEquivalent,
  type Cycle,
} from "@/lib/calculations";
import SpendingChart from "@/components/dashboard/spending-chart";

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { supabase, user }] = await Promise.all([
    searchParams,
    requireAuthContext(),
  ]);
  const [
    { data: subscriptionRows },
    { data: profile },
    { data: paymentRows },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("next_payment_date"),
    supabase.from("profiles").select("default_currency,full_name,timezone").eq("id", user.id).maybeSingle(),
    supabase.from("payment_history").select("amount,currency,payment_date").eq("user_id", user.id).eq("status", "paid"),
  ]);

  const subscriptions = subscriptionRows ?? [];
  const payments = paymentRows ?? [];
  const active = subscriptions.filter((subscription) => subscription.status === "active");
  const currencyCode = profile?.default_currency || "INR";
  const inDefaultCurrency = active.filter((subscription) => subscription.currency === currencyCode);
  const monthly = inDefaultCurrency.reduce(
    (sum, subscription) => sum + monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle as Cycle),
    0,
  );
  const annual = inDefaultCurrency.reduce(
    (sum, subscription) => sum + annualEquivalent(Number(subscription.amount), subscription.billing_cycle as Cycle),
    0,
  );
  const reviewable = inDefaultCurrency
    .filter((subscription) => subscription.usage_status === "rarely_used" || subscription.usage_status === "not_used")
    .sort((left, right) =>
      monthlyEquivalent(Number(right.amount), right.billing_cycle as Cycle) -
      monthlyEquivalent(Number(left.amount), left.billing_cycle as Cycle));
  const potentialMonthly = reviewable.reduce(
    (sum, subscription) => sum + monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle as Cycle),
    0,
  );

  const today = dateInTimeZone(new Date(), profile?.timezone || "Asia/Kolkata");
  const overdue = active.filter((subscription) => subscription.next_payment_date < today);
  const upcoming = active.filter((subscription) => subscription.next_payment_date >= today);
  const recent = [...subscriptions]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 4);
  const [year, month] = today.split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (5 - index), 1));
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const spend = payments
      .filter((payment) => payment.payment_date.startsWith(monthKey) && payment.currency === currencyCode)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
      spend,
    };
  });

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR RECURRING SPEND</div>
          <h1>Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
          <p>A considered view of your plans, expected dates, and recorded payments.</p>
        </div>
        <Link className="button button-primary" href="/dashboard/subscriptions#add">
          <CirclePlus size={16} aria-hidden="true"/> Add subscription
        </Link>
      </div>

      {error && <div className="form-error" role="alert">We couldn’t complete that dashboard action. Please try again.</div>}

      <section className="metric-grid" aria-label="Recurring spend summary">
        <Metric title="Monthly commitment" value={currency(monthly, currencyCode)} hint={`Active plans · ${currencyCode}`} icon={<CreditCard size={17}/>} tone="purple"/>
        <Metric title="Annual estimate" value={currency(annual, currencyCode)} hint={`Based on active plans · ${currencyCode}`} icon={<TrendingUp size={17}/>} tone="green"/>
        <Metric title="Active subscriptions" value={String(active.length)} hint={`${subscriptions.length} total tracked`} icon={<CirclePlus size={17}/>} tone="blue"/>
        <Metric title="Expected renewals" value={String(upcoming.length)} hint="Upcoming dates, not confirmed payments" icon={<CalendarDays size={17}/>} tone="orange"/>
      </section>

      {overdue.length > 0 && (
        <section className="panel overdue-panel" aria-labelledby="overdue-title">
          <div className="panel-heading">
            <div><h2 id="overdue-title">Expected dates to review</h2><p>These dates have passed. SubTrack does not know whether payment happened.</p></div>
            <span className="overdue-count">{overdue.length} to review</span>
          </div>
          <div className="overdue-list">
            {overdue.slice(0, 4).map((subscription) => (
              <div className="overdue-row" key={subscription.id}>
                <span className="service-icon service-generic" aria-hidden="true">{subscription.service_name.slice(0, 1).toUpperCase()}</span>
                <div><b>{subscription.service_name}</b><small>Expected {dateLabel(subscription.next_payment_date)}</small></div>
                <strong>{currency(Number(subscription.amount), subscription.currency)}</strong>
                <Link href={`/dashboard/subscriptions/${subscription.id}`}>Review plan <ArrowUpRight size={13} aria-hidden="true"/></Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="dashboard-columns">
        <section className="panel spending-panel">
          <div className="panel-heading">
            <div><h2>Recorded spending</h2><p>Paid records you entered · last 6 months · {currencyCode}</p></div>
            <Link href="/dashboard/analytics">Details <ArrowUpRight size={14} aria-hidden="true"/></Link>
          </div>
          <SpendingChart data={months} currencyCode={currencyCode}/>
        </section>

        <section className="panel upcoming-panel">
          <div className="panel-heading">
            <div><h2>Coming up</h2><p>Expected renewal dates</p></div>
            <Link href="/dashboard/calendar" aria-label="View renewal calendar"><CalendarDays size={15} aria-hidden="true"/></Link>
          </div>
          {upcoming.slice(0, 5).map((subscription) => (
            <Link className="upcoming-row" href={`/dashboard/subscriptions/${subscription.id}`} key={subscription.id}>
              <span className="service-icon service-generic" aria-hidden="true">{subscription.service_name.slice(0, 1).toUpperCase()}</span>
              <span className="upcoming-name"><b>{subscription.service_name}</b><small>{subscription.category} · {dateLabel(subscription.next_payment_date)}</small></span>
              <span className="upcoming-cost"><b>{currency(Number(subscription.amount), subscription.currency)}</b><small>{Math.ceil((Date.parse(`${subscription.next_payment_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)} days</small></span>
            </Link>
          ))}
          {!upcoming.length && <div className="empty-inline"><CalendarDays size={21} aria-hidden="true"/><span>No upcoming expected dates. Your calendar is clear.</span></div>}
        </section>
      </div>

      <section className="savings-radar" aria-labelledby="savings-radar-title">
        <div className="radar-copy">
          <div className="radar-kicker"><Sparkles size={14} aria-hidden="true"/> PERSONAL USAGE CHECK-IN <span>{currencyCode}</span></div>
          {reviewable.length ? (
            <>
              <h2 id="savings-radar-title">A little more room in your month?</h2>
              <p>These active plans are marked rarely used or not used. Review them to decide whether they still earn their place.</p>
              <div className="radar-total"><strong>{currency(potentialMonthly, currencyCode)}</strong><span>potential per month</span></div>
              <small className="radar-footnote">An estimate from your self-reported usage labels, not guaranteed savings.</small>
            </>
          ) : (
            <>
              <h2 id="savings-radar-title">Your subscriptions are in rotation.</h2>
              <p>{active.length ? `No active plans in ${currencyCode} are marked rarely used or not used. Update a plan’s usage check-in when your habits change.` : "Add an active subscription and record how often you use it to start a review."}</p>
              <Link className="radar-cta" href={active.length ? "/dashboard/subscriptions" : "/dashboard/subscriptions#add"}>
                {active.length ? "Review your subscriptions" : "Add a subscription"} <ArrowUpRight size={15} aria-hidden="true"/>
              </Link>
            </>
          )}
        </div>
        <div className="radar-list">
          {reviewable.slice(0, 3).map((subscription) => (
            <Link className="radar-item" href={`/dashboard/subscriptions/${subscription.id}`} key={subscription.id}>
              <span className="radar-service-icon" aria-hidden="true">{subscription.service_name.slice(0, 1).toUpperCase()}</span>
              <span className="radar-service"><b>{subscription.service_name}</b><small>{subscription.usage_status.replace("_", " ")}</small></span>
              <strong>{currency(monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle as Cycle), currencyCode)}<small>/mo</small></strong>
              <ArrowUpRight size={14} aria-hidden="true"/>
            </Link>
          ))}
          {reviewable.length > 3 && <Link className="radar-more" href="/dashboard/analytics">See all {reviewable.length} plans to review <ArrowUpRight size={14} aria-hidden="true"/></Link>}
          {!reviewable.length && (
            <div className="radar-empty">
              <span className="radar-check" aria-hidden="true">✓</span>
              <span><b>Grounded in your own check-ins</b><small>Only active plans in {currencyCode} are included.</small></span>
            </div>
          )}
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><h2>Recently added</h2><p>Your latest subscription details</p></div>
          <Link href="/dashboard/subscriptions">View all <ArrowUpRight size={14} aria-hidden="true"/></Link>
        </div>
        {recent.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">SERVICE</th><th scope="col">CATEGORY</th><th scope="col">BILLING</th><th scope="col">NEXT EXPECTED</th><th scope="col">AMOUNT</th><th scope="col">STATUS</th></tr></thead>
              <tbody>{recent.map((subscription) => (
                <tr key={subscription.id}>
                  <td data-label="Service"><Link className="table-service" href={`/dashboard/subscriptions/${subscription.id}`}><span className="service-icon service-generic" aria-hidden="true">{subscription.service_name[0].toUpperCase()}</span>{subscription.service_name}</Link></td>
                  <td data-label="Category">{subscription.category}</td>
                  <td data-label="Billing">{subscription.billing_cycle.replace("_", " ")}</td>
                  <td data-label="Next expected">{dateLabel(subscription.next_payment_date)}</td>
                  <td data-label="Amount" className="table-amount">{currency(Number(subscription.amount), subscription.currency)}</td>
                  <td data-label="Status"><span className={`status status-${subscription.status}`}>{subscription.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><CirclePlus aria-hidden="true"/></div>
            <h3>You haven’t added any subscriptions yet.</h3>
            <p>Add your first recurring payment and SubTrack will start organizing the details here.</p>
            <Link href="/dashboard/subscriptions#add" className="button button-primary button-small">Add your first subscription</Link>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{title}</span><i className={`metric-icon ${tone}`}>{icon}</i></div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
