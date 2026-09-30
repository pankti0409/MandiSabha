'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  History, 
  Compass, 
  Settings, 
  Plus, 
  LogOut, 
  Sun, 
  Moon, 
  Sparkles, 
  TrendingUp, 
  Radio, 
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  Bell,
  Leaf,
  Newspaper,
  Mic
} from 'lucide-react'
import { useAuth } from './auth-provider'
import { useLocale } from './locale-provider'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { VoiceAssistantModal } from '@/components/voice-assistant-modal'
import { motion, AnimatePresence } from 'framer-motion'

const liveMarketNews = [
  {
    tag: 'Mandi Arrival',
    headline: 'Nashik APMC: 42,000q Red Onion arrivals; modal rates steady at ₹2,140/q with heavy Surat & Ahmedabad buyer bidding',
    badge: 'Onion ₹2,140/q',
    time: '2m ago',
  },
  {
    tag: 'Highway Corridor',
    headline: 'NH48 Freight Radar: Clear traffic across Manor & Navsari toll plazas; average transit time 3.5 hrs with zero congestion',
    badge: 'NH48 Clear',
    time: '5m ago',
  },
  {
    tag: 'Arbitrage Surge',
    headline: 'Surat APMC: Onion auction hits ₹2,280/q peak; net farm gate arbitrage unlocks +₹8,200 pure surplus over local traders',
    badge: '+₹410/q Spread',
    time: '8m ago',
  },
  {
    tag: 'Weather Advisory',
    headline: 'IMD Agri Radar: Dry weather predicted across Maharashtra-Gujarat transport corridor for next 72 hrs; ideal harvest window',
    badge: 'Zero Rain Risk',
    time: '12m ago',
  },
  {
    tag: 'Procurement',
    headline: 'Madhya Pradesh & Malwa Mandis: Sharbati wheat trades firm at ₹2,740/q ahead of central procurement cycle',
    badge: 'Wheat +3.5%',
    time: '15m ago',
  },
  {
    tag: 'Govt Policy',
    headline: 'Agri Ministry: Buffer stock release prioritized for tier-1 cities; MSP direct bank transfer (DBT) centers operational',
    badge: 'Policy Active',
    time: '22m ago',
  },
  {
    tag: 'Vegetable Rally',
    headline: 'Pune Market Yard: Gultekdi terminal logs heavy vegetable arrivals; Tomato modal rates surge +4.8% to ₹2,480/q',
    badge: 'Tomato ₹2,480/q',
    time: '28m ago',
  },
  {
    tag: 'Logistics & Fuel',
    headline: 'Commercial Freight: Diesel stable at ₹89.4/L; FASTag electronic freight clearing averaging 42s across Western checkposts',
    badge: 'FASTag 42s',
    time: '35m ago',
  }
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLocale()

  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [newsIdx, setNewsIdx] = useState(0)
  const [newsPaused, setNewsPaused] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    if (newsPaused) return
    const interval = setInterval(() => {
      setNewsIdx((prev) => (prev + 1) % liveMarketNews.length)
    }, 3800)
    return () => clearInterval(interval)
  }, [newsPaused])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.style.colorScheme = next ? 'dark' : 'light'
    try {
      document.cookie = `mandi-theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`
    } catch {}
  }

  async function signOut() {
    await logout()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard || 'Home Dashboard', icon: Home },
    { href: '/sabha/demo-001', label: 'Live Sabha', icon: Sparkles, badge: 'Live' },
    { href: '/explore', label: t.nav.explore || 'Mandi Explorer', icon: Compass },
    { href: '/history', label: t.nav.history || 'Sabha History', icon: History, count: '4' },
    { href: '/settings', label: t.nav.settings || 'Farm & Crop Settings', icon: Settings },
  ]

  const activeNews = liveMarketNews[newsIdx]

  return (
    <div className="min-h-dvh w-full bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* ── Desktop Left Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] lg:w-[256px] shrink-0 flex-col justify-between border-r border-border bg-card h-dvh sticky top-0 z-30 py-5">
        <div className="flex flex-col gap-4 px-4">
          {/* Brand Logo - Clean Leaf Emblem matching Landing Page */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2.5 group" aria-label="Mandi Sabha">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
                <Leaf className="size-5" />
              </span>
              <div>
                <span className="font-display text-[1.15rem] font-extrabold tracking-tight block leading-none">
                  Mandi <span className="text-primary">Sabha</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest font-bold text-ink-muted uppercase">
                  Agri AI Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Action Button */}
          <Link
            href="/sabha/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary-hover transition-colors active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Start a New Sabha</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5" aria-label="App navigation">
            {navItems.map(({ href, label, icon: Icon, badge, count }) => {
              const isActive = path === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-ink-muted hover:bg-background-subtle hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-ink-faint group-hover:text-foreground')} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase', isActive ? 'bg-primary/15 text-primary' : 'bg-background-subtle text-ink-muted')}>
                      {badge}
                    </span>
                  )}
                  {count && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-mono font-bold', isActive ? 'bg-primary/15 text-primary' : 'bg-background-subtle text-ink-muted')}>
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer: System Status */}
        <div className="mt-auto px-4 py-3.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mandi Live v2.4</span>
          </span>
          <span className="text-[10px] text-ink-faint">Nashik Hub</span>
        </div>
      </aside>

      {/* ── Main Content Area with Full Screen Width ────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Top Header with Highlighted Mandi News Ticker & User Profile */}
        <header className="sticky top-0 z-20 w-full border-b border-border/70 bg-card/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Mobile Brand / Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-9 place-items-center rounded-xl border border-border bg-card text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-white shadow-sm">
                <Leaf className="size-4" />
              </span>
              <span className="font-display font-extrabold text-base">
                Mandi <span className="text-primary">Sabha</span>
              </span>
            </Link>
          </div>

          {/* ── Live Agriculture & Market News Feed Ticker (Full-Width, Information-Dense) ── */}
          <div 
            className="hidden md:flex flex-1 min-w-0 items-center justify-between gap-3 overflow-hidden text-xs rounded-xl border border-primary/35 bg-gradient-to-r from-primary/[0.08] via-emerald-500/[0.04] to-primary/[0.06] dark:from-primary/[0.14] dark:via-emerald-500/[0.07] dark:to-primary/[0.10] px-3.5 py-1.5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.14)] backdrop-blur-md transition-all duration-300 hover:border-primary/55 mx-2 lg:mx-4"
            onMouseEnter={() => setNewsPaused(true)}
            onMouseLeave={() => setNewsPaused(false)}
          >
            {/* Live AgriPulse Badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/15 px-2.5 py-1 font-bold text-primary shrink-0 shadow-2xs">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <Newspaper className="size-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-extrabold whitespace-nowrap">Live Mandi News</span>
            </div>

            {/* Auto-Slide Show News Headline (Spans full available width with bold letters) */}
            <div className="flex-1 min-w-0 overflow-hidden relative h-7 flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={newsIdx}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex items-center gap-2.5 w-full min-w-0"
                >
                  <span className="rounded-md border border-border/60 bg-background/90 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground shrink-0 shadow-2xs">
                    {activeNews.tag}
                  </span>
                  <p className="truncate text-foreground font-black text-xs sm:text-[13px] tracking-tight min-w-0 flex-1 leading-snug">
                    {activeNews.headline}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quick Spread Badge, News Counter & Navigation Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`badge-${newsIdx}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className="hidden sm:inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-400 shrink-0 shadow-2xs"
                >
                  {activeNews.badge}
                </motion.span>
              </AnimatePresence>

              <span className="text-[10px] text-muted-foreground hidden lg:inline font-mono shrink-0">
                {activeNews.time}
              </span>

              {/* Counter Indicator */}
              <span className="text-[10px] font-mono font-bold text-muted-foreground/80 bg-background/60 px-1.5 py-0.5 rounded border border-border/50 hidden xl:inline shrink-0">
                {newsIdx + 1}/{liveMarketNews.length}
              </span>

              {/* Prev / Next News Buttons */}
              <div className="flex items-center border border-border/80 rounded-lg bg-background/90 overflow-hidden shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setNewsIdx((prev) => (prev - 1 + liveMarketNews.length) % liveMarketNews.length)}
                  className="px-1.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Previous news item"
                  title="Previous news"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-border/60" />
                <button
                  type="button"
                  onClick={() => setNewsIdx((prev) => (prev + 1) % liveMarketNews.length)}
                  className="px-1.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Next news item"
                  title="Next news"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── User Profile & Action Controls in Top Right Corner (Image 3) ── */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Farmer Profile Pill */}
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-xl p-1 -m-1 hover:bg-muted/60 transition-colors group"
              title="Go to Farmer Profile & Settings"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold font-display text-sm group-hover:border-primary transition-colors shadow-2xs">
                {(user?.name || 'Pankti').charAt(0)}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                  {user?.name || 'Pankti'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                  {user?.village || 'Nashik'}, {user?.district || 'Nashik'}
                </p>
              </div>
            </Link>

            {/* Quick Action Buttons (Image 3: Moon/Sun & Logout) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="grid size-8.5 place-items-center rounded-xl border border-border/80 bg-background/90 hover:bg-muted text-foreground transition-colors shadow-2xs"
                aria-label={mounted && dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={mounted && dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mounted && dark ? <Sun className="size-4 text-accent" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={signOut}
                className="grid size-8.5 place-items-center rounded-xl border border-border/80 bg-background/90 hover:bg-risk/10 hover:text-risk text-muted-foreground transition-colors shadow-2xs"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Live News Marquee */}
        <div 
          className="md:hidden w-full bg-gradient-to-r from-primary/10 via-emerald-500/5 to-primary/10 border-b border-primary/20 px-3 py-1.5 flex items-center justify-between gap-2 text-xs cursor-pointer"
          onClick={() => setNewsIdx((prev) => (prev + 1) % liveMarketNews.length)}
          title="Click to advance news"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-[10px] text-primary uppercase">News:</span>
          </div>
          <p className="truncate text-foreground font-black text-[11px] flex-1 min-w-0">
            {activeNews.headline}
          </p>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            {activeNews.badge}
          </span>
        </div>

        {/* Mobile Flyout Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[61px] bottom-0 z-40 bg-background/95 backdrop-blur-2xl p-6 flex flex-col justify-between border-t border-border">
            <nav className="flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-3.5 text-base font-bold',
                    path === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="size-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <span className="text-sm font-bold">{user?.name || 'Farmer'}</span>
              <button onClick={signOut} className="flex items-center gap-2 text-sm text-red-500 font-bold">
                <LogOut className="size-4" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-7 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApply={(data) => {
          router.push(`/sabha/new?crop=${data.crop}&quantity=${data.quantity}&location=${encodeURIComponent(data.location)}&urgency=${data.urgency}`)
        }}
      />

      {/* ── Mobile Floating Bottom Navigation ────────────────────────────── */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex md:hidden items-center justify-around rounded-2xl border border-border/80 bg-card/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = path === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold transition-all',
                isActive ? 'text-primary scale-105' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              <span>{label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
