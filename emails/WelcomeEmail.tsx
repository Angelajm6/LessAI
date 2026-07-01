import {
  Html, Head, Preview, Body, Container, Section,
  Heading, Text, Button, Hr, Row, Column, Img
} from '@react-email/components'

interface Props {
  firstName: string
  role: string
  tools: string[]
  stackSummary: string
  dashboardUrl: string
}

export default function WelcomeEmail({ firstName, role, tools, stackSummary, dashboardUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your AI Stack Map is ready, {firstName} — here's what we built for you.</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <div style={logoWrap}>
              <span style={logoLetter}>L</span>
            </div>
            <Text style={logoText}>LessAI</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Heading style={h1}>Your AI Stack Map is ready ⚡</Heading>
            <Text style={subtitle}>
              Hey {firstName} — we built a personalized learning plan for you as a <strong>{role}</strong>. Here's your stack:
            </Text>

            {/* Tool pills */}
            <Section style={toolsRow}>
              {tools.slice(0, 6).map(tool => (
                <span key={tool} style={toolPill}>{tool}</span>
              ))}
              {tools.length > 6 && <span style={toolPill}>+{tools.length - 6} more</span>}
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Summary */}
          <Section style={section}>
            <Heading style={h2}>What LessAI built for you</Heading>
            <Text style={summaryBox}>{stackSummary}</Text>
          </Section>

          <Hr style={divider} />

          {/* What's inside */}
          <Section style={section}>
            <Heading style={h2}>Inside your dashboard</Heading>
            <Row>
              <Column style={featureCol}>
                <Text style={featureEmoji}>📅</Text>
                <Text style={featureTitle}>Daily Tasks</Text>
                <Text style={featureDesc}>10-min tasks per tool, tailored to your role. Complete them to build real habits.</Text>
              </Column>
              <Column style={featureCol}>
                <Text style={featureEmoji}>📖</Text>
                <Text style={featureTitle}>Tool Guides</Text>
                <Text style={featureDesc}>Comparison cards for every tool in your stack — best for, not great for, killer use cases.</Text>
              </Column>
              <Column style={featureCol}>
                <Text style={featureEmoji}>💬</Text>
                <Text style={featureTitle}>Ask AI</Text>
                <Text style={featureDesc}>A coach that knows your stack and your role. Ask anything about your tools.</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={ctaButton}>
              Open my Stack Map →
            </Button>
            <Text style={ctaNote}>Takes 10 minutes to complete your first task.</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you just completed onboarding on LessAI.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Angela',
  role: 'Marketing Manager',
  tools: ['Claude', 'Notion AI', 'Grammarly', 'ChatGPT'],
  stackSummary: 'As a Marketing Manager, your strongest combo is Claude for drafting and strategy, paired with Notion AI for organizing campaigns. Grammarly keeps your copy polished. Start with Claude — it has the highest ceiling for your role.',
  dashboardUrl: 'http://localhost:3000/dashboard',
}

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

const logoWrap: React.CSSProperties = {
  width: '28px',
  height: '28px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: '6px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '8px',
}

const logoLetter: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '14px',
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

const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 12px',
  lineHeight: '1.3',
}

const subtitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#4b5563',
  margin: '0 0 20px',
  lineHeight: '1.6',
}

const toolsRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
}

const toolPill: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#ecfdf5',
  color: '#059669',
  border: '1px solid #a7f3d0',
  borderRadius: '100px',
  padding: '3px 10px',
  fontSize: '12px',
  fontWeight: 600,
  marginRight: '6px',
  marginBottom: '6px',
}

const divider: React.CSSProperties = {
  borderColor: '#f3f4f6',
  margin: '0',
}

const section: React.CSSProperties = {
  padding: '24px 32px',
}

const h2: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 12px',
}

const summaryBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  padding: '14px 16px',
  fontSize: '14px',
  color: '#065f46',
  lineHeight: '1.6',
  margin: 0,
}

const featureCol: React.CSSProperties = {
  width: '33.33%',
  paddingRight: '12px',
  verticalAlign: 'top',
}

const featureEmoji: React.CSSProperties = {
  fontSize: '24px',
  margin: '0 0 6px',
}

const featureTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 4px',
}

const featureDesc: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: 0,
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
