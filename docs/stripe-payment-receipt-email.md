# Billing emails (trial ending, receipt, payment failed, cancellation)

When a subscription invoice is charged, the Stripe webhook sends a branded
billing receipt from `LessAI <hello@lessai.io>`. This covers:

- the first charge on day 8, when the 7-day free trial ends
  (subject: "Payment confirmed — your LessAI Pro subscription is active"), and
- every renewal after that
  (subject: "Receipt: your LessAI Pro subscription renewed ($12.00)").

The $0 invoice Stripe creates when a trial starts is ignored, so no receipt
goes out at signup.

When a subscription charge is declined, the webhook sends a payment-failed
email instead (subject: "Action needed: your LessAI Pro payment didn't go
through", or "Final notice: update your card to keep LessAI Pro" once Stripe
has no retries left). It shows the amount, card, and decline reason, the date
of the next automatic retry, and an "Update payment method" button that opens
the billing settings page.

When a customer cancels from the billing portal, Stripe schedules the
cancellation for the end of the paid period and the webhook sends a
confirmation (subject: "Your LessAI Pro subscription is canceled — access
until <date>") with a "Reactivate my plan" button. It is sent once, when
`cancel_at_period_end` flips on in `customer.subscription.updated`. If a
subscription is ended immediately instead, `customer.subscription.deleted`
sends the "Your LessAI Pro subscription has ended" variant. A subscription
that ends after a scheduled cancellation does not email a second time.

Three days before a trial ends, Stripe fires
`customer.subscription.trial_will_end` and the webhook sends a reminder
(subject: "Your LessAI trial ends in 3 days — $12.00 on <date>") quoting the
exact end date, first charge, and card on file, with a "Manage billing" link
for cancelling. This is the only trial reminder LessAI sends: the former
cron-based day-4 and day-7 emails were retired in favor of it, so the daily
`trial-emails` cron now only sends the day-one support check-in.

Code: `handleTrialWillEnd`, `handleInvoicePaid`, `handleInvoicePaymentFailed`,
and `sendCancellationEmail` in `app/api/stripe/webhook/route.ts`;
`sendTrialEndingEmail`, `sendSubscriptionReceiptEmail`,
`sendPaymentFailedEmail`, and `sendSubscriptionCanceledEmail` in
`src/lib/email.ts`.

## Required Stripe configuration

The webhook endpoint in the Stripe Dashboard (Developers → Webhooks →
`https://lessai.io/api/stripe/webhook`) must be subscribed to the
`invoice.paid` and `invoice.payment_failed` events in addition to the events
it already receives:

```text
checkout.session.completed
customer.subscription.updated   (also sends the cancellation confirmation)
customer.subscription.deleted
invoice.paid                          <- add this
invoice.payment_failed                <- add this
customer.subscription.trial_will_end  <- add this
```

No new environment variables are needed. The route reuses
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`,
`STRIPE_TEAMS_PRICE_ID`, and `RESEND_API_KEY`.

## Testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.trial_will_end
```

To test the cancellation email, cancel a test subscription from the Stripe
Dashboard or the billing portal with "cancel at period end".

To test the real trial-to-paid transition, create a test subscription with a
7-day trial and advance a Stripe test clock past the trial end.
