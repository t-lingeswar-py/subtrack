import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionFormSchema } from "../src/lib/validations/subscriptions.ts";

const validSubscription = {
  service_name: "StreamBox",
  category: "Entertainment",
  amount: "12.99",
  currency: "USD",
  billing_cycle: "monthly",
  start_date: "2026-01-15",
  next_payment_date: "2026-02-15",
  payment_method: "Credit Card",
  website_url: "https://example.com",
};

test("accepts a valid subscription and normalizes its amount", () => {
  const parsed = subscriptionFormSchema.safeParse(validSubscription);

  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.amount, 12.99);
});

test("rejects invalid dates, dates before the start, and unsupported website protocols", () => {
  assert.equal(
    subscriptionFormSchema.safeParse({ ...validSubscription, start_date: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    subscriptionFormSchema.safeParse({ ...validSubscription, next_payment_date: "2026-01-14" }).success,
    false,
  );
  assert.equal(
    subscriptionFormSchema.safeParse({ ...validSubscription, website_url: "javascript:alert(1)" }).success,
    false,
  );
});
