# Wallet and rewards: product feasibility

## Current boundary

SubTrack records subscriptions and user-entered payment history. A payment marked `paid` is a personal record, not proof that a payment processor charged or settled money. Never grant cash, credits, or purchasable points from that field alone.

## What can be added safely first

1. **Payment links for SubTrack Plus.** Use a payment provider's hosted checkout for SubTrack's own plan. Verify payment events on the server and update plan access from signed webhooks. Keep provider secrets server-only. This does not pay Netflix, Spotify, or another external merchant.
2. **Rewards for verified SubTrack purchases.** If desired, award a clearly defined, non-transferable promotion after a verified successful SubTrack payment. Start with a discount on SubTrack Plus; define funding, caps, expiry, refunds/reversals, and terms before exposing a balance. Never award from manually entered subscription history.
3. **External merchant payment links.** A user may follow an official merchant or partner checkout link, then record the result. Automatic payment and reconciliation require that merchant's supported API/partnership and the user's explicit authorization.

## What “wallet” means

- **Saved payment method / checkout:** a payment provider tokenizes the method and charges the merchant directly after user authorization. SubTrack does not hold a customer balance. This is the recommended route for SubTrack Plus.
- **Stored-value wallet used at third-party merchants:** SubTrack accepts funds, records balances, and pays other merchants. This can make SubTrack a payment instrument issuer/operator. RBI's current PPI direction describes stored-value instruments and says banks and non-banks need applicable RBI approval/authorization; closed-system instruments are limited to the issuer's own goods/services and cannot settle third-party services. Get India-specific payments counsel and a regulated issuing/processing partner before building this.
- **Merchant subscription billing:** providers such as Razorpay offer plans, recurring collection, payment verification, and subscription APIs for a merchant's own customer billing. That can support SubTrack Plus, but it is not an API for buying arbitrary third-party services.

## Recommended sequence

### Phase A — partner checkout for SubTrack Plus

- Choose a provider after business onboarding and pricing review.
- Create checkout sessions on the server; never accept an amount or user identity as authoritative from the browser.
- Verify webhook signatures against the raw request body, make event handling idempotent, and link provider customer/subscription IDs to the authenticated SubTrack user.
- Add billing status, invoices/receipts, cancellation, refunds, and a reconciliation view. Keep SubTrack's current manual payment history separate.

### Phase B — promotion points

- Add an append-only reward ledger, with unique source-event IDs, immutable award/reversal rows, and a computed balance.
- Award only from verified and settled provider events; reverse or hold rewards on refunds, chargebacks, and disputes.
- Start with points redeemable only for a discount on SubTrack Plus. Do not allow top-ups, transfers, cash-out, or third-party merchant spend in this phase.
- Decide whether “2%” means a one-time reward rate or something else. Do not promise a daily 2% return; a recurring daily financial return is materially different from a modest, funded loyalty promotion.

### Phase C — third-party subscription payments

This needs merchant acceptance agreements or integrations, user authorization for each supported payment method, robust payment state reconciliation, refunds/disputes support, fraud controls, customer support and country-specific regulatory review. Build it only for named merchants with documented APIs/partner terms. Do not present the present tracker as capable of paying those services.

## References

- [RBI Master Directions on Prepaid Payment Instruments](https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=12156&Mode=0&fn=9)
- [RBI FAQ on PPIs](https://www.rbi.org.in/scripts/FAQView.aspx?Id=126)
- [Razorpay Subscriptions overview](https://d6xcmfyh68wv8.cloudfront.net/docs/payments/subscriptions/)
- [Razorpay Subscriptions APIs](https://d6xcmfyh68wv8.cloudfront.net/docs/payments/subscriptions/apis/)

This is a technical product assessment, not legal or financial advice. Regulatory treatment depends on the actual funds flow, contractual roles, markets, and reward terms.
