"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { addSubscription } from "@/app/dashboard/actions";
import {
  paymentMethods,
  subscriptionCategories,
  subscriptionFormSchema,
  supportedCurrencies,
} from "@/lib/validations/subscriptions";

export function SubscriptionForm({ today }: { today: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(subscriptionFormSchema),
    mode: "onBlur",
    defaultValues: {
      category: "Entertainment",
      currency: "INR",
      billing_cycle: "monthly",
      start_date: today,
      next_payment_date: today,
      payment_method: "Other",
      auto_renewal: "on",
    },
  });

  const submit = handleSubmit(async (_values, event) => {
    if (!event) return;
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    await addSubscription(formData);
  });

  return (
    <form onSubmit={submit} className="subscription-form" noValidate>
      <label>Service name
        <input {...register("service_name")} placeholder="e.g. Netflix" maxLength={100} aria-invalid={!!errors.service_name} aria-describedby={errors.service_name ? "service-name-error" : undefined}/>
        {errors.service_name && <small className="field-error" id="service-name-error" role="alert">{errors.service_name.message}</small>}
      </label>
      <label>Category
        <select {...register("category")}>
          {subscriptionCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label>Amount
        <input {...register("amount")} type="number" min="0.01" max="9999999999.99" step="0.01" placeholder="649.00" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "amount-error" : undefined}/>
        {errors.amount && <small className="field-error" id="amount-error" role="alert">Enter an amount greater than zero.</small>}
      </label>
      <label>Currency
        <select {...register("currency")}>
          {supportedCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>Billing cycle
        <select {...register("billing_cycle")}>
          <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option><option value="half_yearly">Half-yearly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      <label>Start date
        <input {...register("start_date")} type="date" aria-invalid={!!errors.start_date}/>
      </label>
      <label>Trial end date <span className="optional">optional</span>
        <input {...register("trial_end_date")} type="date" aria-invalid={!!errors.trial_end_date} aria-describedby={errors.trial_end_date ? "trial-date-error" : undefined}/>
        {errors.trial_end_date && <small className="field-error" id="trial-date-error" role="alert">{errors.trial_end_date.message}</small>}
      </label>
      <label>Next expected date
        <input {...register("next_payment_date")} type="date" aria-invalid={!!errors.next_payment_date} aria-describedby={errors.next_payment_date ? "next-date-error" : undefined}/>
        {errors.next_payment_date && <small className="field-error" id="next-date-error" role="alert">{errors.next_payment_date.message}</small>}
      </label>
      <label>Payment method
        <select {...register("payment_method")}>
          {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
      </label>
      <label className="form-wide">Service website <span className="optional">optional</span>
        <input {...register("website_url")} type="url" placeholder="https://example.com" aria-invalid={!!errors.website_url} aria-describedby={errors.website_url ? "website-error" : undefined}/>
        {errors.website_url && <small className="field-error" id="website-error" role="alert">Use a valid http or https address.</small>}
      </label>
      <label className="form-wide">Notes <span className="optional">optional</span>
        <textarea {...register("notes")} rows={2} maxLength={2000} placeholder="A note to remember"/>
      </label>
      <label className="checkbox-label form-wide">
        <input {...register("auto_renewal")} type="checkbox" value="on" defaultChecked/>
        Expected to renew automatically
      </label>
      <div className="form-wide">
        <button className="button button-primary" disabled={isSubmitting}>
          <Plus size={15} aria-hidden="true"/>{isSubmitting ? "Saving…" : "Save subscription"}
        </button>
      </div>
    </form>
  );
}
