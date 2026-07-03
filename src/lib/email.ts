import { Resend } from 'resend'

const FROM = 'LessAI <hello@lessai.io>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const dashboardUrl = (path = '/dashboard') =>
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.io'}${path}`

// ── Shared HTML helpers ────────────────────────────────────────────────────

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#030712;padding:20px 32px;display:flex;align-items:center">
      <span style="background:rgba(255,255,255,0.15);border-radius:6px;padding:4px 10px;color:#fff;font-weight:800;font-size:14px;margin-right:8px">L</span>
      <span style="color:#fff;font-weight:700;font-size:16px">LessAI</span>
    </div>
    ${body}
    <div style="padding:20px 32px;background:#f9fafb;text-align:center;border-top:1px solid #f3f4f6">
      <p style="font-size:12px;color:#9ca3af;margin:0">LessAI · <a href="${dashboardUrl()}" style="color:#9ca3af">Dashboard</a> · <a href="mailto:hello@lessai.io" style="color:#9ca3af">hello@lessai.io</a></p>
    </div>
  </div>
</body>
</html>`
}

function ctaButton(href: string, label: string, color = '#059669') {
  return `<a href="${href}" style="background:${color};color:${color === '#fbbf24' ? '#111827' : '#fff'};font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block">${label}</a>`
}

// ── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  to, firstName, role, tools, stackSummary,
}: {
  to: string; firstName: string; role: string; tools: string[]; stackSummary: string
}) {
  const toolPills = tools.slice(0, 6).map(t =>
    `<span style="display:inline-block;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:600;margin:0 4px 4px 0">${t}</span>`
  ).join('')

  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">Your prompt playbook is ready ⚡</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 20px;line-height:1.6">
        Hey ${firstName} — we just built your personalized prompt playbook as a <strong>${role}</strong>. Here are the tools we covered:
      </p>
      <div style="margin-bottom:24px">${toolPills}</div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;font-size:14px;color:#065f46;line-height:1.6;margin-bottom:24px">${stackSummary}</div>
    </div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0">
    <div style="padding:24px 32px">
      <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px">What's inside your dashboard</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33%;padding-right:12px;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">💬</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Prompt Frameworks</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">Role-specific prompts for every tool you have.</div>
          </td>
          <td style="width:33%;padding-right:12px;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">📅</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Daily Tasks</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">10-min practice tasks that build real skill.</div>
          </td>
          <td style="width:33%;vertical-align:top">
            <div style="font-size:22px;margin-bottom:6px">🔍</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">Before/After</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.5">See exactly why weak prompts fail.</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:8px 32px 32px;text-align:center">
      ${ctaButton(dashboardUrl(), 'Open my playbook →')}
      <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Start with your first daily task — takes 10 minutes.</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Your prompt playbook is ready, ${firstName} ⚡`,
    html,
  })
  if (error) console.error('[email] sendWelcomeEmail error:', error)
  return { data, error }
}

// ── Day 4 trial reminder ─────────────────────────────────────────────────────

export async function sendTrialDay4Email({
  to, firstName, tasksCompleted, toolCount,
}: {
  to: string; firstName: string; tasksCompleted: number; toolCount: number
}) {
  const remaining = Math.max(0, (toolCount * 5) - tasksCompleted)
  const progressMsg = tasksCompleted === 0
    ? "You haven't started your daily tasks yet — now's the perfect time."
    : `You've completed ${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''} so far. ${remaining > 0 ? `${remaining} more to go to finish your first week.` : "You've nailed the first week!"}`

  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <div style="display:inline-block;background:#fef3c7;border:1px solid #fde68a;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;color:#92400e;margin-bottom:16px">⏳ 3 days left in your trial</div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">Hey ${firstName}, your trial ends in 3 days</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 16px;line-height:1.6">
        ${progressMsg}
      </p>
      <p style="font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.6">
        If you keep your plan, you'll be charged automatically on day 8. If you want to cancel, just do it before then — no hard feelings.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 8px">What you haven't tried yet:</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#4b5563;line-height:1.8">
          <li>The <strong>before/after prompt comparison</strong> for each tool</li>
          <li>Saving prompts to your personal library</li>
          <li>Asking the AI coach a question specific to your role</li>
        </ul>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(dashboardUrl(), 'Continue my trial →')}
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">Or <a href="mailto:hello@lessai.io" style="color:#059669">reply to this email</a> if you have questions.</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `${firstName}, your LessAI trial ends in 3 days`,
    html,
  })
  if (error) console.error('[email] sendTrialDay4Email error:', error)
  return { data, error }
}

