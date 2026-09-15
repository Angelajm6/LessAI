/**
 * Every product event LessAI tracks, in one place.
 *
 * Names are snake_case and past tense. Add new events here first so the
 * server helper, the browser helper, and Amplitude all agree on the name.
 *
 * Funnel order for a new signup:
 *   signed_up → onboarding_step_viewed (1..4) → onboarding_completed →
 *   task_completed (first) → checkout_started → trial_started →
 *   payment_succeeded
 */
export const EVENTS = {
  // Acquisition & auth
  SIGNUP_SUBMITTED: 'signup_submitted',
  SIGNUP_CONFIRMATION_SENT: 'signup_confirmation_sent',
  SIGNED_UP: 'signed_up',
  LOGGED_IN: 'logged_in',

  // Activation
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  TASK_COMPLETED: 'task_completed',

  // Monetisation
  CHECKOUT_STARTED: 'checkout_started',
  TRIAL_STARTED: 'trial_started',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_STATUS_CHANGED: 'subscription_status_changed',

  // Teams
  INVITE_SENT: 'invite_sent',

  // Lifecycle
  ACCOUNT_DELETED: 'account_deleted',
} as const

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS]

export type EventProperties = Record<string, string | number | boolean | null | string[] | undefined>
