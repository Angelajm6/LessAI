'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, ArrowLeft, Sparkles, ThumbsDown } from 'lucide-react'

interface Skill {
  id: string
  week_number: number
  title: string
  description: string
  task: string
  tool: string | null
  status: string
}

interface Checkin {
  completed: boolean
  feedback: string | null
  alternative_task: string | null
}

interface Props {
  skill: Skill
  profile: { role: string | null } | null
  existingCheckin: Checkin | null
}

export default function SkillClient({ skill, profile, existingCheckin }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'default' | 'flag'>('default')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [alternativeTask, setAlternativeTask] = useState(existingCheckin?.alternative_task ?? '')
  const [done, setDone] = useState(existingCheckin?.completed ?? false)

  async function markDone() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('checkins').insert({
      skill_id: skill.id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      completed: true,
    })
    await supabase.from('skills').update({ status: 'completed' }).eq('id', skill.id)
    setDone(true)
    setLoading(false)
  }

  async function flagSkill() {
    if (!feedback.trim()) return
    setLoading(true)

    const res = await fetch('/api/ai/alternative-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: skill.id,
        originalTask: skill.task,
        feedback,
        role: profile?.role ?? 'professional',
        tool: skill.tool ?? 'Claude',
      }),
    })

    const data = await res.json()
    setAlternativeTask(data.alternativeTask)
    setMode('default')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </button>

      {/* Skill header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-semibold">
            Week {skill.week_number}
          </Badge>
          {skill.tool && (
            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">{skill.tool}</Badge>
          )}
          {done && (
            <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{skill.title}</h1>
        <p className="text-gray-600 leading-relaxed">{skill.description}</p>
      </div>

      {/* Task */}
      <div className="bg-emerald-50 rounded-xl p-6 mb-6 border border-emerald-200 shadow-sm">
        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
          Your task
        </div>
        <p className="text-gray-800 leading-relaxed">{skill.task}</p>
      </div>

      {/* Alternative task (if flagged) */}
      {alternativeTask && (
        <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              Claude adapted this for you
            </div>
          </div>
          <p className="text-gray-800 leading-relaxed">{alternativeTask}</p>
        </div>
      )}

      {/* Actions */}
      {!done && (
        <>
          {mode === 'default' && (
            <div className="flex gap-3">
              <Button
                onClick={markDone}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1 gap-2 h-11 text-base font-semibold"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Saving…' : 'I did it — mark as done'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode('flag')}
                className="gap-2 border-gray-200 text-gray-600 hover:text-gray-800"
              >
                <ThumbsDown className="w-4 h-4" />
                Didn&apos;t work
              </Button>
            </div>
          )}

          {mode === 'flag' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  What didn&apos;t work for you?
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Claude will read your feedback and generate a simpler, better-fitted alternative task just for you.
                </p>
                <Textarea
                  placeholder="e.g. The tool wasn't available, the prompt gave bad results, I wasn't sure where to start…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={flagSkill}
                  disabled={loading || !feedback.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Generating…' : 'Get alternative'}
                </Button>
                <Button variant="outline" onClick={() => setMode('default')}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Done state */}
      {done && (
        <div className="text-center py-8 bg-green-50 rounded-2xl border border-green-200 px-6">
          <div className="text-4xl mb-3">🎉</div>
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Skill completed!</h3>
          <p className="text-sm text-gray-500 mb-6">
            Amazing work. Every skill you complete compounds — keep the momentum going.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            Back to dashboard <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Pro tip */}
      {!done && (
        <div className="mt-8 flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <span className="text-lg leading-none mt-0.5">💡</span>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-700">Pro tip:</span> Try to complete this within 24 hours for best retention.
          </p>
        </div>
      )}
    </div>
  )
}
