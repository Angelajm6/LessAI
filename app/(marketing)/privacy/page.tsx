import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — LessAI' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-8 inline-block">← Back to LessAI</Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: July 2026</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">What we collect</h2>
            <p className="text-gray-600">We collect information you provide when signing up (name, email, company name), data you enter while using LessAI (AI tools you use, prompts you save, task activity), and standard usage data (page views, feature interactions) to improve the product.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">How we use it</h2>
            <p className="text-gray-600">We use your data to provide and improve LessAI, send transactional emails (account confirmation, password reset), and occasionally reach out about product updates. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Data storage</h2>
            <p className="text-gray-600">Your data is stored securely via Supabase (PostgreSQL) with row-level security. Payments are processed by Stripe — we never store card details.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Your rights</h2>
            <p className="text-gray-600">You can request a copy of your data, ask us to delete your account, or update your information at any time. Email us at <a href="mailto:hello@lessai.io" className="text-emerald-600 hover:underline">hello@lessai.io</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Cookies</h2>
            <p className="text-gray-600">We use session cookies for authentication only. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
            <p className="text-gray-600">Questions? Reach us at <a href="mailto:hello@lessai.io" className="text-emerald-600 hover:underline">hello@lessai.io</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
