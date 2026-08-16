# Support email setup

The product sends transactional email as `LessAI <hello@lessai.io>` and sets
that same address as the reply-to address. Incoming messages are accepted by
`POST /api/resend/inbound`, signature-verified, then forwarded to the inbox
specified by `SUPPORT_INBOX_FORWARD_TO`.

## Required Vercel environment variables

Add these to **Production** (and Preview if you want to test previews):

```text
RESEND_API_KEY=re_...
SUPPORT_EMAIL=hello@lessai.io
RESEND_INBOUND_WEBHOOK_SECRET=whsec_...
SUPPORT_INBOX_FORWARD_TO=an-inbox-you-monitor@example.com
```

`SUPPORT_INBOX_FORWARD_TO` should be a real inbox belonging to the team; it is
where messages sent to `hello@lessai.io` will arrive. Do not set it to
`hello@lessai.io`, which would create a forwarding loop.

## Resend configuration

1. In Resend, add and verify the sending domain `lessai.io`. Copy every DNS
   record Resend provides (SPF, DKIM, and verification record) into the domain
   DNS provider, then wait until the domain is verified.
2. Enable Receiving for `lessai.io` in Resend. Add the provided receiving MX
   record with the lowest numerical priority. This causes mail for
   `hello@lessai.io` to reach Resend.
3. Create a Resend webhook for `email.received` pointing to
   `https://lessai.io/api/resend/inbound`. Copy its signing secret into
   `RESEND_INBOUND_WEBHOOK_SECRET`.
4. Redeploy the site after adding the environment variables.
5. Send a test email from an unrelated mailbox to `hello@lessai.io`, confirm
   it reaches `SUPPORT_INBOX_FORWARD_TO`, then use the product's test-email
   route or normal onboarding to verify an outbound message and its Reply-To.

If `lessai.io` already has an MX record for Google Workspace, Microsoft 365,
or another mailbox host, do not replace it blindly. Either configure that host
to forward `hello@lessai.io` to Resend, or use the existing mailbox host for
inbound mail and keep Resend for sending. Resend recommends a subdomain for
inbound when an existing email provider owns the root domain.
