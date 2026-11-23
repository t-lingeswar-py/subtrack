import { Sparkles, TrendingDown } from "lucide-react";
import { CategoryChart, CostChart } from "@/components/analytics/charts";
import { requireAuthContext } from "@/lib/dal/auth";
import {
  annualEquivalent,
  currency,
  dateInTimeZone,
  monthlyEquivalent,
  type Cycle,
} from "@/lib/calculations";

type ActiveSubscription = {
  service_name: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: Cycle;
  usage_status: string;
};

type PaidRecord = { amount: number; currency: string; payment_date: string };

export default async function Analytics() {
  const { supabase, user } = await requireAuthContext();
  const [{ data: subscriptionRows }, { data: paymentRows }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("service_name,category,amount,currency,billing_cycle,usage_status")
      .eq("user_id", user.id).eq("status", "active"),
    supabase.from("payment_history").select("amount,currency,payment_date")
      .eq("user_id", user.id).eq("status", "paid"),
    supabase.from("profiles").select("default_currency,timezone").eq("id", user.id).maybeSingle(),
  ]);

  const currencyCode = profile?.default_currency || "INR";
  const subscriptions = (subscriptionRows ?? []) as ActiveSubscription[];
  const payments = (paymentRows ?? []) as PaidRecord[];
  const tracked = subscriptions.filter((subscription) => subscription.currency === currencyCode);
  const monthly = tracked.reduce((sum, subscription) =>
    sum + monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle), 0);
  const annual = tracked.reduce((sum, subscription) =>
    sum + annualEquivalent(Number(subscription.amount), subscription.billing_cycle), 0);
  const reviewable = tracked.filter((subscription) =>
    ["rarely_used", "not_used"].includes(subscription.usage_status));
  const potential = reviewable.reduce((sum, subscription) =>
    sum + monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle), 0);
  const average = tracked.length ? monthly / tracked.length : 0;
  const mostExpensive = [...tracked].sort((left, right) =>
    monthlyEquivalent(Number(right.amount), right.billing_cycle) -
    monthlyEquivalent(Number(left.amount), left.billing_cycle))[0];

  const categories = new Map<string, number>();
  for (const subscription of tracked) {
    const normalized = monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle);
    categories.set(subscription.category, (categories.get(subscription.category) ?? 0) + normalized);
  }
  const categoryData = [...categories.entries()].map(([name, value]) => ({ name, value: Math.round(value) }));
  const comparisonData = [...tracked]
    .sort((left, right) => Number(right.amount) - Number(left.amount))
    .slice(0, 6)
    .map((subscription) => ({
      name: subscription.service_name,
      monthly: Math.round(monthlyEquivalent(Number(subscription.amount), subscription.billing_cycle)),
    }));

  const timezone = profile?.timezone || "Asia/Kolkata";
  const [year, month] = dateInTimeZone(new Date(), timezone).split("-").map(Number);
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (5 - index), 1, 12));
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const spend = payments
      .filter((payment) => payment.payment_date.startsWith(monthKey) && payment.currency === currencyCode)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
      spend,
    };
  });
  const highestTrendValue = Math.max(...trend.map(({ spend }) => spend), 1);

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR SPENDING, BROKEN DOWN</div>
          <h1>Analytics</h1>
          <p>Insights calculated from your subscriptions and recorded payments.</p>
        </div>
      </div>

      {!tracked.length ? (
        <section className="panel empty-state">
          <div className="empty-icon"><Sparkles aria-hidden="true"/></div>
          <h3>Add subscriptions to see your spending insights.</h3>
          <p>Your charts and potential savings will show up once you add a plan.</p>
        </section>
      ) : (
        <>
          <section className="metric-grid analytics-metrics" aria-label="Spending summary">
            <Metric title="Monthly spending" value={currency(monthly, currencyCode)} hint="Active plans, normalized monthly"/>
            <Metric title="Annual estimate" value={currency(annual, currencyCode)} hint="Based on billing cycles"/>
            <Metric title="Average subscription" value={currency(average, currencyCode)} hint={`Across ${tracked.length} active plans`}/>
            <Metric title="Potential savings" value={currency(potential, currencyCode)} hint="Rarely or unused plans"/>
          </section>

          <section className="analytics-grid" aria-label="Spending charts">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div><h2>Recorded spending</h2><p>Paid payment history, last 6 months</p></div>
              </div>
              <div className="spending-bars" role="img" aria-label="Recorded monthly payments over the previous six months">
                {trend.map(({ month: label, spend }) => (
                  <div key={label}>
                    <span>{currency(spend, currencyCode)}</span>
                    <i style={{ height: `${Math.max(4, (spend / highestTrendValue) * 100)}%` }}/>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div><h2>By category</h2><p>Monthly equivalent · {categoryData.length} categories</p></div>
              </div>
              <CategoryChart data={categoryData}/>
            </article>
            <article className="panel chart-panel full-chart">
              <div className="panel-heading">
                <div><h2>Subscription comparison</h2><p>Monthly equivalent for your largest plans</p></div>
              </div>
              <CostChart data={comparisonData}/>
            </article>
          </section>

          <section className="insight-row" aria-label="Spending insights">
            {mostExpensive && (
              <div className="insight-card">
                <Sparkles aria-hidden="true"/>
                <p>Your most expensive subscription is <b>{mostExpensive.service_name}</b> at <b>
                  {currency(monthlyEquivalent(Number(mostExpensive.amount), mostExpensive.billing_cycle), currencyCode)}
                </b> per month.</p>
              </div>
            )}
            <div className="insight-card">
              <TrendingDown aria-hidden="true"/>
              <p>{reviewable.length
                ? `You have ${reviewable.length} subscriptions marked rarely used or not used, representing ${currency(potential, currencyCode)} in potential monthly savings.`
                : "Set usage status on a subscription to surface potential savings."}</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{title}</span></div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