// ── Day 7 trial final notice ──────────────────────────────────────────────────

export async function sendTrialDay7Email({
  to, firstName,
}: {
  to: string; firstName: string
}) {
  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <div style="display:inline-block;background:#fee2e2;border:1px solid #fecaca;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;color:#991b1b;margin-bottom:16px">🔔 Last day of your trial</div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">Your trial ends today, ${firstName}</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 16px;line-height:1.6">
        Tomorrow your card will be charged for your monthly plan. If you want to cancel, today is the day.
      </p>
      <p style="font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.6">
        If you're keeping it — great. Your prompt playbook, saved prompts, and task history all carry over. Nothing resets.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="font-size:13px;font-weight:700;color:#065f46;margin:0 0 4px">Why people keep LessAI after their trial:</p>
        <p style="font-size:13px;color:#047857;margin:0;line-height:1.7">"I finally stopped getting generic AI answers. My prompts are specific now and the output is night and day." — early user</p>
      </div>
    </div>
    <div style="padding:0 32px 16px;text-align:center">
      ${ctaButton(dashboardUrl(), 'Keep my plan →')}
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton('mailto:hello@lessai.io', 'Cancel my trial', '#f3f4f6')}
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Last chance — your LessAI trial ends today`,
    html,
  })
  if (error) console.error('[email] sendTrialDay7Email error:', error)
  return { data, error }
}

// ── Streak reminder email ────────────────────────────────────────────────────

export async function sendStreakReminderEmail({
  to, firstName, streak, toolCount,
}: {
  to: string; firstName: string; streak: number; toolCount: number
}) {
  const hasStreak = streak > 0
  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <div style="font-size:40px;margin-bottom:16px">${hasStreak ? '🔥' : '⚡'}</div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">
        ${hasStreak ? `Don't break your ${streak}-day streak, ${firstName}!` : `${firstName}, one quick task keeps the momentum going`}
      </h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 20px;line-height:1.6">
        ${hasStreak
          ? `You've been showing up for ${streak} days in a row — that's real skill-building. One 10-minute task today keeps your streak alive.`
          : `You've been building your AI skills across ${toolCount} tool${toolCount !== 1 ? 's' : ''}. A quick task today keeps the momentum going.`}
      </p>
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:24px">
        <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 4px">${hasStreak ? 'Your streak is on the line.' : 'Today\'s the day.'}</p>
        <p style="font-size:13px;color:#78350f;margin:0;line-height:1.6">
          Each daily task takes about 10 minutes and directly improves how you use AI in your actual work.
        </p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(dashboardUrl('/dashboard'), 'Do today\'s task →')}
      <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Takes about 10 minutes. ${hasStreak ? `Protect your ${streak}-day streak.` : 'Build your AI edge.'}</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: hasStreak ? `🔥 Don't break your ${streak}-day streak, ${firstName}` : `⚡ One quick task today, ${firstName}`,
    html,
  })
  if (error) console.error('[email] sendStreakReminderEmail error:', error)
  return { data, error }
}

// ── Invite email ─────────────────────────────────────────────────────────────

export async function sendInviteEmail({
  to, inviteLink, adminFirstName, companyName,
}: {
  to: string; inviteLink: string; adminFirstName: string; companyName: string
}) {
  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;color:#065f46;margin-bottom:16px">🎉 You're invited</div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">${adminFirstName} invited you to join ${companyName} on LessAI</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 20px;line-height:1.6">
        LessAI is where your team learns to get better results from AI tools — with role-specific prompts, daily practice tasks, and before/after benchmarking.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 10px">Here's what you'll get:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-bottom:8px">
              <span style="font-size:16px;margin-right:8px">⚡</span>
              <span style="font-size:13px;color:#374151">A personalized prompt playbook for your role and your tools</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding-bottom:8px">
              <span style="font-size:16px;margin-right:8px">📅</span>
              <span style="font-size:13px;color:#374151">Daily 10-minute practice tasks that build real AI skill</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top">
              <span style="font-size:16px;margin-right:8px">🔍</span>
              <span style="font-size:13px;color:#374151">Before/after prompt examples so you see exactly where to improve</span>
            </td>
          </tr>
        </table>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 24px">This invite link is for <strong>${to}</strong> and expires after first use.</p>
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(inviteLink, 'Accept invite & set up account →')}
      <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Takes about 5 minutes to set up your personalized stack.</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `${adminFirstName} invited you to join ${companyName} on LessAI`,
    html,
  })
  if (error) console.error('[email] sendInviteEmail error:', error)
  return { data, error }
}
