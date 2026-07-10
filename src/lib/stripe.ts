import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export const PLANS = {
  pro: {
    name: 'LessAI Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 1200,
  },
  teams: {
    name: 'LessAI Teams',
    priceId: process.env.STRIPE_TEAMS_PRICE_ID!,
    amount: 1900,
  },
} as const

export type Plan = keyof typeof PLANS
