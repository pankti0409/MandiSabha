'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Check, Globe, Moon, ShieldCheck, Sparkles, Sun, TrendingUp, Users } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.style.colorScheme = next ? 'dark' : 'light'
    try {
      document.cookie = `mandi-theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="icon-button"
      aria-label={mounted ? (dark ? 'Use light theme' : 'Use dark theme') : 'Toggle theme'}
      type="button"
    >
      {mounted && dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

function LanguageSelector() {
  const { language, setLanguage } = useLocale()
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1 text-xs font-semibold">
      <Globe className="size-3.5 text-muted-foreground mr-0.5" />
      {(['en', 'hi', 'gu'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`rounded-lg px-2 py-0.5 transition-colors ${
            language === lang ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ગુ'}
        </button>
      ))}
    </div>
  )
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground">
      {/* ── Left Brand Panel (Desktop lg+) ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 xl:p-16 bg-forest text-white relative overflow-hidden">
        {/* Subtle Background Wash */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle 600px at 20% 20%, #F0A21C, transparent), radial-gradient(circle 500px at 80% 80%, #4FD18B, transparent)',
          }}
        />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Mandi Sabha home">
            <span className="logo-mark" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              Mandi Sabha
            </span>
          </Link>
        </div>

        {/* Center Value Proposition & Hand-Drawn Illustrated Card */}
        <div className="relative z-10 my-auto py-8">
          <span className="section-kicker text-wheat">Fair Mandi Intelligence</span>
          <h2 className="mt-3 font-display text-4xl xl:text-5xl font-bold leading-tight text-white">
            Where every quintal finds its <em className="text-wheat italic">highest value.</em>
          </h2>
          <p className="mt-4 text-base text-white/75 leading-relaxed max-w-md">
            Compare live wholesale prices, full transport costs, and route risks across 1,248 Indian mandis.
          </p>

          <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-md max-w-md">
            <div className="flex items-center justify-between text-xs font-bold text-wheat mb-3">
              <span>🌾 Sample Verified Comparison</span>
              <span className="status-pill status-pill-active text-[10px] text-primary-foreground bg-primary">Surat #1</span>
            </div>
            <p className="font-display text-2xl font-bold text-white">Onion · 20 quintals</p>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/80">
              <span>Surat Net: <strong>₹36,600</strong></span>
              <span className="text-wheat font-bold">+₹8,200 vs Local</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 flex items-center gap-6 border-t border-white/15 pt-6 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-wheat" /> Zero commissions</span>
          <span className="flex items-center gap-1.5"><Check className="size-4 text-wheat" /> e-NAM live arrival data</span>
          <span className="flex items-center gap-1.5"><Users className="size-4 text-wheat" /> 10,000+ farmers</span>
        </div>
      </div>

      {/* ── Right Form Column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Top Header Utilities */}
        <div className="flex items-center justify-between mb-8">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 font-display text-lg font-bold">
            <span className="logo-mark shrink-0"><span/><span/><span/><span/><span/></span>
            Mandi Sabha
          </Link>

          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        {/* Centered Form Body */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-4">
          {children}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[11px] text-muted-foreground">
          Protected by Mandi Sabha Farmer Security. By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  )
}
