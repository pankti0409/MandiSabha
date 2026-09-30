import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline mb-6">
          <ArrowLeft className="size-4" /> Back to Sign-in
        </Link>
        <span className="section-kicker">Farmer Rights & Service Terms</span>
        <h1 className="mt-2 font-display text-3xl font-bold">Mandi Sabha Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Mandi Sabha is committed to delivering honest, verified, and commission-free agricultural market intelligence. By using our platform, you agree to fair usage and non-commercial reproduction of aggregated price feeds.
        </p>
        <div className="mt-8 space-y-4 text-xs text-muted-foreground border-t border-border pt-6">
          <p>1. <strong>Accuracy of Data:</strong> Prices reflect real-time electronic auction bids from connected APMC mandis.</p>
          <p>2. <strong>Zero Brokerage:</strong> Mandi Sabha does not participate in commodity trading or charge transaction percentages.</p>
          <p>3. <strong>Farmer Privacy:</strong> We do not sell or monetize personal farmer land or harvest metrics.</p>
        </div>
      </div>
    </main>
  )
}
