# Payment receipt email

When a subscription invoice is charged, the Stripe webhook sends a branded
billing receipt from `LessAI <hello@lessai.io>`. This covers:

- the first charge on day 8, when the 7-day free trial ends
  (subject: "Payment confirmed — your LessAI Pro subscription is active"), and
- every renewal after that
  (subject: "Receipt: your LessAI Pro subscription renewed ($12.00)").

The $0 invoice Stripe creates when a trial starts is ignored, so no receipt
goes out at signup.

Code: `handleInvoicePaid` in `app/api/stripe/webhook/route.ts` and
`sendSubscriptionReceiptEmail` in `src/lib/email.ts`.

## Required Stripe configuration

The webhook endpoint in the Stripe Dashboard (Developers → Webhooks →
`https://lessai.io/api/stripe/webhook`) must be subscribed to the
`invoice.paid` event in addition to the events it already receives:

```text
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
invoice.paid            <- add this
```

No new environment variables are needed. The route reuses
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`,
`STRIPE_TEAMS_PRICE_ID`, and `RESEND_API_KEY`.

## Testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger invoice.paid
```

To test the real trial-to-paid transition, create a test subscription with a
7-day trial and advance a Stripe test clock past the trial end.
