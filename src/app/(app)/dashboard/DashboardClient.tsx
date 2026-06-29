'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2, Sparkles, RefreshCw, ChevronRight } from 'lucide-react'
import type { UseCase } from '@/lib/claude'

interface Skill {
  id: string
  week_number: number
  title: string
  description: string
  task: string
  tool: string
  status: string
}

interface Props {
  profile: { id: string; full_name: string | null; role: string; company_id: string }
  company: { name: string; tools: string[] } | null
  aiPath: { use_cases: UseCase[]; current_use_case_index: number } | null
  initialSkills: Skill[]
}

export default function DashboardClient({ profile, company, aiPath, initialSkills }: Props) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [generatingSkill, setGeneratingSkill] = useState(initialSkills.length === 0)
  const [skillDone, setSkillDone] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [alternativeTask, setAlternativeTask] = useState('')

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const currentSkill = skills[0] ?? null
  const weekNumber = currentSkill?.week_number ?? 1

  useEffect(() => {
    if (initialSkills.length === 0) {
      generateWeek1Skill()
    }
  }, [])

  async function generateWeek1Skill() {
    setGeneratingSkill(true)
    try {
      const res = await fetch('/api/ai/generate-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: profile.role,
          tools: company?.tools ?? [],
          weekNumber: 1,
          previousSkills: [],
        }),
      })
      const data = await res.json()
      if (res.ok) setSkills([data])
    } finally {
      setGeneratingSkill(false)
    }
  }

  async function markDone() {
    if (!currentSkill) return
    setMarkingDone(true)
    const supabase = createClient()
    await supabase.from('checkins').insert({
      skill_id: currentSkill.id,
      user_id: profile.id,
      completed: true,
    })
    await supabase.from('skills').update({ status: 'completed' }).eq('id', currentSkill.id)
    setSkills((prev) => prev.map((s) => s.id === currentSkill.id ? { ...s, status: 'completed' } : s))
    setSkillDone(true)
    setMarkingDone(false)
  }

  async function submitFeedback() {
    if (!currentSkill || !feedback.trim()) return
    setSubmittingFeedback(true)
    try {
      const res = await fetch('/api/ai/alternative-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: currentSkill.id,
          originalTask: currentSkill.task,
          feedback,
          role: profile.role,
          tool: currentSkill.tool,
        }),
      })
      const data = await res.json()
      setAlternativeTask(data.alternativeTask)
      setShowFeedback(false)
      setSkills((prev) => prev.map((s) => s.id === currentSkill.id ? { ...s, status: 'flagged' } : s))
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const useCases: UseCase[] = aiPath?.use_cases ?? []
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-0.5 text-sm">
          {profile.role && <span>{profile.role} · </span>}
          Week {weekNumber} of your AI journey
        </p>
      </div>

      {/* Current skill card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
          <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">
            Week {weekNumber} · This week&apos;s skill
          </span>
          {currentSkill && (
            <Badge className="bg-indigo-500 text-white border-0 text-xs">
              {currentSkill.tool}
            </Badge>
          )}
        </div>

        <div className="p-6">
          {generatingSkill ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-pulse" />
              <p className="font-medium text-gray-900 mb-1">Generating your first skill…</p>
              <p className="text-sm text-gray-400">Claude is picking the best place to start</p>
            </div>
          ) : !currentSkill ? (
            <div className="text-center py-8 text-gray-400 text-sm">No skill yet</div>
          ) : skillDone || currentSkill.status === 'completed' ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Skill complete!</p>
              <p className="text-sm text-gray-400">Your next skill will appear at the start of next week.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{currentSkill.title}</h2>
              <p className="text-gray-500 text-sm mb-5">{currentSkill.description}</p>

              <div className="bg-indigo-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  Your task today
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentSkill.task}</p>
              </div>

              {alternativeTask && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                    Simpler alternative
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{alternativeTask}</p>
                </div>
              )}

              {showFeedback ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="What didn't work? (e.g. too advanced, not relevant to my work, tool access issue…)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowFeedback(false); setFeedback('') }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      onClick={submitFeedback}
                      disabled={!feedback.trim() || submittingFeedback}
                    >
                      {submittingFeedback ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating alternative…</>
                      ) : (
                        <><RefreshCw className="w-3.5 h-3.5" /> Get alternative</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1"
                    onClick={markDone}
                    disabled={markingDone}
                  >
                    {markingDone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark as done
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowFeedback(true)}
                    disabled={!!alternativeTask}
                  >
                    Didn&apos;t work for me
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* AI Path */}
      {useCases.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your AI path</h2>
          <div className="space-y-3">
            {useCases.map((uc, i) => {
              const isCurrent = i === (aiPath?.current_use_case_index ?? 0)
              const isDone = i < (aiPath?.current_use_case_index ?? 0)
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                    isDone
                      ? 'bg-green-100 text-green-600'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : `0${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-gray-900 text-sm">{uc.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                        {uc.tool}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{uc.description}</p>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
