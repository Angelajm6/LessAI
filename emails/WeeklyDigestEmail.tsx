import {
  Html, Head, Preview, Body, Container, Section,
  Heading, Text, Button, Hr, Row, Column, Img
} from '@react-email/components'

interface TaskSuggestion {
  tool: string
  title: string
  duration: string
}

interface Props {
  firstName: string
  role: string
  xp: number
  xpThisWeek: number
  streak: number
  tasksCompletedThisWeek: number
  topTool: string
  levelName: string
  nextLevelName: string
  xpToNextLevel: number
  nextTask: TaskSuggestion
  dashboardUrl: string
}

export default function WeeklyDigestEmail({
  firstName,
  role,
  xp,
  xpThisWeek,
  streak,
  tasksCompletedThisWeek,
  topTool,
  levelName,
  nextLevelName,
  xpToNextLevel,
  nextTask,
  dashboardUrl,
}: Props) {
  const hasActivity = tasksCompletedThisWeek > 0

  return (
    <Html>
      <Head />
      <Preview>
        {hasActivity
          ? `${firstName}, you earned ${xpThisWeek} XP this week — keep the streak going 🔥`
          : `${firstName}, your AI practice is waiting — pick up where you left off`}
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img src="https://lessai.io/logo.svg" width="28" height="28" alt="LessAI" style={logoImg} />
            <Text style={logoText}>LessAI</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Text style={eyebrow}>YOUR WEEKLY DIGEST</Text>
            <Heading style={h1}>
              {hasActivity
                ? `Nice work this week, ${firstName} 🔥`
                : `Time to get back on track, ${firstName}`}
            </Heading>
            <Text style={subtitle}>
              {hasActivity
                ? `Here's what you accomplished as a ${role} — and what's next.`
                : `You haven't completed any tasks this week yet. Here's what we suggest to keep your streak alive.`}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Stats row */}
          <Section style={statsSection}>
            <Row>
              <Column style={statCol}>
                <Text style={statNumber}>{xpThisWeek}</Text>
                <Text style={statLabel}>XP this week</Text>
              </Column>
              <Column style={statDivider} />
              <Column style={statCol}>
                <Text style={statNumber}>{streak}</Text>
                <Text style={statLabel}>day streak</Text>
              </Column>
              <Column style={statDivider} />
              <Column style={statCol}>
                <Text style={statNumber}>{tasksCompletedThisWeek}</Text>
                <Text style={statLabel}>tasks done</Text>
              </Column>
              <Column style={statDivider} />
              <Column style={statCol}>
                <Text style={statNumber}>{xp}</Text>
                <Text style={statLabel}>total XP</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Level progress */}
          <Section style={section}>
            <Heading style={h2}>Your level</Heading>
            <div style={levelRow}>
              <span style={levelBadge}>{levelName}</span>
              <Text style={levelMeta}>{xpToNextLevel} XP to {nextLevelName}</Text>
            </div>
            {topTool && hasActivity && (
              <Text style={topToolText}>
                Most active with <strong>{topTool}</strong> this week.
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          {/* Next suggested task */}
          <Section style={section}>
            <Heading style={h2}>Suggested task for this week</Heading>
            <div style={taskCard}>
              <div style={taskMeta}>
                <span style={taskTool}>{nextTask.tool}</span>
                <span style={taskDuration}>{nextTask.duration}</span>
              </div>
              <Text style={taskTitle}>{nextTask.title}</Text>
            </div>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={ctaButton}>
              Open my dashboard →
            </Button>
            <Text style={ctaNote}>Takes 10 minutes. Build the habit.</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <div style={footerLogo}>
              <Img src="https://lessai.io/logo.svg" width="20" height="20" alt="LessAI" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
              <span style={footerBrand}>LessAI</span>
            </div>
            <Text style={footerText}>
              You're receiving this weekly digest because you have an active LessAI account.
            </Text>
            <Text style={footerText}>
              <a href="https://lessai.io/settings" style={footerLink}>Manage email preferences</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

WeeklyDigestEmail.PreviewProps = {
  firstName: 'Angela',
  role: 'Marketing Manager',
  xp: 340,
  xpThisWeek: 90,
  streak: 5,
  tasksCompletedThisWeek: 3,
  topTool: 'Claude',
  levelName: 'Practitioner',
  nextLevelName: 'Pro',
  xpToNextLevel: 160,
  nextTask: {
    tool: 'Claude',
    title: 'Write a campaign brief using the AIDA framework — get Claude to structure it for you',
    duration: '10 min',
  },
  dashboardUrl: 'http://localhost:3000/dashboard',
} satisfies Props

// ── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '32px auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
}

const header: React.CSSProperties = {
  backgroundColor: '#059669',
  padding: '20px 32px',
  display: 'flex',
  alignItems: 'center',
}

const logoImg: React.CSSProperties = {
  marginRight: '8px',
  display: 'inline-block',
  verticalAlign: 'middle',
}

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '16px',
  margin: 0,
  display: 'inline',
}

const hero: React.CSSProperties = {
  padding: '32px 32px 24px',
}

const eyebrow: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#059669',
  letterSpacing: '0.1em',
  margin: '0 0 10px',
}

const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 10px',
  lineHeight: '1.3',
}

const subtitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#4b5563',
  margin: 0,
  lineHeight: '1.6',
}

const divider: React.CSSProperties = {
  borderColor: '#f3f4f6',
  margin: 0,
}

const statsSection: React.CSSProperties = {
  padding: '24px 32px',
}

const statCol: React.CSSProperties = {
  textAlign: 'center',
  width: '22%',
}

const statDivider: React.CSSProperties = {
  width: '1px',
  backgroundColor: '#f3f4f6',
}

const statNumber: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#059669',
  margin: '0 0 2px',
  lineHeight: 1,
}

const statLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  margin: 0,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const section: React.CSSProperties = {
  padding: '24px 32px',
}

const h2: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 14px',
}

const levelRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '8px',
}

const levelBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#ecfdf5',
  color: '#059669',
  border: '1px solid #a7f3d0',
  borderRadius: '100px',
  padding: '4px 12px',
  fontSize: '13px',
  fontWeight: 700,
}

const levelMeta: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: 0,
}

const topToolText: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '6px 0 0',
}

const taskCard: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '12px',
  padding: '16px 20px',
}

const taskMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
}

const taskTool: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#059669',
  color: '#ffffff',
  borderRadius: '100px',
  padding: '2px 10px',
  fontSize: '11px',
  fontWeight: 700,
  marginRight: '8px',
}

const taskDuration: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
}

const taskTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#065f46',
  margin: 0,
  lineHeight: '1.5',
}

const ctaSection: React.CSSProperties = {
  padding: '8px 32px 32px',
  textAlign: 'center',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#059669',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '15px',
  padding: '14px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
  display: 'inline-block',
}

const ctaNote: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '12px 0 0',
}

const footer: React.CSSProperties = {
  padding: '20px 32px',
  backgroundColor: '#f9fafb',
}

const footerLogo: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
}

const footerBrand: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#6b7280',
  verticalAlign: 'middle',
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 0 4px',
  textAlign: 'center',
}

const footerLink: React.CSSProperties = {
  color: '#059669',
  textDecoration: 'none',
}
