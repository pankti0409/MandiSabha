'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Leaf,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react'
import { ScrollVideo } from '@/components/scroll-video'
import { cn } from '@/lib/utils'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground" aria-label="Mandi Sabha home">
      <span className="grid size-9 place-items-center rounded-full bg-brand text-white shadow-sm">
        <Leaf className="size-5" />
      </span>
      <span className="font-display text-xl">
        Mandi <span className="text-brand">Sabha</span>
      </span>
    </Link>
  )
}

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
      aria-label={mounted && dark ? 'Use light theme' : 'Use dark theme'}
      onClick={toggle}
      type="button"
      className="grid size-10 place-items-center rounded-full border border-border-muted bg-surface text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
    >
      {mounted && dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

function LanguageSwitcher() {
  const [lang, setLang] = useState<'EN' | 'HI' | 'GU'>('EN')
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-full border border-border-muted bg-surface px-3 text-sm font-semibold text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <Globe2 className="size-4 text-brand" />
        <span>{lang}</span>
        <ChevronDown className="size-3.5 text-muted-text" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-[130px] rounded-xl border border-border-muted bg-surface p-1 shadow-xl backdrop-blur">
          {[
            { code: 'EN', label: 'English' },
            { code: 'HI', label: 'हिन्दी' },
            { code: 'GU', label: 'ગુજરાતી' },
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLang(item.code as 'EN' | 'HI' | 'GU')
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer',
                lang === item.code ? 'bg-brand/10 text-brand' : 'text-secondary-text hover:bg-surface-muted hover:text-primary-text'
              )}
            >
              <span>{item.label}</span>
              {lang === item.code && <span className="text-brand">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-muted bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-secondary-text md:flex">
          <a href="#how" className="hover:text-brand transition-colors">How it works</a>
          <Link href="/explore" className="hover:text-brand transition-colors">Explore prices</Link>
          <a href="#faq" className="hover:text-brand transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-accent transition-all shadow-sm md:flex cursor-pointer"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="h-10 items-center rounded-lg border border-brand/40 bg-brand/10 px-4 text-sm font-semibold text-brand hover:bg-brand hover:text-white transition-all md:flex hidden"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function Freshness() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border-muted bg-surface px-3.5 py-1.5 text-xs font-semibold text-secondary-text shadow-sm">
      <span className="size-2 rounded-full bg-brand animate-pulse-soft" />
      Live data · updated 2 min ago
    </span>
  )
}

function Preview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-muted bg-surface p-6 shadow-[0_24px_70px_color-mix(in_srgb,var(--brand-primary)_14%,transparent)] transition-all">
      <div className="absolute inset-0 grid-paper pointer-events-none" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-muted-text">Your active sabha</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary-text">Cotton · 12 quintal</p>
          </div>
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand border border-brand/20">
            Running
          </span>
        </div>

        <div className="rounded-xl border border-border-muted bg-surface-muted p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-brand text-white shadow-sm">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-primary-text">4 agents are comparing mandis</p>
              <p className="text-sm text-secondary-text">Finding the best net price near you</p>
            </div>
          </div>

          <div className="mt-5 flex h-24 items-end gap-2 px-1">
            {[35, 52, 44, 70, 62, 82, 78, 96, 74, 88, 100, 91].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-sm bg-brand/75 hover:bg-brand transition-all cursor-default"
                style={{ height: `${h}%` }}
                title={`Interval ${i + 1}: ${h}% capacity`}
              />
            ))}
          </div>

          <div className="mt-3 flex justify-between text-xs font-bold text-muted-text px-1">
            <span>Rajkot</span>
            <span>Unjha</span>
            <span>Gondal</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-border-muted bg-surface p-3 text-center">
            <p className="text-xs font-medium text-muted-text">Best net</p>
            <p className="mt-1 font-bold font-mono text-primary-text text-base">₹6,840</p>
          </div>
          <div className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-center">
            <p className="text-xs font-medium text-brand">Extra earned</p>
            <p className="mt-1 font-bold font-mono text-brand text-base">+₹1,260</p>
          </div>
          <div className="rounded-lg border border-border-muted bg-surface p-3 text-center">
            <p className="text-xs font-medium text-muted-text">Confidence</p>
            <p className="mt-1 font-bold text-primary-text text-base">High</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-6 text-center md:p-8">
      <p className="font-display text-3xl font-bold tabular-nums text-primary-text md:text-4xl">{value}</p>
      <p className="mt-1.5 text-xs font-semibold text-secondary-text md:text-sm">{label}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border-muted bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-secondary-text">
            Better information for every crop, every season, every farmer.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold text-secondary-text">
          <Link href="/explore" className="hover:text-brand transition-colors">Explore prices</Link>
          <Link href="/dashboard" className="hover:text-brand transition-colors">Dashboard</Link>
          <Link href="/settings" className="hover:text-brand transition-colors">Settings</Link>
          <a href="#faq" className="hover:text-brand transition-colors">Help & FAQ</a>
          <span className="text-muted-text">© 2026 Mandi Sabha</span>
        </div>
      </div>
    </footer>
  )
}

