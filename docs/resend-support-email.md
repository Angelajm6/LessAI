# Support email setup

Last verified against live DNS on 2026-09-15.

## How mail flows

**Outbound.** The product sends all transactional email through Resend as
`LessAI <hello@lessai.io>` and sets the same address as Reply-To. The
templates live in `src/lib/email.ts`.

**Inbound.** Mail sent to `hello@lessai.io` (including customer replies to
any transactional email) is delivered to a Google Workspace mailbox, not to
Resend. The MX record for `lessai.io` points at Google, and `hello@lessai.io`
exists as a full user named "LessAI Support" in the Bookore Systems Workspace,
where `lessai.io` is a verified secondary domain. Read and answer support mail
by signing in to that mailbox.

An earlier plan received mail through a Resend inbound webhook and forwarded
it. That route was removed on 2026-09-15 because Resend never receives mail
for this domain while the MX record points at Google. If a
`RESEND_INBOUND_WEBHOOK_SECRET` or `SUPPORT_INBOX_FORWARD_TO` variable is
still set in Vercel, it is unused and can be deleted.

## Required environment variables

```text
RESEND_API_KEY=re_...          # send-only key is sufficient
SUPPORT_EMAIL=hello@lessai.io  # optional, this is the default
```

## DNS records that make this work

| Record | Value | Purpose |
|---|---|---|
| `lessai.io` MX | `smtp.google.com` | Inbound mail to Google Workspace |
| `lessai.io` TXT | `v=spf1 include:_spf.google.com ~all` | SPF for mail sent directly from the Workspace mailbox |
| `resend._domainkey.lessai.io` TXT | Resend's DKIM public key | Signs outbound mail as lessai.io |
| `send.lessai.io` TXT | `v=spf1 include:amazonses.com ~all` | SPF for Resend's bounce address |
| `send.lessai.io` MX | `feedback-smtp.eu-west-1.amazonses.com` | Bounce handling for Resend |
| `_dmarc.lessai.io` TXT | `v=DMARC1; p=none;` | DMARC, monitoring only |

Do not change the `lessai.io` MX record to Resend or anything else; that
would cut off the support mailbox. DNS is hosted at Namecheap.

## Sender logo in Gmail

Gmail shows the Google profile picture of `hello@lessai.io` next to
transactional emails, because the address is a Google account and the mail
passes DKIM. The picture is set by the Workspace admin on the LessAI Support
user, its visibility is "people you interact with", and the admin setting
Directory → Directory settings → Profile editing → Photo is enabled. Gmail
caches sender lookups per recipient, so a change can take up to two days to
appear in an inbox that has already received mail from this address.

## Testing outbound mail

Run any of the `send*Email` helpers in `src/lib/email.ts` with a Node script
that loads `.env.local`, or trigger the Stripe billing emails end to end with
a test clock (see `docs/stripe-payment-receipt-email.md`).
