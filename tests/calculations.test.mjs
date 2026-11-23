import assert from "node:assert/strict";
import test from "node:test";
import { addBillingCycle, annualEquivalent, currency, dateInTimeZone, monthlyEquivalent } from "../src/lib/calculations.ts";

test("normalizes recurring costs to monthly and yearly estimates", () => {
  assert.equal(monthlyEquivalent(120, "weekly"), 520);
  assert.equal(monthlyEquivalent(900, "quarterly"), 300);
  assert.equal(monthlyEquivalent(1200, "half_yearly"), 200);
  assert.equal(monthlyEquivalent(1200, "yearly"), 100);
  assert.equal(annualEquivalent(120, "weekly"), 6240);
  assert.equal(annualEquivalent(900, "quarterly"), 3600);
  assert.equal(annualEquivalent(1200, "half_yearly"), 2400);
});

test("keeps a renewal anchored to the original month-end", () => {
  const anchor = "2026-01-31";
  const february = addBillingCycle(anchor, "monthly", anchor);
  assert.equal(february, "2026-02-28");
  assert.equal(addBillingCycle(february, "monthly", anchor), "2026-03-31");
});

test("keeps a mid-month renewal day across short months", () => {
  const anchor = "2026-01-30";
  const february = addBillingCycle(anchor, "monthly", anchor);
  assert.equal(february, "2026-02-28");
  assert.equal(addBillingCycle(february, "monthly", anchor), "2026-03-30");
});

test("supports weekly, quarterly, half-yearly, and annual calendar steps", () => {
  assert.equal(addBillingCycle("2026-01-02", "weekly"), "2026-01-09");
  assert.equal(addBillingCycle("2026-01-31", "quarterly"), "2026-04-30");
  assert.equal(addBillingCycle("2026-01-31", "half_yearly"), "2026-07-31");
  assert.equal(addBillingCycle("2026-01-31", "yearly"), "2027-01-31");
});

test("formats currency with decimals and safely handles invalid codes", () => {
  assert.equal(currency(119.5, "INR"), "₹119.50");
  assert.match(currency(12.5, "bad"), /₹12\.50/);
});

test("uses the configured timezone when resolving today's date", () => {
  assert.equal(dateInTimeZone(new Date("2026-11-24T02:00:00.000Z"), "America/New_York"), "2026-11-23");
});
