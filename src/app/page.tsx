import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, Zap, Users, BarChart3 } from 'lucide-react'

const stats = [
  { value: '45%', label: 'of employees use AI weekly' },
  { value: '44%', label: 'receive zero training' },
  { value: '44hrs', label: 'lost per employee yearly to tool fatigue' },
]

const features = [
  {
    icon: Zap,
    title: 'Role-specific AI paths',
    description:
      'Every employee gets 3 use cases tailored to their exact job — not generic tips, but actions they can take this afternoon.',
  },
  {
    icon: Users,
    title: 'Weekly micro-skills',
    description:
      'One new AI skill per week, with a real work task attached. 5 minutes to learn, immediate impact on the job.',
  },
  {
    icon: BarChart3,
    title: 'Adoption dashboard',
    description:
      'See who on your team is actually using AI and who needs a nudge — by person, by tool, by week.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Fluent</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Get started free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
          AI adoption, finally solved
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Your team bought the AI tools.
          <br />
          <span className="text-indigo-600">Nobody knows how to use them.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Fluent gives every employee a personalized AI path — specific to their role,
          their tools, and their actual work. Not a course. A coach.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              Start onboarding your team <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.value}>
                <div className="text-4xl font-bold text-indigo-600 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          How Fluent works
        </h2>
        <p className="text-center text-gray-500 mb-14">
          Set up in 5 minutes. Results from day one.
        </p>
        <div className="grid gap-6">
          {[
            {
              step: '01',
              title: 'Admin sets up the team',
              desc: "Add your company's AI tools (ChatGPT, Claude, Notion AI, etc.) and invite your team. Takes 3 minutes.",
            },
            {
              step: '02',
              title: 'Each employee gets their own path',
              desc: 'Employees pick their role and instantly receive 3 AI use cases built for their specific job — with a concrete first task to try today.',
            },
            {
              step: '03',
              title: 'Weekly skills keep momentum going',
              desc: 'Every week, one new AI skill lands in their dashboard with a real work task attached. 5 minutes to learn, immediate impact.',
            },
            {
              step: '04',
              title: "Didn't work? Claude adapts",
              desc: "If a task doesn't land, employees flag it and Claude generates a simpler alternative in seconds. No one gets left behind.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 p-6 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
              <div className="text-3xl font-bold text-indigo-200 shrink-0 w-12">{item.step}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employee preview */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          What your employees actually see
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Not a training portal. Not a course library. A clear next step, every week.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              S
            </div>
            <div>
              <div className="font-medium text-gray-900">Sarah — Marketing Manager</div>
              <div className="text-xs text-gray-400">Week 3 · 2 of 3 use cases completed</div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-5 mb-4">
            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">This week&apos;s skill</div>
            <div className="font-semibold text-gray-900 mb-1">Write better briefs with Claude</div>
            <p className="text-sm text-gray-600 mb-4">
              Use Claude to turn a rough 3-bullet campaign idea into a full creative brief — including tone, audience, key messages, and success metrics.
            </p>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="text-xs font-medium text-gray-500 mb-1">Your task today</div>
              <p className="text-sm text-gray-700">
                Pick your next campaign. Write 3 bullet points about it. Paste them into Claude and ask: <em>&ldquo;Turn this into a full creative brief for a B2B SaaS product.&rdquo;</em> Compare the output to your last brief.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as done
            </Button>
            <Button variant="outline" className="flex-1">Didn&apos;t work for me</Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to make your team AI-fluent?
          </h2>
          <p className="text-indigo-200 mb-8">
            Free to start. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 gap-2">
              Get started free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Fluent</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Fluent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
