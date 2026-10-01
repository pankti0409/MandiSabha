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
import { motion, AnimatePresence } from 'framer-motion'

const liveMarketNewsEn = [
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

const liveMarketNewsHi = [
  {
    tag: 'मंडी आवक',
    headline: 'नासिक एपीएमसी: 42,000 क्विंटल लाल प्याज की आवक; सूरत और अहमदाबाद के व्यापारियों की भारी मांग से भाव ₹2,140/क्विं.',
    badge: 'प्याज़ ₹2,140/क्विं.',
    time: '2 मिनट पहले',
  },
  {
    tag: 'हाईवे कॉरिडोर',
    headline: 'NH48 माल ढुलाई रडार: मनोर व नवसारी टोल प्लाजा पर सुगम यातायात; 3.5 घंटे में सुरक्षित परिवहन',
    badge: 'NH48 साफ़',
    time: '5 मिनट पहले',
  },
  {
    tag: 'मुनाफ़ा अंतर',
    headline: 'सूरत एपीएमसी: प्याज नीलामी ₹2,280/क्विं. के शिखर पर; स्थानीय व्यापारियों की तुलना में +₹8,200 का शुद्ध लाभ',
    badge: '+₹410/क्विं. फ़ायदा',
    time: '8 मिनट पहले',
  },
  {
    tag: 'मौसम सलाह',
    headline: 'मौसम विभाग: महाराष्ट्र-गुजरात मार्ग पर अगले 72 घंटे सूखा मौसम; माल भेजने के लिए उत्तम समय',
    badge: 'बारिश का जोखिम शून्य',
    time: '12 मिनट पहले',
  },
  {
    tag: 'सरकारी नीति',
    headline: 'कृषि मंत्रालय: प्रमुख शहरों के लिए बफ़र स्टॉक जारी; डीबीटी केंद्र पूरी क्षमता से कार्यरत',
    badge: 'नीति सक्रिय',
    time: '22 मिनट पहले',
  },
  {
    tag: 'सब्जी बाजार',
    headline: 'पुणे मार्केट यार्ड: गुलटेकड़ी टर्मिनल में भारी आवक; टमाटर मॉडल दरें +4.8% बढ़कर ₹2,480/क्विं.',
    badge: 'टमाटर ₹2,480/क्विं.',
    time: '28 मिनट पहले',
  }
]

const liveMarketNewsGu = [
  {
    tag: 'મંડી આવક',
    headline: 'નાસિક એપીએમસી: 42,000 ક્વિન્ટલ લાલ ડુંગળીની આવક; સુરત અને અમદાવાદના વેપારીઓની ખરીદીથી મોડલ ભાવ ₹2,140/ક્વિં.',
    badge: 'ડુંગળી ₹2,140/ક્વિં.',
    time: '2 મિનિટ પહેલાં',
  },
  {
    tag: 'હાઇવે કોરિડોર',
    headline: 'NH48 ફ્રેઇટ રડાર: મનોર અને નવસારી ટોલ પ્લાઝા પર ટ્રાફિક ક્લિયર; 3.5 કલાકમાં સરળ પરિવહન',
    badge: 'NH48 ક્લિયર',
    time: '5 મિનિટ પહેલાં',
  },
  {
    tag: 'નફો ઉછાળો',
    headline: 'સુરત એપીએમસી: ડુંગળી હરાજી ₹2,280/ક્વિં. ની ઊંચાઈએ; સ્થાનિક વેપારીઓ કરતાં +₹8,200 નો ચોખ્ખો નફો',
    badge: '+₹410/ક્વિં. નફો',
    time: '8 મિનિટ પહેલાં',
  },
  {
    tag: 'હવામાન સલાહ',
    headline: 'હવામાન વિભાગ: મહારાષ્ટ્ર-ગુજરાત માર્ગ પર આગામી 72 કલાક સૂકું હવામાન; માલ મોકલવા માટે ઉત્તમ સમય',
    badge: 'વરસાદનું જોખમ શૂન્ય',
    time: '12 મિનિટ પહેલાં',
  },
  {
    tag: 'શાકભાજી બજાર',
    headline: 'પુણે માર્કેટ યાર્ડ: ગુલટેકડી ટર્મિનલમાં ભારે આવક; ટામેટાના મોડલ ભાવ +4.8% વધીને ₹2,480/ક્વિં.',
    badge: 'ટામેટા ₹2,480/ક્વિં.',
    time: '28 મિનિટ પહેલાં',
  }
]

const newsByLang: Record<string, typeof liveMarketNewsEn> = {
  en: liveMarketNewsEn,
  hi: liveMarketNewsHi,
  gu: liveMarketNewsGu,
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage, t, tData } = useLocale()

  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [newsIdx, setNewsIdx] = useState(0)
  const [newsPaused, setNewsPaused] = useState(false)

  const activeNewsList = newsByLang[language] || liveMarketNewsEn

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    if (newsPaused) return
    const interval = setInterval(() => {
      setNewsIdx((prev) => (prev + 1) % activeNewsList.length)
    }, 3800)
    return () => clearInterval(interval)
  }, [newsPaused, activeNewsList.length])

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

  const activeNews = activeNewsList[newsIdx % activeNewsList.length]

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

          {/* ── Live Agriculture & Market News Feed Ticker (Full-Width, Crisp & Minimal) ── */}
          <div 
            className="hidden md:flex flex-1 min-w-0 items-center justify-between gap-3 overflow-hidden text-xs rounded-lg border border-primary/25 bg-primary/[0.04] dark:bg-primary/[0.08] px-3 py-1.5 shadow-2xs backdrop-blur-md transition-all duration-300 hover:border-primary/40 mx-2 lg:mx-4"
            onMouseEnter={() => setNewsPaused(true)}
            onMouseLeave={() => setNewsPaused(false)}
          >
            {/* Live AgriPulse Badge */}
            <div className="flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-semibold text-primary shrink-0">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
              </span>
              <Newspaper className="size-3" />
              <span className="text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">{t('nav.news_live')}</span>
            </div>

            {/* Auto-Slide Show News Headline */}
            <div className="flex-1 min-w-0 overflow-hidden relative h-6 flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={newsIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center gap-2 w-full min-w-0"
                >
                  <span className="rounded border border-border/70 bg-background/80 px-1.5 py-0.5 text-[9.5px] font-mono font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    {activeNews.tag}
                  </span>
                  <p className="truncate text-foreground font-medium text-xs sm:text-[12.5px] tracking-tight min-w-0 flex-1 leading-snug">
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="hidden sm:inline-flex rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0"
                >
                  {activeNews.badge}
                </motion.span>
              </AnimatePresence>

              <span className="text-[9.5px] text-muted-foreground hidden lg:inline font-mono shrink-0">
                {activeNews.time}
              </span>

              {/* Counter Indicator */}
              <span className="text-[9.5px] font-mono font-medium text-muted-foreground/80 bg-background/70 px-1.5 py-0.5 rounded border border-border/50 hidden xl:inline shrink-0">
                {newsIdx + 1}/{activeNewsList.length}
              </span>

              {/* Prev / Next News Buttons */}
              <div className="flex items-center border border-border/70 rounded-md bg-background/90 overflow-hidden shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setNewsIdx((prev) => (prev - 1 + activeNewsList.length) % activeNewsList.length)}
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={t('nav.prev_news')}
                  title={t('nav.prev_news')}
                >
                  <ChevronLeft className="size-3" />
                </button>
                <div className="w-[1px] h-2.5 bg-border/50" />
                <button
                  type="button"
                  onClick={() => setNewsIdx((prev) => (prev + 1) % activeNewsList.length)}
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={t('nav.next_news')}
                  title={t('nav.next_news')}
                >
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          </div>

          {/* ── User Profile & Action Controls in Top Right Corner ── */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Farmer Profile Pill */}
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg p-1 -m-1 hover:bg-muted/50 transition-colors group cursor-pointer"
              title={t('nav.profile_tooltip')}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold font-display text-xs group-hover:border-primary transition-colors shadow-2xs">
                {(user?.name || 'Farmer').charAt(0)}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                  {user?.name || 'Farmer'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                  {user?.village || user?.district ? (
                    `${user.village ? `${tData('geo', user.village)}, ` : ''}${tData('geo', user.district || user.state || '')}`
                  ) : (
                    'Location Not Set'
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

        {/* Mobile Live News Marquee */}
        <div 
          className="md:hidden w-full bg-gradient-to-r from-primary/10 via-emerald-500/5 to-primary/10 border-b border-primary/20 px-3 py-1.5 flex items-center justify-between gap-2 text-xs cursor-pointer"
          onClick={() => setNewsIdx((prev) => (prev + 1) % activeNewsList.length)}
          title="Click to advance news"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-[10px] text-primary uppercase">{t('nav.news_live')}:</span>
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
          router.push(`/sabha/new?crop=${data.crop}&quantity=${data.quantity}&location=${encodeURIComponent(data.location)}&urgency=${data.urgency}`)
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
