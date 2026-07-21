import Link from 'next/link'

export const metadata = { title: 'Terms of Service — LessAI' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-8 inline-block">← Back to LessAI</Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: July 2026</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Using LessAI</h2>
            <p className="text-gray-600">By creating an account you agree to use LessAI for lawful purposes only. You are responsible for keeping your login credentials secure and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Free trial &amp; billing</h2>
            <p className="text-gray-600">New accounts include a 7-day free trial. After the trial period, continued access requires an active paid subscription. You can cancel at any time and you will retain access until the end of your billing period. We do not offer refunds for partial periods.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Your content</h2>
            <p className="text-gray-600">You retain ownership of any prompts, notes, or content you create in LessAI. By using the service you grant us a limited license to store and process that content to provide the service to you.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Service availability</h2>
            <p className="text-gray-600">We aim for high availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue features with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Limitation of liability</h2>
            <p className="text-gray-600">LessAI is provided &quot;as is.&quot; To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
            <p className="text-gray-600">Questions about these terms? Email <a href="mailto:hello@lessai.io" className="text-emerald-600 hover:underline">hello@lessai.io</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
