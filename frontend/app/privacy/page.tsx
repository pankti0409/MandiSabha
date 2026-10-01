import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
            <ArrowLeft className="size-3.5 text-primary" />
            <span>Back to Home</span>
          </Link>
        </div>
        <span className="section-kicker block">Data Security & Protection</span>
        <h1 className="mt-2 font-display text-3xl font-bold">Mandi Sabha Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Your personal details, phone number, location, and crop records are encrypted and strictly used to personalize your mandi deliberations.
        </p>
        <div className="mt-8 space-y-4 text-xs text-muted-foreground border-t border-border pt-6">
          <p>1. <strong>Session Security:</strong> Authentication is handled via secure, HTTP-only cookies without storing tokens in client storage.</p>
          <p>2. <strong>Location Privacy:</strong> Farm origin is used solely to compute diesel distance and freight toll estimates.</p>
          <p>3. <strong>Data Retention:</strong> You can modify or delete your crop profiles at any time in Settings.</p>
        </div>
      </div>
    </main>
  )
}
