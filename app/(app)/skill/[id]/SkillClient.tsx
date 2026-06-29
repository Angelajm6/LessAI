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
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </button>

      {/* Skill header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">
            Week {skill.week_number}
          </Badge>
          {skill.tool && (
            <Badge variant="outline" className="text-xs">{skill.tool}</Badge>
          )}
          {done && (
            <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{skill.title}</h1>
        <p className="text-gray-600">{skill.description}</p>
      </div>

      {/* Task */}
      <div className="bg-indigo-50 rounded-xl p-6 mb-6 border border-indigo-100">
        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-3">
          Your task
        </div>
        <p className="text-gray-700">{skill.task}</p>
      </div>

      {/* Alternative task (if flagged) */}
      {alternativeTask && (
        <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Alternative task (Claude adapted this for you)
            </div>
          </div>
          <p className="text-gray-700">{alternativeTask}</p>
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
                className="bg-indigo-600 hover:bg-indigo-700 flex-1 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Saving…' : 'I did it — mark as done'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode('flag')}
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Didn&apos;t work
              </Button>
            </div>
          )}

          {mode === 'flag' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  What didn&apos;t work? Claude will generate a simpler alternative.
                </p>
                <Textarea
                  placeholder="e.g. The tool wasn't available, the prompt gave bad results, I wasn't sure where to start…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={flagSkill}
                  disabled={loading || !feedback.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2"
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

      {done && (
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Skill completed!</h3>
          <p className="text-sm text-gray-500 mb-4">
            Great work. Head back to your dashboard to see what&apos;s next.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Back to dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
