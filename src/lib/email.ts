import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LessAI <onboarding@resend.dev>'

export async function sendWelcomeEmail({
  to,
  firstName,
  role,
  tools,
  stackSummary,
}: {
  to: string
  firstName: string
  role: string
  tools: string[]
  stackSummary: string
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.co'}/dashboard`

  const toolPills = tools.slice(0, 6).map(t =>
    `<span style="display:inline-block;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:600;margin:0 4px 4px 0">${t}</span>`
  ).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <!-- Header -->
    <div style="background:#059669;padding:20px 32px;display:flex;align-items:center">
      <span style="background:rgba(255,255,255,0.2);border-radius:6px;padding:4px 8px;color:#fff;font-weight:800;font-size:14px;margin-right:8px">L</span>
      <span style="color:#fff;font-weight:700;font-size:16px">LessAI</span>
    </div>
    <!-- Hero -->
    <div style="padding:32px 32px 24px">
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">Your AI Stack Map is ready ⚡</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 20px;line-height:1.6">
        Hey ${firstName} — we built a personalized learning plan for you as a <strong>${role}</strong>. Here's your stack:
      </p>
      <div>${toolPills}</div>
    </div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0">
    <!-- Summary -->
    <div style="padding:24px 32px">
      <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px">What LessAI built for you</h2>
      <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;font-size:14px;color:#065f46;line-height:1.6;margin:0">${stackSummary}</p>
    </div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0">
    <!-- Features -->
    <div style="padding:24px 32px">
      <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px">Inside your dashboard</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33%;padding-right:12px;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">📅</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Daily Tasks</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">10-min tasks per tool, tailored to your role.</div>
          </td>
          <td style="width:33%;padding-right:12px;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">📖</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Tool Guides</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">Comparison cards for every tool in your stack.</div>
          </td>
          <td style="width:33%;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">💬</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Ask AI</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">A coach that knows your stack and role.</div>
          </td>
        </tr>
      </table>
    </div>
    <!-- CTA -->
    <div style="padding:8px 32px 32px;text-align:center">
      <a href="${dashboardUrl}" style="background:#059669;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block">Open my Stack Map →</a>
      <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Takes 10 minutes to complete your first task.</p>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;text-align:center">
      <p style="font-size:12px;color:#9ca3af;margin:0">You're receiving this because you just completed onboarding on LessAI.</p>
    </div>
  </div>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Your AI Stack Map is ready, ${firstName} ⚡`,
    html,
  })

  if (error) console.error('[email] sendWelcomeEmail error:', error)
  return { data, error }
}
