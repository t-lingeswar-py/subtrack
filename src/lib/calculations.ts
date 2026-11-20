export type Cycle = "weekly" | "monthly" | "quarterly" | "half_yearly" | "yearly";
export const monthlyEquivalent = (amount: number, cycle: Cycle) => ({ weekly: amount * 52 / 12, monthly: amount, quarterly: amount / 3, half_yearly: amount / 6, yearly: amount / 12 }[cycle]);
export const annualEquivalent = (amount: number, cycle: Cycle) => ({ weekly: amount * 52, monthly: amount * 12, quarterly: amount * 4, half_yearly: amount * 2, yearly: amount }[cycle]);
export const currency = (value: number, code = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(value);
