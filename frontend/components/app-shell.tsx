'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  History, 
  Compass, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Sparkles, 
  TrendingUp, 
  Radio, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
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
import { FarmerOnboardingModal } from '@/components/farmer-onboarding-modal'
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage, t, tData } = useLocale()

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

  type NavItem = {
    href: string
    label: string
    icon: any
    badge?: string
    count?: string
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: t('nav.dashboard') || 'Home Dashboard', icon: Home },
    { href: '/sabha/new', label: 'Start Sabha', icon: Sparkles },
    { href: '/explore', label: t('nav.explore') || 'Mandi Explorer', icon: Compass },
    { href: '/history', label: t('nav.history') || 'Sabha History', icon: History },
    { href: '/settings', label: t('nav.settings') || 'Farm & Crop Settings', icon: Settings },
  ]

  return (
    <div className="min-h-dvh w-full bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* ── Desktop Left Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] lg:w-[256px] shrink-0 flex-col justify-between border-r border-border bg-card h-dvh sticky top-0 z-30 py-5">
        <div className="flex flex-col gap-4 px-4">
          {/* Brand Logo - Clean Leaf Emblem matching Landing Page */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
            <Link href="/dashboard" className="flex items-center gap-2 group" aria-label="Mandi Sabha">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-white shadow-2xs transition-transform group-hover:scale-105">
                <Leaf className="size-4" />
              </span>
              <div>
                <span className="font-display text-[1.08rem] font-bold tracking-tight block leading-none">
                  Mandi <span className="text-primary">Sabha</span>
                </span>
                <span className="text-[8.5px] font-mono tracking-wider font-semibold text-muted-foreground uppercase">
                  Agri AI Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5" aria-label="App navigation">
            {navItems.map(({ href, label, icon: Icon, badge, count }) => {
              const isActive = path === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors border',
                    isActive
                      ? 'border-primary/25 bg-primary/10 text-primary font-semibold shadow-2xs'
                      : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase', isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                      {badge}
                    </span>
                  )}
                  {count && (
                    <span className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-mono font-medium', isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer: System Status */}
        <div className="mt-auto px-4 py-3 border-t border-border/60 flex items-center justify-between text-[10.5px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('nav.system_status')}</span>
          </span>
          <span className="text-[10px] text-muted-foreground/70">{t('nav.hub_name')}</span>
        </div>
      </aside>

      {/* ── Main Content Area with Full Screen Width ────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Top Header with Highlighted Mandi News Ticker & User Profile */}
        <header className="sticky top-0 z-20 w-full border-b border-border/70 bg-card/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 sm:gap-4">
          {/* Back button & Mobile Brand / Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back()
                } else {
                  router.push('/dashboard')
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted/70 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0 shadow-2xs group"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-[11px] font-medium hidden sm:inline">{t('common.actions.back') || 'Back'}</span>
            </button>

            {/* Mobile Brand / Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-primary text-white shadow-2xs">
                  <Leaf className="size-3.5" />
                </span>
                <span className="font-display font-bold text-sm">
                  Mandi <span className="text-primary">Sabha</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Empty spacer between brand and profile actions */}
          <div className="flex-1" />

          {/* ── User Profile & Action Controls in Top Right Corner ── */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Farmer Profile Pill */}
            <Link
              href={(!user?.village && !user?.district) || user?.name === 'Farmer' ? '/settings?onboarding=true' : '/settings'}
              className="flex items-center gap-2 rounded-lg p-1 -m-1 hover:bg-muted/50 transition-colors group cursor-pointer"
              title={t('nav.profile_tooltip')}
            >
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg border font-bold font-display text-xs group-hover:border-primary transition-colors shadow-2xs ${
                user?.name === 'Farmer' || (!user?.village && !user?.district)
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                {(user?.name || 'F').charAt(0)}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                  {user?.name && user.name !== 'Farmer' ? user.name : 'Farmer'}
                </p>
                <p className="text-[10px] leading-tight truncate">
                  {user?.village || user?.district ? (
                    <span className="text-muted-foreground">
                      {`${user.village ? `${tData('geo', user.village)}, ` : ''}${tData('geo', user.district || user.state || '')}`}
                    </span>
                  ) : (
                    <span className="text-amber-500 font-semibold">Complete profile →</span>
                  )}
                </p>
              </div>
            </Link>

            {/* Quick Action Buttons (Voice AI, Moon/Sun & Logout) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className="flex items-center gap-1.5 px-2.5 h-8.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-2xs font-bold text-xs cursor-pointer"
                title="Speak to Voice Assistant (बोलकर भरें)"
              >
                <Mic className="size-4 animate-pulse" />
                <span className="hidden sm:inline">Voice AI</span>
              </button>
              <button
                onClick={toggleTheme}
                className="grid size-8.5 place-items-center rounded-xl border border-border/80 bg-background/90 hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer"
                aria-label={mounted && dark ? t('nav.toggle_theme_light') : t('nav.toggle_theme_dark')}
                title={mounted && dark ? t('nav.toggle_theme_light') : t('nav.toggle_theme_dark')}
              >
                {mounted && dark ? <Sun className="size-4 text-accent" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={signOut}
                className="grid size-8.5 place-items-center rounded-xl border border-border/80 bg-background/90 hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-colors shadow-2xs cursor-pointer"
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
              >
                <LogOut className="size-4" />
              </button>
            </div>
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
              <button onClick={signOut} className="flex items-center gap-2 text-sm text-red-500 font-bold cursor-pointer">
                <LogOut className="size-4" /> {t('nav.logout')}
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
          const params = new URLSearchParams({
            crop: data.crop,
            quantity: String(data.quantity),
            location: data.location,
            urgency: data.urgency,
          })
          if (data.targetMandi) {
            params.set('targetMandi', data.targetMandi)
          }
          router.push(`/sabha/new?${params.toString()}`)
        }}
      />

      {/* One-time Onboarding Modal for New Unregistered Farmers Only */}
      <FarmerOnboardingModal />

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
