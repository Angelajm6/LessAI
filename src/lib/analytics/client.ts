import * as amplitude from '@amplitude/analytics-browser'
import type { AnalyticsEvent, EventProperties } from './events'

/**
 * Browser-side Amplitude wrapper. Only import this from client components.
 *
 * `initAnalytics` is called once by <Analytics /> in the root layout.
 * Page views, sessions and marketing attribution are autocaptured; form and
 * element autocapture stay off so the event stream only contains events we
 * chose deliberately.
 */

let initialized = false

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return

  const zone = (process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE ?? 'US').toUpperCase()
  amplitude.init(apiKey, {
    serverZone: zone === 'EU' ? 'EU' : 'US',
    autocapture: {
      attribution: true,
      pageViews: true,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
      elementInteractions: false,
    },
  })
  initialized = true
}

/** Attach every subsequent browser event to this Supabase user id. */
export function identifyUser(userId: string) {
  if (!initialized) return
  if (amplitude.getUserId() !== userId) amplitude.setUserId(userId)
}

/** Forget the signed-out user so the next visitor gets a fresh identity. */
export function resetUser() {
  if (!initialized) return
  if (amplitude.getUserId()) amplitude.reset()
}

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  if (!initialized) return
  amplitude.track(event, { ...properties, source: 'browser' })
}
