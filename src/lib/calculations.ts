export type Cycle = "weekly" | "monthly" | "quarterly" | "half_yearly" | "yearly";
export const monthlyEquivalent = (amount: number, cycle: Cycle) => ({ weekly: amount * 52 / 12, monthly: amount, quarterly: amount / 3, half_yearly: amount / 6, yearly: amount / 12 }[cycle]);
export const annualEquivalent = (amount: number, cycle: Cycle) => ({ weekly: amount * 52, monthly: amount * 12, quarterly: amount * 4, half_yearly: amount * 2, yearly: amount }[cycle]);
const currencyLocales: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
};

export function currency(value: number, code = "INR") {
  const currencyCode = /^[A-Z]{3}$/.test(code) ? code : "INR";
  try {
    return new Intl.NumberFormat(currencyLocales[currencyCode] || "en", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  }
}

/** Return the next expected date while keeping the original renewal day stable. */
export function addBillingCycle(currentDate: string, cycle: Cycle, anchorDate = currentDate) {
  const current = new Date(`${currentDate}T00:00:00.000Z`);
  const anchor = new Date(`${anchorDate}T00:00:00.000Z`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(anchor.getTime())) return currentDate;

  if (cycle === "weekly") {
    current.setUTCDate(current.getUTCDate() + 7);
  } else {
    const months = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[cycle];
    const targetMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + months, 1));
    const targetLastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
    const anchorLastDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
    const anchorDay = anchor.getUTCDate();
    const day = anchorDay === anchorLastDay ? targetLastDay : Math.min(anchorDay, targetLastDay);
    current.setTime(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), day));
  }

  return `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`;
}

export function dateInTimeZone(date: Date, timeZone = "Asia/Kolkata") {
  const format = (zone: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  try {
    return format(timeZone);
  } catch {
    return format("Asia/Kolkata");
  }
}
