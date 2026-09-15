import { createAdminClient } from '@/lib/supabase/admin'
import type { AnalyticsEvent, EventProperties } from './events'

/**
 * Server-side event tracking.
 *
 * Every call does two things in parallel:
 *   1. Sends the event to Amplitude over the HTTP V2 API. We call the API
 *      directly instead of using the Node SDK because Vercel functions can be
 *      frozen before a batched SDK flushes, and this file also runs on the
 *      Edge runtime (generate-path).
 *   2. Stores a copy in the `user_events` table so the platform-admin view and
 *      the daily attention digest can read a user's journey without leaving
 *      Supabase.
 *
 * It never throws. Analytics must not break signup, checkout, or a webhook.
 * Always `await` it so the function stays alive until the request is sent.
 */

const AMPLITUDE_ENDPOINTS = {
  US: 'https://api2.amplitude.com/2/httpapi',
  EU: 'https://api.eu.amplitude.com/2/httpapi',
} as const

type ServerZone = keyof typeof AMPLITUDE_ENDPOINTS

function amplitudeEndpoint() {
  const zone = (process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE ?? 'US').toUpperCase() as ServerZone
  return AMPLITUDE_ENDPOINTS[zone] ?? AMPLITUDE_ENDPOINTS.US
}

function compact(props: EventProperties | undefined) {
  if (!props) return {}
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined))
}

export interface TrackEventInput {
  userId: string
  event: AnalyticsEvent
  properties?: EventProperties
  /** Attributes stored on the Amplitude user profile (plan, role, ...). */
  userProperties?: EventProperties
  /** Set false when the profile row is about to disappear (account deletion). */
  store?: boolean
}

async function sendToAmplitude(input: TrackEventInput, time: number, insertId: string) {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return

  const response = await fetch(amplitudeEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      events: [{
        user_id: input.userId,
        event_type: input.event,
        time,
        insert_id: insertId,
        platform: 'Web',
        event_properties: { ...compact(input.properties), source: 'server' },
        ...(input.userProperties ? { user_properties: compact(input.userProperties) } : {}),
      }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Amplitude responded ${response.status}: ${detail}`)
  }
}

async function storeEvent(input: TrackEventInput, time: number, insertId: string) {
  const { error } = await createAdminClient().from('user_events').insert({
    id: insertId,
    user_id: input.userId,
    event: input.event,
    properties: compact(input.properties),
    created_at: new Date(time).toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  const time = Date.now()
  const insertId = crypto.randomUUID()

  const results = await Promise.allSettled([
    sendToAmplitude(input, time, insertId),
    input.store === false ? Promise.resolve() : storeEvent(input, time, insertId),
  ])

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const target = index === 0 ? 'amplitude' : 'user_events'
      console.error(`[analytics] ${input.event} → ${target} failed:`, result.reason instanceof Error ? result.reason.message : result.reason)
    }
  })
}
