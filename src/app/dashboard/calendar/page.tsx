import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { requireAuthContext } from "@/lib/dal/auth";
import { addBillingCycle, currency, dateInTimeZone, type Cycle } from "@/lib/calculations";

type Subscription = {
  id: string;
  service_name: string;
  amount: number;
  currency: string;
  billing_cycle: Cycle;
  next_payment_date: string;
  auto_renewal: boolean;
};

type CalendarEvent = Subscription & { eventDate: string };

function eventsForMonth(subscriptions: Subscription[], monthKey: string) {
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-31`;
  const events: CalendarEvent[] = [];

  for (const subscription of subscriptions) {
    const anchorDate = subscription.next_payment_date;
    let dueDate = anchorDate;
    let occurrence = 0;

    if (!subscription.auto_renewal && dueDate < monthStart) continue;
    while (dueDate < monthStart && occurrence < 600) {
      dueDate = addBillingCycle(dueDate, subscription.billing_cycle, anchorDate);
      occurrence += 1;
    }

    while (dueDate >= monthStart && dueDate <= monthEnd && occurrence < 600) {
      events.push({ ...subscription, eventDate: dueDate });
      if (!subscription.auto_renewal) break;
      dueDate = addBillingCycle(dueDate, subscription.billing_cycle, anchorDate);
      occurrence += 1;
    }
  }

  return events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

export default async function Calendar({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requestedMonth } = await searchParams;
  const { supabase, user } = await requireAuthContext();
  const [{ data: profile }, { data: subscriptionRows }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions")
      .select("id,service_name,amount,currency,billing_cycle,next_payment_date,auto_renewal")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const today = dateInTimeZone(new Date(), profile?.timezone || "Asia/Kolkata");
  const currentMonth = today.slice(0, 7);
  const requestedParts = requestedMonth?.match(/^(\d{4})-(\d{2})$/);
  const requestedMonthNumber = requestedParts ? Number(requestedParts[2]) : 0;
  const key = requestedParts && requestedMonthNumber >= 1 && requestedMonthNumber <= 12
    ? `${requestedParts[1]}-${requestedParts[2]}`
    : currentMonth;
  const [year, monthNumber] = key.split("-").map(Number);
  const monthIndex = monthNumber - 1;
  const base = new Date(Date.UTC(year, monthIndex, 1, 12));
  const startOffset = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
  const monthDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const events = eventsForMonth((subscriptionRows ?? []) as Subscription[], key);
  const byDay = new Map<number, CalendarEvent[]>();
  events.forEach((event) => {
    const day = Number(event.eventDate.slice(-2));
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  });

  const previous = new Date(Date.UTC(year, monthIndex - 1, 1));
  const next = new Date(Date.UTC(year, monthIndex + 1, 1));
  const monthTitle = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(base);
  const shortMonth = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(base);

  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PLAN AHEAD</div>
          <h1>Payment calendar</h1>
          <p>Expected renewals based on the billing cycles you entered.</p>
        </div>
      </div>
      <section className="calendar-layout">
        <div className="panel calendar-panel">
          <div className="calendar-head">
            <div><h2>{monthTitle}</h2><p>{events.length} expected renewal{events.length === 1 ? "" : "s"}</p></div>
            <div className="calendar-controls">
              <Link href={`?month=${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`} aria-label="Previous month"><ChevronLeft/></Link>
              <Link href={`?month=${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`} aria-label="Next month"><ChevronRight/></Link>
            </div>
          </div>
          <div className="calendar-grid">
            <div className="weekday-row">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="day-grid">
              {Array.from({ length: 42 }, (_, index) => {
                const day = index - startOffset + 1;
                const valid = day > 0 && day <= monthDays;
                const dayEvents = byDay.get(day) ?? [];
                const isToday = valid && key === currentMonth && day === Number(today.slice(-2));
                return (
                  <div key={index} className={`calendar-day ${valid ? "" : "day-muted"} ${isToday ? "day-today" : ""}`}>
                    <span>{valid ? day : ""}</span>
                    {dayEvents.map((event) => (
                      <Link href={`/dashboard/subscriptions/${event.id}`} key={`${event.id}-${event.eventDate}`} className="calendar-event" title={`${event.service_name} expected renewal`}>
                        <i aria-hidden="true"/>{event.service_name} · {currency(Number(event.amount), event.currency)}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="calendar-disclaimer">These are expected dates, not confirmation that a payment was made.</p>
        </div>

        <aside className="panel month-list" aria-label={`${monthTitle} expected renewals`}>
          <div className="panel-heading"><div><h2>{monthTitle}</h2><p>Expected renewals</p></div><CalendarDays size={17}/></div>
          {events.length ? events.map((event) => (
            <Link className="month-event" key={`${event.id}-${event.eventDate}`} href={`/dashboard/subscriptions/${event.id}`}>
              <time dateTime={event.eventDate}>{event.eventDate.slice(-2)}<small>{shortMonth}</small></time>
              <span><b>{event.service_name}</b><small>{currency(Number(event.amount), event.currency)} · expected</small></span>
            </Link>
          )) : <div className="empty-inline"><CalendarDays size={20}/><span>No expected renewals this month.</span></div>}
        </aside>
      </section>
    </main>
  );
}
