'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Bot, LoaderCircle, MessageCircle, Send, X } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  'How do Daily Tasks work?',
  'Where can I manage my subscription?',
  'How do I update my AI tools?',
]

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, messages, isSending])

  async function sendMessage(question = input) {
    const text = question.trim()
    if (!text || isSending) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const body = await response.json().catch(() => ({}))
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: response.ok
            ? body.reply
            : body.error ?? 'I’m having trouble responding right now. Please email hello@lessai.io and our team will help.',
        },
      ])
    } catch {
      setMessages(current => [
        ...current,
        { role: 'assistant', content: 'I’m having trouble connecting. Please email hello@lessai.io and our team will help.' },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 flex h-[min(560px,calc(100vh-7.5rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gray-950 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500"><Bot className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold">LessAI Support</p>
                <p className="text-xs text-gray-300">Ask about using LessAI</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close support chat" className="rounded-md p-1 text-gray-300 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-gray-100 p-3 text-sm leading-relaxed text-gray-700">
                  Hi! I can help with LessAI features, onboarding, account settings, and billing. What do you need?
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_QUESTIONS.map(question => (
                    <button key={question} type="button" onClick={() => void sendMessage(question)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-100">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md bg-gray-100 text-gray-700'}`}>
                    {message.content}
                  </p>
                </div>
              ))
            )}
            {isSending && <div className="flex justify-start"><span className="rounded-2xl rounded-bl-md bg-gray-100 px-3 py-2.5 text-gray-500"><LoaderCircle className="size-4 animate-spin" /></span></div>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} rows={1} maxLength={800} placeholder="Ask a support question…" className="max-h-24 min-h-5 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-gray-400" aria-label="Support question" />
              <button type="submit" disabled={!input.trim() || isSending} aria-label="Send support question" className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400">Need a person? <a href="mailto:hello@lessai.io" className="text-emerald-700 hover:underline">Email support</a>.</p>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen(open => !open)} aria-label={isOpen ? 'Close support chat' : 'Open support chat'} className="ml-auto flex items-center gap-2 rounded-full bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span>Support</span>
      </button>
    </div>
  )
}
