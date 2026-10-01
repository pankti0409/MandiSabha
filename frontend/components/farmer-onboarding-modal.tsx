'use client'

import { useState, useEffect, FormEvent } from 'react'
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Building2,
  Leaf,
  LocateFixed,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { detectUserLocation } from '@/lib/geolocation'
import { cn } from '@/lib/utils'

const INDIAN_STATES = [
  'Maharashtra',
  'Gujarat',
  'Madhya Pradesh',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Bihar',
  'West Bengal',
  'Odisha',
  'Tamil Nadu',
]

export function FarmerOnboardingModal() {
  const { user, updateUser, status } = useAuth()
  const { t, tData } = useLocale()

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [state, setState] = useState('Maharashtra')
  const [mobile, setMobile] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [locFeedback, setLocFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const isCompleted =
        user.onboarded === true ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem(`farmer_onboarding_done_${user.id}`) === 'true' ||
            (user.mobile && localStorage.getItem(`farmer_onboarded_${user.mobile}`) === 'true')))

      // Also check query param ?onboarding=true for testing
      const urlParams = new URLSearchParams(window.location.search)
      const forceOnboarding = urlParams.get('onboarding') === 'true'

      if (forceOnboarding || !isCompleted) {
        setName(user.name && user.name.toLowerCase() !== 'farmer' ? user.name : '')
        setVillage(user.village || '')
        setDistrict(user.district || '')
        setState(user.state || 'Maharashtra')
        setMobile(user.mobile || '')
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    } else {
      setIsOpen(false)
    }
  }, [status, user])

  if (!isOpen) return null

  async function handleDetectLocation() {
    setIsLocating(true)
    setLocFeedback(null)
    try {
      const res = await detectUserLocation()
      if (res.ok) {
        if (res.village) {
          setVillage(res.village)
        } else if (res.district) {
          setVillage(res.district)
        }

        if (res.district) {
          setDistrict(res.district)
        }

        if (res.state) {
          const matched = INDIAN_STATES.find(
            (s) => s.toLowerCase() === res.state.toLowerCase() || res.state.toLowerCase().includes(s.toLowerCase())
          )
          if (matched) {
            setState(matched)
          }
        }

        if (res.lat && res.lon) {
          setCoords([res.lat, res.lon])
        }

        const display = res.village && res.district 
          ? `${res.village}, ${res.district}` 
          : (res.village || res.district || res.formatted)

        setLocFeedback({ 
          type: 'success', 
          message: t('auth.onboarding.loc_detected', { location: display }) || `Detected: ${display}` 
        })
        setTimeout(() => setLocFeedback(null), 5000)
      } else {
        setLocFeedback({ type: 'error', message: res.error })
        setTimeout(() => setLocFeedback(null), 5000)
      }
    } catch {
      setLocFeedback({ type: 'error', message: 'Could not fetch GPS location.' })
      setTimeout(() => setLocFeedback(null), 5000)
    } finally {
      setIsLocating(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError(t('auth.validation.name_required') || 'Please enter your full name.')
      return
    }
    if (!village.trim()) {
      setError(t('auth.validation.village_required') || 'Please enter your city or village.')
      return
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      setError(t('auth.validation.invalid_mobile') || 'Please enter a valid 10-digit phone number.')
      return
    }

    setSaving(true)
    try {
      const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10)
      await updateUser({
        name: name.trim(),
        village: village.trim(),
        district: district.trim() || user?.district || '',
        state: state.trim(),
        mobile: cleanMobile,
        homeLat: coords ? coords[0] : (user as any)?.homeLat,
        homeLon: coords ? coords[1] : (user as any)?.homeLon,
        onboarded: true,
      })

      if (typeof window !== 'undefined') {
        if (user?.id) localStorage.setItem(`farmer_onboarding_done_${user.id}`, 'true')
        localStorage.setItem(`farmer_onboarded_${cleanMobile}`, 'true')
      }

      setIsOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-card rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Glow Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-background border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="size-3 text-emerald-500 animate-pulse" />
              {t('auth.onboarding.kicker')}
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground">
            {t('auth.onboarding.title')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t('auth.onboarding.subtitle')}
          </p>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-6">
          {/* Flashcard Preview (Unstop-style Profile Card) */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-background p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-900/20 text-lg">
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : <Leaf className="size-6 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-foreground leading-tight">
                      {name.trim() || 'Kisan Mitra'}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="size-2.5" /> {t('auth.onboarding.badge_verified')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="size-3 text-emerald-500" />
                    <span>{village.trim() || 'City / Village'}, {state}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3 text-primary" />
                <span>+91 {mobile.trim() || 'XXXXXXXXXX'}</span>
              </div>
              <span className="text-[10px] text-muted-foreground/80">
                Mandi Sabha ID #{user?.id ? user.id.replace('demo-', '').slice(0, 6).toUpperCase() : '7492A'}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Field 1: Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                {t('auth.onboarding.name_label')} <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.onboarding.name_placeholder')}
                className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Field 2 & 3: City/Village and State */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    {t('auth.onboarding.village_label')} <span className="text-primary">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                    title="Auto detect location via GPS"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>{t('auth.onboarding.btn_detecting') || 'Detecting...'}</span>
                      </>
                    ) : (
                      <>
                        <LocateFixed className="size-3" />
                        <span>{t('auth.onboarding.btn_auto_detect') || 'Auto Detect'}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={t('auth.onboarding.village_placeholder')}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    title="Auto detect location via GPS"
                    className="absolute right-2.5 p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <LocateFixed className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  {t('auth.onboarding.state_label')} <span className="text-primary">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {tData('geo', s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {locFeedback && (
              <p
                className={cn(
                  'text-xs font-medium flex items-center gap-1.5 -mt-1 px-1 transition-opacity animate-in fade-in',
                  locFeedback.type === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {locFeedback.type === 'success' ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="size-3.5 shrink-0" />
                )}
                <span>{locFeedback.message}</span>
              </p>
            )}

            {/* Field 4: Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" />
                {t('auth.onboarding.phone_label')} <span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1 text-xs font-mono font-bold text-muted-foreground border-r border-border pr-2">
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('auth.onboarding.phone_placeholder')}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-16 pr-4 font-mono text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              {t('auth.onboarding.card_hint')}
            </p>

            <button
              type="submit"
              disabled={saving}
              className="button-primary min-h-12 w-full justify-center text-sm font-bold shadow-md mt-1 cursor-pointer"
            >
              <span>{saving ? t('auth.onboarding.btn_saving') : t('auth.onboarding.btn_save')}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