export default function MandiLanding() {
  return (
    <div className="min-h-screen bg-canvas text-primary-text">
      {/* ── Scroll Video Showcase Section at the Top ── */}
      <ScrollVideo />

      {/* ── Landing Page from Mandi Sabha Frontend Development ── */}
      <div id="landing-hero">
        <Navbar />

        <main>
          {/* Hero Section */}
          <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.02fr_.98fr] md:items-center md:pt-24">
            <div>
              <Freshness />
              <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-primary-text md:text-7xl">
                Your crop deserves a <em className="text-brand not-italic">better market.</em>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-secondary-text">
                Mandi Sabha brings together live prices, transport costs, weather and buyer signals — so you can sell with clarity, not guesswork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-bold text-white hover:bg-brand-accent transition-all shadow-md active:scale-[.98] cursor-pointer"
                >
                  <span>Start a free sabha</span>
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-muted bg-surface px-6 text-sm font-bold text-primary-text hover:bg-surface-muted transition-all active:scale-[.98] cursor-pointer"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-6 text-sm font-semibold text-secondary-text">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-brand" /> No commission
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="size-4 text-brand" /> Works on low data
                </span>
              </div>
            </div>

            <Preview />
          </section>

          {/* Stats Bar */}
          <section className="border-y border-border-muted bg-surface">
            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border-muted md:grid-cols-4">
              <Stat value="184" label="Mandis tracked" />
              <Stat value="2 min" label="Data freshness" />
              <Stat value="8" label="States covered" />
              <Stat value="12k+" label="Farmers informed" />
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how" className="mx-auto max-w-7xl px-5 py-24">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-brand">A sabha for your crop</p>
              <h2 className="mt-3 font-display text-4xl font-bold text-primary-text md:text-5xl">
                Three steps to a clearer decision.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Tell us your crop', 'Share what you are selling, how much, and where you are.'],
                ['02', 'Agents hold a sabha', 'Our market agents compare live prices, distance, weather and risk.'],
                ['03', 'Get your best mandi', 'You see the full picture and choose the market that pays more.'],
              ].map(([n, t, d]) => (
                <article key={n} className="rounded-xl border border-border-muted bg-surface p-7 shadow-sm transition-all hover:border-brand/50">
                  <span className="font-display text-4xl font-bold text-brand/40">{n}</span>
                  <h3 className="mt-6 text-xl font-bold text-primary-text">{t}</h3>
                  <p className="mt-3 leading-7 text-secondary-text">{d}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Call to Action Banner */}
          <section className="bg-brand px-5 py-16 text-white shadow-inner">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-white/75">Built for real decisions</p>
                <h2 className="mt-2 font-display text-4xl font-bold text-white">Know more. Keep more.</h2>
              </div>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white px-6 text-sm font-bold text-brand hover:bg-white/90 transition-all shadow-md active:scale-[.98] cursor-pointer"
              >
                <span>Join Mandi Sabha</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
            <p className="text-center text-xs font-bold uppercase tracking-[.18em] text-brand">Questions, answered</p>
            <h2 className="mt-3 text-center font-display text-4xl font-bold text-primary-text">A calmer way to sell.</h2>
            <div className="mt-10 divide-y divide-border-muted border-y border-border-muted">
              {[
                {
                  q: 'Is Mandi Sabha free to use?',
                  a: 'Yes, Mandi Sabha is completely free for farmers. Our goal is to provide transparency and empower farmers with net-profit intelligence.',
                },
                {
                  q: 'Where does the market data come from?',
                  a: 'We connect directly to live Agmarknet mandi feeds, local APMC updates, weather radar APIs, and transport freight index databases.',
                },
                {
                  q: 'Will this work in my language?',
                  a: 'Mandi Sabha supports English, हिन्दी (Hindi), and ગુજરાતી (Gujarati) with full voice input support for local languages.',
                },
                {
                  q: 'Do I have to sell through Mandi Sabha?',
                  a: 'No. Mandi Sabha helps you compare options. You stay in 100% control of where and when you sell, with clear data to support your decision.',
                },
              ].map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-primary-text">
                    <span>{q}</span>
                    <ChevronDown className="size-4 text-muted-text transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 pr-8 leading-7 text-secondary-text">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}
