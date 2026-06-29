'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, ArrowRight, CheckCircle, Clock, ChevronRight } from 'lucide-react'

interface UseCase {
  title: string
  description: string
  first_task: string
  tool: string
  why: string
}

interface Skill {
  id: string
  week_number: number
  title: string
  description: string
  task: string
  tool: string | null
  status: string
  checkins: { completed: boolean }[]
}

interface Props {
  profile: {
    id: string
    full_name: string | null
    role: string | null
    companies: { name: string; tools: string[] } | null
  }
  aiPath: { use_cases: UseCase[]; current_use_case_index: number } | null
  skills: Skill[]
}

export default function DashboardClient({ profile, aiPath, skills }: Props) {
  const router = useRouter()
  const [generatingSkill, setGeneratingSkill] = useState(false)

  const useCases: UseCase[] = aiPath?.use_cases ?? []
  const completedUseCases = useCases.filter((_, i) =>
    skills.some((s) => s.status === 'completed' && s.week_number <= i + 1)
  )

  const latestSkill = skills[skills.length - 1]
  const weekNumber = skills.length + 1

  async function generateNextSkill() {
    setGeneratingSkill(true)
    const previousSkills = skills.map((s) => s.title)

    await fetch('/api/ai/generate-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: profile.role,
        tools: profile.companies?.tools ?? [],
        weekNumber,
        previousSkills,
      }),
    })

    router.refresh()
    setGeneratingSkill(false)
  }

  const completedSkills = skills.filter((s) => s.status === 'completed').length
  const progressPct = skills.length > 0 ? Math.round((completedSkills / skills.length) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hey {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {profile.role} at {profile.companies?.name} · Week {skills.length}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Your AI journey</span>
            <span className="text-sm text-gray-500">{completedSkills} of {skills.length} skills done</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Current skill */}
      {latestSkill && latestSkill.status === 'pending' && (
        <Card className="border-0 bg-emerald-50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-semibold">
                Week {latestSkill.week_number} · This week&apos;s skill
              </Badge>
              {latestSkill.tool && (
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">{latestSkill.tool}</Badge>
              )}
            </div>
            <CardTitle className="text-lg mt-2">{latestSkill.title}</CardTitle>
            <p className="text-sm text-gray-600">{latestSkill.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                Your task this week
              </div>
              <p className="text-sm text-gray-700">{latestSkill.task}</p>
            </div>
            <Link href={`/skill/${latestSkill.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full gap-2">
                Start this skill <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Generate next skill */}
      {(!latestSkill || latestSkill.status === 'completed') && (
        <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Ready for week {weekNumber}?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your next AI skill — tailored to your role and everything you&apos;ve already learned.
            </p>
            <Button
              onClick={generateNextSkill}
              disabled={generatingSkill}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {generatingSkill ? (
                'Generating your skill…'
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate week {weekNumber} skill</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Path — use cases */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your AI path</h2>
        <div className="space-y-3">
          {useCases.map((uc, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-emerald-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">Use case {i + 1}</span>
                    {uc.tool && (
                      <Badge variant="outline" className="text-xs">{uc.tool}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{uc.title}</h3>
                  <p className="text-xs text-gray-500">{uc.why}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
              </div>
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-400 mb-1">First task to try</div>
                <p className="text-xs text-gray-600">{uc.first_task}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills history */}
      {skills.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills history</h2>
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{skill.title}</span>
                  <span className="text-xs text-gray-400 ml-2">Week {skill.week_number}</span>
                </div>
                {skill.status === 'completed' ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Done
                  </div>
                ) : skill.status === 'flagged' ? (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">Flagged</Badge>
                ) : (
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    In progress
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
