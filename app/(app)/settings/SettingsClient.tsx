'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Briefcase, Wrench, CheckCircle, ChevronLeft, Plus, X, RefreshCw, Sparkles, AlertTriangle, Building2, Lock, Trash2 } from 'lucide-react'

const PRESET_TOOLS = [
  'ChatGPT', 'Claude', 'Gemini', 'Microsoft Copilot', 'Perplexity',
  'Notion AI', 'GitHub Copilot', 'Grammarly', 'Canva AI', 'Google Workspace AI',
  'Midjourney', 'DALL-E', 'Grok', 'Meta AI', 'Cursor',
  'Runway', 'HeyGen', 'ElevenLabs', 'Jasper', 'Copy.ai',
  'Otter.ai', 'Fireflies.ai', 'HubSpot AI', 'Salesforce Einstein', 'Zapier AI',
]

const LEVELS = [
  { value: 'never', label: 'Never used', color: 'border-gray-200 bg-gray-50 text-gray-500', activeColor: 'border-gray-400 bg-gray-100 text-gray-800 ring-2 ring-gray-300' },
  { value: 'learning', label: 'Learning', color: 'border-amber-200 bg-amber-50 text-amber-700', activeColor: 'border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300' },
  { value: 'comfortable', label: 'Comfortable', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', activeColor: 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400' },
]

const PRESET_ROLES = [
  'Sales Representative', 'Account Executive', 'Customer Success Manager',
  'Marketing Manager', 'Operations Manager', 'Executive / Leadership',
  'Content Creator', 'Copywriter', 'Social Media Manager', 'Graphic Designer', 'Video Producer',
  'Software Engineer', 'Product Manager', 'Data Analyst', 'UX / Product Designer',
  'HR Manager', 'Recruiter', 'Executive Assistant', 'Project Manager',
  'Healthcare Administrator', 'Nurse / Clinical Staff', 'Therapist / Counselor', 'Wellness Coach',
  'Teacher / Educator', 'Instructional Designer', 'School Administrator',
  'Financial Analyst', 'Accountant', 'Legal Counsel / Paralegal', 'Compliance Officer',
  'Real Estate Agent', 'Property Manager', 'Architect', 'Interior Designer', 'Construction Manager',
  'Nonprofit Program Manager', 'Grant Writer', 'Policy Analyst',
  'Founder / Entrepreneur', 'Freelancer / Consultant', 'Other',
]

interface Props {
  profile: {
    id: string
    full_name: string | null
    role: string | null
    tools: string[] | null
    tool_levels: Record<string, string> | null
    company_id?: string | null
  } | null
  companyName: string | null
  userEmail: string
}

