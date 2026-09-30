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
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  Bell
} from 'lucide-react'
import { useAuth } from './auth-provider'
import { useLocale } from './locale-provider'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { VoiceAssistantModal } from '@/components/voice-assistant-modal'
import { Mic } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLocale()

  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

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
    { href: '/dashboard', label: t.nav.dashboard || 'Home Dashboard', icon: Home, badge: 'Live' },
    { href: '/sabha/new', label: t.nav.newSabha || 'Start New Sabha', icon: Plus, highlight: true },
    { href: '/explore', label: t.nav.explore || 'Mandi Explorer', icon: Compass },
    { href: '/history', label: t.nav.history || 'Sabha History', icon: History, count: '4' },
    { href: '/settings', label: t.nav.settings || 'Farm & Crop Settings', icon: Settings },
  ]

  const userCrops = user?.crops && user.crops.length > 0 ? user.crops : ['Onion', 'Wheat', 'Soybean']

  return (
    <div className="min-h-dvh w-full bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* ── Desktop Left Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] lg:w-[256px] shrink-0 flex-col justify-between border-r border-border bg-card h-dvh sticky top-0 z-30 py-5">
        <div className="flex flex-col gap-4 px-4">
          {/* Brand Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2.5 group" aria-label="Mandi Sabha">
              <span className="logo-mark transition-transform group-hover:scale-105">
                <span /><span /><span /><span /><span />
              </span>
              <div>
                <span className="font-display text-[1.15rem] font-extrabold tracking-tight block leading-none">
                  Mandi Sabha
                </span>
                <span className="text-[9px] font-mono tracking-widest font-bold text-primary uppercase opacity-70">
                  Agri AI
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

          {/* Personalized Crops Widget */}
          <div className="rounded-xl border border-border bg-background-subtle/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                My Crops
              </span>
              <Link href="/settings" className="text-[10px] font-bold text-primary hover:underline">
                Edit
              </Link>
            </div>
            <div className="flex flex-wrap gap-1">
              {userCrops.map((cropName) => (
                <span
                  key={cropName}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                  {cropName}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: User & Controls */}
        <div className="flex flex-col gap-3 px-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary font-bold font-display text-sm">
                {(user?.name || 'Farmer').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{user?.name || 'Ramesh Patel'}</p>
                <p className="text-[10px] text-ink-muted truncate">{user?.village || 'Nashik'}, {user?.district || 'MH'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-background-subtle transition-colors"
                aria-label={mounted && dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mounted && dark ? <Sun className="size-4 text-accent" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={signOut}
                className="grid size-8 place-items-center rounded-lg border border-border bg-card text-ink-muted hover:text-risk hover:bg-risk-soft transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area with Full Screen Width ────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 w-full border-b border-border/70 bg-card/85 backdrop-blur-xl px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4">
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
              <span className="logo-mark !size-7"><span/><span/><span/><span/><span/></span>
              <span className="font-display font-extrabold text-base">Mandi Sabha</span>
            </Link>
          </div>

          {/* Desktop Market Ticker Bar */}
          <div className="hidden sm:flex items-center gap-3 overflow-hidden text-xs">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-bold text-primary shrink-0">
              <span className="status-pulse !size-2" />
              <span>Agmarknet Live</span>
            </div>
            <div className="flex items-center gap-5 text-muted-foreground truncate font-medium">
              <span className="flex items-center gap-1">
                <strong className="text-foreground">Surat:</strong> Onion ₹2,140/q <TrendingUp className="inline size-3.5 text-primary" /> +4.2%
              </span>
              <span className="text-border-strong">|</span>
              <span className="flex items-center gap-1">
                <strong className="text-foreground">Pune:</strong> Wheat ₹2,640/q <TrendingUp className="inline size-3.5 text-primary" /> +1.8%
              </span>
              <span className="text-border-strong">|</span>
              <span className="flex items-center gap-1">
                <strong className="text-foreground">Indore:</strong> Soybean ₹4,750/q <TrendingUp className="inline size-3.5 text-primary" /> +3.8%
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Voice Assistant Button */}
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shimmer-badge"
              title="Speak to start a sabha"
            >
              <Mic className="size-3.5 text-accent animate-pulse" />
              <span className="hidden sm:inline">Voice AI</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-background/80 p-0.5 text-xs font-bold">
              {(['en', 'hi', 'gu'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 transition-all',
                    language === lang
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'ગુજ'}
                </button>
              ))}
            </div>

            {/* Quick Header CTA on Desktop */}
            <Link
              href="/sabha/new"
              className="hidden lg:inline-flex items-center gap-1.5 button-primary !min-h-[38px] !px-4 !text-xs"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span>New Sabha</span>
            </Link>
          </div>
        </header>

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
