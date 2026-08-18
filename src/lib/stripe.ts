import Stripe from 'stripe'

// Keep module loading safe when a deployment is missing its Stripe variable.
// Checkout routes validate the variable and return a useful response before
// making any request with this placeholder.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_missing_configuration', {
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
