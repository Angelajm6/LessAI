import { Resend } from 'resend'

// Keep the address used in transactional email and the address users reply to
// together. Override SUPPORT_EMAIL only if the verified support address changes.
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'hello@lessai.io'
const FROM = `LessAI <${SUPPORT_EMAIL}>`

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const dashboardUrl = (path = '/dashboard') =>
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.io'}${path}`

// ── Shared HTML helpers ────────────────────────────────────────────────────

const LOGO_URL = 'https://lessai.io/logo.svg'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.io'
const BRAND_GREEN = '#059669'
const BRAND_GREEN_LIGHT = '#10b981'

function emailShell(body: string, { badge }: { badge?: string } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>LessAI</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px 24px">

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:0">
            <!-- Green accent line -->
            <div style="height:3px;background:linear-gradient(90deg,${BRAND_GREEN} 0%,${BRAND_GREEN_LIGHT} 50%,#f59e0b 100%)"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:20px 28px;vertical-align:middle">
                  <!-- Logo mark + wordmark -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;width:36px">
                        <img src="${LOGO_URL}" width="30" height="30" alt="" style="display:block;width:30px;height:30px">
                      </td>
                      <td style="vertical-align:middle">
                        <span style="color:#ffffff;font-size:17px;font-weight:800;letter-spacing:-0.4px;line-height:1">LessAI</span>
                      </td>
                    </tr>
                  </table>
                </td>
                ${badge ? `<td style="padding:20px 28px 20px 0;vertical-align:middle;text-align:right">
                  <span style="background:rgba(5,150,105,0.2);border:1px solid rgba(5,150,105,0.4);color:#6ee7b7;font-size:10px;font-weight:700;padding:4px 10px;border-radius:100px;letter-spacing:0.06em;white-space:nowrap">${badge}</span>
                </td>` : '<td></td>'}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr><td>${body}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px;background:#f8f9fa;border-top:1px solid #eaecef;text-align:center">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td align="center">
                <p style="font-size:12px;color:#6b7280;margin:0 0 6px">
                  <a href="${APP_URL}/dashboard" style="color:${BRAND_GREEN};text-decoration:none;font-weight:600">Open LessAI</a>
                  &nbsp;·&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}" style="color:#9ca3af;text-decoration:none">${SUPPORT_EMAIL}</a>
                  &nbsp;·&nbsp;
                  <a href="${APP_URL}/settings" style="color:#9ca3af;text-decoration:none">Account settings</a>
                </p>
                <p style="font-size:11px;color:#d1d5db;margin:0">
                  You're receiving this because you have a LessAI account.
                  &nbsp;<a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe" style="color:#d1d5db;text-decoration:underline">Unsubscribe</a>
                </p>
              </td>
            </tr></table>
          </td>
        </tr>

      </table>
      <!-- End card -->

    </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`
}

function ctaButton(href: string, label: string, style: 'primary' | 'secondary' | 'amber' = 'primary') {
  const styles = {
    primary: `background:${BRAND_GREEN};color:#ffffff`,
    secondary: `background:#f3f4f6;color:#111827`,
    amber: `background:#f59e0b;color:#111827`,
  }
  return `<a href="${href}" style="${styles[style]};font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;display:inline-block;letter-spacing:-0.1px">${label}</a>`
}

// ── Signup welcome (pre-onboarding) ─────────────────────────────────────────

