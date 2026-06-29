'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Send, CheckCircle, Clock, Settings } from 'lucide-react'

const AI_TOOLS = [
  'ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Notion AI',
  'Grammarly', 'Midjourney', 'Perplexity', 'HubSpot AI', 'Salesforce Einstein',
]

interface Props {
  company: { id: string; name: string; tools: string[] } | null
  members: { id: string; full_name: string | null; email: string; role: string | null; onboarded: boolean }[]
  invites: { id: string; email: string; used: boolean; created_at: string }[]
  adminName: string
}

export default function AdminClient({ company, members, invites, adminName }: Props) {
  const [tools, setTools] = useState<string[]>(company?.tools ?? [])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [savingTools, setSavingTools] = useState(false)
  const [toolsSaved, setToolsSaved] = useState(false)

  function toggleTool(tool: string) {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
    setToolsSaved(false)
  }

  async function saveTools() {
    if (!company) return
    setSavingTools(true)
    const supabase = createClient()
    await supabase.from('companies').update({ tools }).eq('id', company.id)
    setSavingTools(false)
    setToolsSaved(true)
  }

  async function sendInvite() {
    if (!inviteEmail || !company) return
    setInviting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('invites')
      .insert({ company_id: company.id, email: inviteEmail })
      .select('token')
      .single()

    if (data?.token) {
      const link = `${window.location.origin}/invite?token=${data.token}`
      setInviteLink(link)
    }
    setInviteEmail('')
    setInviting(false)
  }

  const onboardedCount = members.filter((m) => m.onboarded).length
  const adoptionRate = members.length > 0 ? Math.round((onboardedCount / members.length) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {adminName.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your team&apos;s AI adoption at <strong>{company?.name}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">{members.length}</div>
            <div className="text-sm text-gray-500 mt-1">Team members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">{onboardedCount}</div>
            <div className="text-sm text-gray-500 mt-1">Onboarded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">{adoptionRate}%</div>
            <div className="text-sm text-gray-500 mt-1">Adoption rate</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4 text-indigo-600" />
            Your company&apos;s AI tools
          </CardTitle>
          <p className="text-sm text-gray-500">
            Select the tools your team has access to. This personalizes everyone&apos;s AI path.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.map((tool) => (
              <button
                key={tool}
                onClick={() => toggleTool(tool)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tools.includes(tool)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
          <Button
            onClick={saveTools}
            disabled={savingTools || tools.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            {toolsSaved ? '✓ Saved' : savingTools ? 'Saving…' : 'Save tools'}
          </Button>
        </CardContent>
      </Card>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-indigo-600" />
            Invite team members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
            />
            <Button
              onClick={sendInvite}
              disabled={inviting || !inviteEmail}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              {inviting ? 'Generating…' : 'Generate invite'}
            </Button>
          </div>

          {inviteLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium mb-1">Invite link ready — copy and send it:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded flex-1 truncate">
                  {inviteLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="shrink-0 text-xs h-7"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sent invites</p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-700">{inv.email}</span>
                  {inv.used ? (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Joined</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-indigo-600" />
            Team members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No team members yet — send your first invite above.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.full_name ?? m.email}</div>
                    <div className="text-xs text-gray-400">{m.role ?? 'Role not set'}</div>
                  </div>
                  {m.onboarded ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Onboarded
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