export default function SettingsClient({ profile, companyName, userEmail }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSavedState] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerated, setRegenerated] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [role, setRole] = useState(() => {
    const r = profile?.role ?? ''
    return PRESET_ROLES.includes(r) ? r : r ? 'Other' : ''
  })
  const [customRole, setCustomRole] = useState(() => {
    const r = profile?.role ?? ''
    return PRESET_ROLES.includes(r) ? '' : r
  })
  const [selectedTools, setSelectedTools] = useState<string[]>(profile?.tools ?? [])
  const [toolLevels, setToolLevels] = useState<Record<string, string>>(profile?.tool_levels ?? {})
  const [customTool, setCustomTool] = useState('')
  const [company, setCompany] = useState(companyName ?? '')
  const [companySaving, setCompanySaving] = useState(false)
  const [companySaved, setCompanySaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const finalRole = role === 'Other' ? customRole.trim() : role
  const originalRole = profile?.role ?? ''
  const originalTools = JSON.stringify([...(profile?.tools ?? [])].sort())

  const roleChanged = finalRole !== originalRole
  const toolsChanged = JSON.stringify([...selectedTools].sort()) !== originalTools
  const significantChange = roleChanged || toolsChanged

  function toggleTool(tool: string) {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
    if (!toolLevels[tool]) setToolLevels(prev => ({ ...prev, [tool]: 'never' }))
  }

  function addCustomTool() {
    const t = customTool.trim()
    if (!t || selectedTools.includes(t)) return
    setSelectedTools(prev => [...prev, t])
    if (!toolLevels[t]) setToolLevels(prev => ({ ...prev, [t]: 'never' }))
    setCustomTool('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        role: finalRole,
        tools: selectedTools,
        tool_levels: toolLevels,
      })
      .eq('id', profile!.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSavedState(true)
    setTimeout(() => setSavedState(false), 2500)
    router.refresh()
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setError('')

    // Save profile first
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: fullName.trim(),
      role: finalRole,
      tools: selectedTools,
      tool_levels: toolLevels,
    }).eq('id', profile!.id)

    // Regenerate AI path + playbook
    const res = await fetch('/api/ai/generate-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: finalRole,
        tools: selectedTools,
        toolLevels,
        company: company || null,
      }),
    })

    setRegenerating(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Regeneration failed — try again')
      return
    }

    setRegenerated(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  async function handleSaveCompany() {
    setCompanySaving(true)
    const supabase = createClient()
    if (profile?.company_id) {
      await supabase.from('companies').update({ name: company.trim() }).eq('id', profile.company_id)
    }
    setCompanySaving(false)
    setCompanySaved(true)
    setTimeout(() => setCompanySaved(false), 2500)
    router.refresh()
  }

  async function handleChangePassword() {
    setPasswordSaving(true)
    setPasswordError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) { setPasswordError(error.message); return }
    setPasswordSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 2500)
  }

  async function confirmDeleteAccount() {
    setDeleting(true)
    await fetch('/api/account/delete', { method: 'POST' })
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update your profile, role, and AI tools</p>
        </div>
      </div>

      {/* Regenerate banner */}
      {significantChange && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Your AI path may be outdated</p>
            <p className="text-xs text-amber-600 mt-0.5">You changed your {roleChanged && toolsChanged ? 'role and tools' : roleChanged ? 'role' : 'tools'}. Regenerating rebuilds your daily tasks, playbook, and prompt library to match.</p>
          </div>
        </div>
      )}

      {/* Name */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-gray-900">Your name</h2>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your name"
            className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
          />
        </div>
      </section>

      {/* Role */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-gray-900">Your role</h2>
          {roleChanged && <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Changed</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                role === r
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {role === 'Other' && (
          <Input
            className="mt-3 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            placeholder="Enter your role"
            value={customRole}
            onChange={e => setCustomRole(e.target.value)}
          />
        )}
      </section>

      {/* Tools */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-gray-900">Your AI tools</h2>
          {toolsChanged && <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Changed</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_TOOLS.map(tool => (
            <button
              key={tool}
              onClick={() => toggleTool(tool)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedTools.includes(tool)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Add another tool…"
            value={customTool}
            onChange={e => setCustomTool(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomTool()}
            className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
          />
          <Button variant="outline" onClick={addCustomTool} className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {selectedTools.filter(t => !PRESET_TOOLS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTools.filter(t => !PRESET_TOOLS.includes(t)).map(tool => (
              <span key={tool} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300">
                {tool}
                <button onClick={() => setSelectedTools(prev => prev.filter(t => t !== tool))}>
                  <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Skill levels */}
      {selectedTools.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Skill levels</h2>
          <p className="text-sm text-gray-500 mb-4">How comfortable are you with each tool?</p>
          <div className="space-y-4">
            {selectedTools.map(tool => (
              <div key={tool}>
                <p className="text-sm font-medium text-gray-700 mb-2">{tool}</p>
                <div className="flex gap-2">
                  {LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setToolLevels(prev => ({ ...prev, [tool]: level.value }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                        toolLevels[tool] === level.value ? level.activeColor : level.color
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company */}
      {profile?.company_id && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-gray-900">Company name</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Your company name"
              className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
            <Button onClick={handleSaveCompany} disabled={companySaving || company.trim() === (companyName ?? '')}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
              {companySaved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : companySaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </section>
      )}

      {/* Password */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-gray-900">Change password</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Signed in as <span className="font-medium text-gray-700">{userEmail}</span></p>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={8}
            className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
          />
          {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          <Button onClick={handleChangePassword} disabled={passwordSaving || newPassword.length < 8}
            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            {passwordSaved ? <><CheckCircle className="w-4 h-4" /> Password updated!</> : passwordSaving ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </section>

      {/* Delete account */}
      <section className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900">Delete account</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">This permanently deletes your account, profile, and all progress. This cannot be undone.</p>
        <div className="space-y-3">
          <Input
            placeholder='Type DELETE to confirm'
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            className="border-gray-200 focus:border-red-400 focus:ring-red-400"
          />
          <Button onClick={() => setShowDeleteModal(true)} disabled={deleteConfirm !== 'DELETE'}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5">
            Delete my account
          </Button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {significantChange && (
          <Button
            onClick={handleRegenerate}
            disabled={regenerating || regenerated}
            className="w-full h-11 bg-gray-950 hover:bg-gray-800 text-base font-semibold gap-2"
          >
            {regenerated ? (
              <><CheckCircle className="w-4 h-4 text-emerald-400" /> Done — redirecting to dashboard…</>
            ) : regenerating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Regenerating your AI path… (2–4 min)</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Save &amp; regenerate AI path</>
            )}
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || regenerating}
          variant={significantChange ? 'outline' : 'default'}
          className={`w-full h-11 text-base font-semibold gap-2 ${!significantChange ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200' : ''}`}
        >
          {saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : saving ? 'Saving…' : significantChange ? 'Save without regenerating' : 'Save changes'}
        </Button>
      </div>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Are you absolutely sure?</h2>
              <p className="text-sm text-gray-500">
                This will permanently delete your account, all your progress, saved prompts, and AI-generated plans. <strong className="text-gray-700">This cannot be undone.</strong>
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