export async function sendSignupWelcomeEmail({ to, firstName }: { to: string; firstName: string }) {
  const onboardingUrl = dashboardUrl('/onboarding')
  const html = emailShell(`
    <div style="padding:36px 32px 28px">
      <p style="font-size:15px;color:#6b7280;margin:0 0 6px">Hey ${firstName},</p>
      <h1 style="font-size:26px;font-weight:800;color:#0a0a0a;margin:0 0 16px;line-height:1.25">Welcome to LessAI.</h1>
      <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.7">
        Your account is ready. Next step: a quick 4-step setup so we can build your personalized AI prompt playbook — tailored to your role, your tools, and your company.
      </p>
      <div style="background:#f0fdf4;border-left:3px solid #10b981;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px">
        <p style="font-size:13px;font-weight:700;color:#065f46;margin:0 0 2px">What you get at the end:</p>
        <p style="font-size:13px;color:#047857;margin:0;line-height:1.6">A personalized prompt playbook for every AI tool you use — plus daily 10-minute practice tasks and a before/after scoring system so you can see yourself improve.</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:2px"><span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:100px;text-align:center;line-height:20px">1</span></td>
          <td style="padding-bottom:12px;vertical-align:top;padding-left:8px"><span style="font-size:14px;color:#111827;font-weight:600">Your role</span><br><span style="font-size:13px;color:#6b7280">So we know which prompts and tasks apply to you</span></td>
        </tr>
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:2px"><span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:100px;text-align:center;line-height:20px">2</span></td>
          <td style="padding-bottom:12px;vertical-align:top;padding-left:8px"><span style="font-size:14px;color:#111827;font-weight:600">Your company</span><br><span style="font-size:13px;color:#6b7280">We scan your website and pull context automatically</span></td>
        </tr>
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:2px"><span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:100px;text-align:center;line-height:20px">3</span></td>
          <td style="padding-bottom:12px;vertical-align:top;padding-left:8px"><span style="font-size:14px;color:#111827;font-weight:600">Your AI tools</span><br><span style="font-size:13px;color:#6b7280">ChatGPT, Claude, Notion AI — pick everything you use</span></td>
        </tr>
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:2px"><span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:100px;text-align:center;line-height:20px">4</span></td>
          <td style="vertical-align:top;padding-left:8px"><span style="font-size:14px;color:#111827;font-weight:600">Your skill level</span><br><span style="font-size:13px;color:#6b7280">We calibrate the playbook difficulty to where you actually are</span></td>
        </tr>
      </table>
    </div>
    <div style="padding:0 32px 36px;text-align:center">
      <a href="${onboardingUrl}" style="display:inline-block;background:#10b981;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:-0.1px">Complete my setup →</a>
      <p style="font-size:12px;color:#9ca3af;margin:14px 0 0">Takes about 5 minutes &nbsp;·&nbsp; No credit card asked yet</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    replyTo: SUPPORT_EMAIL,
    subject: `Welcome to LessAI, ${firstName} — complete your setup`,
    html,
  })
  if (error) console.error('[email] sendSignupWelcomeEmail error:', error)
  return { data, error }
}

// ── Day-one support check-in ────────────────────────────────────────────────

export async function sendDayOneSupportEmail({ to, firstName }: { to: string; firstName: string }) {
  const replyUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('A few answers from a new LessAI member')}&body=${encodeURIComponent('1. What made you sign up for LessAI?\n\n2. What do you want to get better at with AI?\n\n3. How did you hear about us?\n\n4. What would make LessAI most useful in your first week?')}`
  const html = emailShell(`
    <div style="padding:36px 32px 12px">
      <p style="font-size:15px;color:#6b7280;margin:0 0 8px">Hey ${firstName},</p>
      <h1 style="font-size:25px;font-weight:800;color:#0a0a0a;margin:0 0 14px;line-height:1.25">A quick hello from LessAI.</h1>
      <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.7">
        If you have a question, hit a snag, or want a second opinion, just reply to this email. It goes straight to our small team at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_GREEN};font-weight:600;text-decoration:none">${SUPPORT_EMAIL}</a>.
      </p>
      <div style="background:#f0fdf4;border-left:3px solid #10b981;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:22px">
        <p style="font-size:13px;font-weight:700;color:#065f46;margin:0 0 4px">Four quick questions</p>
        <p style="font-size:13px;color:#047857;margin:0;line-height:1.6">Short answers are perfect — no form, no fuss.</p>
      </div>
      <ol style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.85">
        <li>What made you sign up for LessAI?</li>
        <li>What do you want to get better at with AI?</li>
        <li>How did you hear about us?</li>
        <li>What would make LessAI most useful in your first week?</li>
      </ol>
    </div>
    <div style="padding:24px 32px 36px;text-align:center">
      ${ctaButton(replyUrl, 'Reply with my answers →')}
      <p style="font-size:12px;color:#9ca3af;margin:14px 0 0">Your feedback helps us make LessAI better for you.</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    replyTo: SUPPORT_EMAIL,
    subject: `Quick question, ${firstName} — how can we help?`,
    html,
  })
  if (error) console.error('[email] sendDayOneSupportEmail error:', error)
  return { data, error }
}

// ── Welcome email (post-onboarding) ─────────────────────────────────────────

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
    replyTo: SUPPORT_EMAIL,
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
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">Or <a href="mailto:${SUPPORT_EMAIL}" style="color:#059669">reply to this email</a> if you have questions.</p>
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    replyTo: SUPPORT_EMAIL,
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
      ${ctaButton(`mailto:${SUPPORT_EMAIL}`, 'Cancel my trial', 'secondary')}
    </div>
  `)

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    replyTo: SUPPORT_EMAIL,
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
    replyTo: SUPPORT_EMAIL,
    subject: hasStreak ? `🔥 Don't break your ${streak}-day streak, ${firstName}` : `⚡ One quick task today, ${firstName}`,
    html,
  })
  if (error) console.error('[email] sendStreakReminderEmail error:', error)
  return { data, error }
}

