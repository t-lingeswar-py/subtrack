import { z } from "zod";

export const subscriptionCategories = [
  "Entertainment",
  "Music",
  "Software",
  "Cloud Storage",
  "Education",
  "Shopping",
  "Gaming",
  "Productivity",
  "Fitness",
  "Other",
] as const;

export const supportedCurrencies = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD"] as const;

export const paymentMethods = [
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Wallet",
  "Other",
] as const;

const optionalWebsite = z.union([
  z.literal(""),
  z.string().url().refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use a secure website URL beginning with http:// or https://"),
]);

export const subscriptionFormSchema = z.object({
  service_name: z.string().trim().min(1, "Enter a service name").max(100),
  category: z.enum(subscriptionCategories),
  amount: z.coerce.number().finite().positive().max(9_999_999_999.99),
  currency: z.enum(supportedCurrencies),
  billing_cycle: z.enum(["weekly", "monthly", "quarterly", "half_yearly", "yearly"]),
  start_date: z.string().date(),
  next_payment_date: z.string().date(),
  payment_method: z.enum(paymentMethods),
  website_url: optionalWebsite,
  auto_renewal: z.union([z.literal("on"), z.boolean()]).optional(),
  trial_end_date: z.union([z.literal(""), z.string().date()]).optional(),
  notes: z.string().trim().max(2000).optional(),
}).superRefine((subscription, context) => {
  if (subscription.next_payment_date < subscription.start_date) {
    context.addIssue({
      code: "custom",
      path: ["next_payment_date"],
      message: "Next payment must be on or after the start date",
    });
  }

  if (subscription.trial_end_date && subscription.trial_end_date < subscription.start_date) {
    context.addIssue({
      code: "custom",
      path: ["trial_end_date"],
      message: "Trial end must be on or after the start date",
    });
  }
});