// ── Weekly digest ────────────────────────────────────────────────────────────

export async function sendWeeklyDigestEmail({
  to, firstName, tasksThisWeek, totalTasks, streak, xp, levelName, topTool, nextTask,
}: {
  to: string
  firstName: string
  tasksThisWeek: number
  totalTasks: number
  streak: number
  xp: number
  levelName: string
  topTool: string | null
  nextTask: { tool: string; title: string; task: string } | null
}) {
  const streakLine = streak >= 7
    ? `<span style="background:#fef3c7;border:1px solid #fde68a;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:700;color:#92400e">🔥 ${streak}-day streak</span>`
    : streak >= 3
    ? `<span style="background:#fef9c3;border:1px solid #fde68a;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:700;color:#a16207">📅 ${streak}-day streak</span>`
    : ''

  const topToolLine = topTool
    ? `<p style="font-size:14px;color:#4b5563;margin:0"><strong>Most practiced:</strong> ${topTool}</p>`
    : ''

  const nextTaskBlock = nextTask ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px">Up next — ${nextTask.tool}</p>
      <p style="font-size:14px;font-weight:700;color:#065f46;margin:0 0 6px">${nextTask.title}</p>
      <p style="font-size:13px;color:#047857;margin:0;line-height:1.6">${nextTask.task}</p>
    </div>` : ''

  const statsRow = (label: string, value: string, emoji: string) =>
    `<td style="width:33%;text-align:center;padding:0 8px">
      <div style="font-size:24px;margin-bottom:4px">${emoji}</div>
      <div style="font-size:22px;font-weight:800;color:#111827">${value}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px">${label}</div>
    </td>`

  const html = emailShell(`
    <div style="padding:32px 32px 24px">
      <div style="margin-bottom:16px">${streakLine}</div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">
        ${tasksThisWeek > 0 ? `Nice work this week, ${firstName} 💪` : `Let's get back on track, ${firstName}`}
      </h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.6">
        ${tasksThisWeek > 0
          ? `You completed <strong>${tasksThisWeek} task${tasksThisWeek !== 1 ? 's' : ''}</strong> this week. Here's where you stand:`
          : `You didn't complete any tasks last week — this week is a fresh start. One 10-minute task is all it takes.`}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
        <tr>
          ${statsRow('This week', String(tasksThisWeek), '✅')}
          ${statsRow('Total tasks', String(totalTasks), '🎯')}
          ${statsRow('Total XP', String(xp), '⚡')}
        </tr>
      </table>
      <div style="margin-bottom:20px">
        <p style="font-size:14px;color:#4b5563;margin:0 0 4px"><strong>Level:</strong> ${levelName}</p>
        ${topToolLine}
      </div>
      ${nextTaskBlock}
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(dashboardUrl('/dashboard'), "Go to today's task →")}
      <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">10 minutes a day builds a real AI edge over time.</p>
    </div>
  `)

  const subjectLine = tasksThisWeek > 0
    ? `Your LessAI week in review — ${tasksThisWeek} task${tasksThisWeek !== 1 ? 's' : ''} done ✅`
    : `Your LessAI weekly digest — let's pick it back up`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    replyTo: SUPPORT_EMAIL,
    subject: subjectLine,
    html,
  })
  if (error) console.error('[email] sendWeeklyDigestEmail error:', error)
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
    replyTo: SUPPORT_EMAIL,
    subject: `${adminFirstName} invited you to join ${companyName} on LessAI`,
    html,
  })
  if (error) console.error('[email] sendInviteEmail error:', error)
  return { data, error }
}
