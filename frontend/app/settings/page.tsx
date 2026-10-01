'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronDown, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { Crop } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'

interface DropdownOption<T extends string> {
  value: T
  label: string
}

function CustomSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: DropdownOption<T>[]
  onChange: (val: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside)
      return () => document.removeEventListener('mousedown', handleOutside)
    }
  }, [open])

  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-normal outline-none focus:outline-none focus-visible:outline-none transition-colors select-none"
      >
        <span>{selected?.label}</span>
        <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[140px] rounded-xl border border-border/80 bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer',
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/60 font-normal'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="size-3 text-primary stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const AVAILABLE_CROPS: Crop[] = [
  'Cotton', 'Wheat', 'Onion', 'Soybean', 'Tomato', 'Potato', 'Garlic', 'Mustard', 'Maize'
]

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { language, setLanguage, t, tData } = useLocale()

  // Profile fields
  const [name, setName] = useState(user?.name || 'Pankti')
  const [village, setVillage] = useState(
    user?.village && user.village.includes(',')
      ? user.village.split(',')[0].trim()
      : user?.village || 'Surat'
  )
  const [stateName, setStateName] = useState(
    user?.state ||
    (user?.village && user.village.includes(',')
      ? user.village.split(',')[1].trim()
      : user?.district || 'Gujarat')
  )
  const [mobile, setMobile] = useState(user?.mobile || '9876543210')
  const [saving, setSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Appearance & preferences
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  const [notifications, setNotifications] = useState<'on' | 'off'>('on')
  const [selectedCrops, setSelectedCrops] = useState<Crop[]>(['Cotton', 'Wheat'])
  const [transportRate, setTransportRate] = useState('4.20')
  const [dataSaver, setDataSaver] = useState<'off' | 'on'>('off')

  // Modals
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)

  // Sync state from user object if available
  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.village) {
      if (user.village.includes(',') && !user.state) {
        const parts = user.village.split(',').map((p) => p.trim())
        setVillage(parts[0] || user.village)
        if (parts[1]) setStateName(parts[1])
      } else {
        setVillage(user.village)
      }
    }
    if (user?.mobile) {
      setMobile(user.mobile)
    }
    if (user?.state) {
      setStateName(user.state)
    } else if (user?.district && !user?.village?.includes(',')) {
      setStateName(user.district)
    }
    if (user?.crops && user.crops.length > 0) {
      const valid = user.crops.filter((c): c is Crop => AVAILABLE_CROPS.includes(c as Crop))
      if (valid.length > 0) setSelectedCrops(valid)
    }
    if (user?.transportCostPerKm) {
      setTransportRate(user.transportCostPerKm.toFixed(2))
    }
  }, [user])

  // Theme detection
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    const cookieTheme = document.cookie.match(/(?:^|; )mandi-theme=(light|dark)/)?.[1]
    if (cookieTheme) {
      setTheme(cookieTheme as any)
    } else {
      setTheme('system')
    }
  }, [])

  function handleThemeChange(nextTheme: 'system' | 'light' | 'dark') {
    setTheme(nextTheme)
    if (nextTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
      document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light'
      document.cookie = 'mandi-theme=; path=/; max-age=0'
    } else {
      const isDark = nextTheme === 'dark'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.style.colorScheme = nextTheme
      document.cookie = `mandi-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`
    }
    triggerSave()
  }

  function triggerSave() {
    setSavedIndicator(true)
    setTimeout(() => setSavedIndicator(false), 2000)
  }

  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updateUser({
        name: name.trim(),
        village: village.trim(),
        state: stateName.trim(),
        district: stateName.trim(),
        mobile: mobile.replace(/\D/g, '').slice(0, 10),
      })
      setProfileSaved(true)
      triggerSave()
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  function toggleCrop(crop: Crop) {
    let next: Crop[]
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length === 1) return // Keep at least one
      next = selectedCrops.filter((c) => c !== crop)
    } else {
      next = [...selectedCrops, crop]
    }
    setSelectedCrops(next)
    updateUser({ crops: next }).catch(() => {})
    triggerSave()
  }

  const cropsLabel = selectedCrops.map((c) => tData('crop', c)).join(', ') || `${tData('crop', 'Cotton')}, ${tData('crop', 'Wheat')}`

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-2 sm:py-6">
        {/* ── Top Kicker & Title ────────────────────────────────────────── */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
              {t('settings.kicker')}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
              {t('settings.title')}
            </h1>
          </div>

          {savedIndicator && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1 mt-1">
              <Check className="size-3.5" /> {t('settings.saved')}
            </span>
          )}
        </div>

        {/* ── Settings Cards Stack ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Card 1: Profile */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
            <h2 className="text-xs font-semibold text-foreground mb-3.5">
              {t('settings.profile.title')}
            </h2>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
              <div>
                <label 
                  htmlFor="profile-name" 
                  className="text-[11px] font-medium text-foreground block mb-1.5"
                >
                  {t('settings.profile.name_label')}
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-muted/40 border border-transparent focus:border-primary/40 focus:bg-background px-3 py-2 text-xs font-normal text-foreground outline-none transition-all placeholder:text-muted-foreground/60"
                  placeholder={t('settings.profile.name_placeholder')}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-phone" 
                  className="text-[11px] font-medium text-foreground block mb-1.5"
                >
                  {t('settings.profile.phone_label')}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-muted-foreground font-mono select-none pointer-events-none">
                    +91
                  </span>
                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-lg bg-muted/40 border border-transparent focus:border-primary/40 focus:bg-background pl-11 pr-3 py-2 text-xs font-mono text-foreground outline-none transition-all placeholder:text-muted-foreground/60"
                    placeholder={t('settings.profile.phone_placeholder')}
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="profile-village" 
                  className="text-[11px] font-medium text-foreground block mb-1.5"
                >
                  {t('settings.profile.village_label')}
                </label>
                <input
                  id="profile-village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full rounded-lg bg-muted/40 border border-transparent focus:border-primary/40 focus:bg-background px-3 py-2 text-xs font-normal text-foreground outline-none transition-all placeholder:text-muted-foreground/60"
                  placeholder={t('settings.profile.village_placeholder')}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-state" 
                  className="text-[11px] font-medium text-foreground block mb-1.5"
                >
                  {t('settings.profile.state_label')}
                </label>
                <input
                  id="profile-state"
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full rounded-lg bg-muted/40 border border-transparent focus:border-primary/40 focus:bg-background px-3 py-2 text-xs font-normal text-foreground outline-none transition-all placeholder:text-muted-foreground/60"
                  placeholder={t('settings.profile.state_placeholder')}
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="button-primary !min-h-[32px] !px-4 text-xs font-semibold rounded-lg shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? t('settings.profile.saving_btn') : t('settings.profile.save_btn')}
                </button>

                {profileSaved && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
                    <Check className="size-3.5 stroke-[2.5]" /> {t('settings.profile.saved_success')}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Card 2: Language & appearance */}
          <section className="rounded-2xl border border-border/80 bg-card px-5 py-2 shadow-2xs">
            <h2 className="text-xs font-semibold text-foreground pt-3 pb-1">
              {t('settings.appearance.title')}
            </h2>

            <div className="divide-y divide-border/60">
              {/* Language */}
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('settings.appearance.language')}</span>
                <CustomSelect
                  value={language}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'हिन्दी (Hindi)' },
                    { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
                  ]}
                  onChange={(val) => {
                    setLanguage(val as any)
                    triggerSave()
                  }}
                />
              </div>

              {/* Theme */}
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('settings.appearance.theme')}</span>
                <CustomSelect
                  value={theme}
                  options={[
                    { value: 'system', label: t('settings.appearance.theme_system') },
                    { value: 'light', label: t('settings.appearance.theme_light') },
                    { value: 'dark', label: t('settings.appearance.theme_dark') },
                  ]}
                  onChange={(val) => handleThemeChange(val as any)}
                />
              </div>

              {/* Notifications */}
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('settings.appearance.notifications')}</span>
                <CustomSelect
                  value={notifications}
                  options={[
                    { value: 'on', label: t('settings.appearance.on') },
                    { value: 'off', label: t('settings.appearance.off') },
                  ]}
                  onChange={(val) => {
                    setNotifications(val as any)
                    triggerSave()
                  }}
                />
              </div>
            </div>
          </section>

          {/* Card 3: Selling preferences */}
          <section className="rounded-2xl border border-border/80 bg-card px-5 py-2 shadow-2xs">
            <h2 className="text-xs font-semibold text-foreground pt-3 pb-1">
              {t('settings.selling.title')}
            </h2>

            <div className="divide-y divide-border/60">
              {/* Default crops */}
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('settings.selling.default_crops')}</span>
                <button
                  type="button"
                  onClick={() => setCropModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-normal"
                >
                  <span className="max-w-[200px] sm:max-w-xs truncate">{cropsLabel}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                </button>
              </div>

              {/* Transport cost */}
              <div className="py-3 flex items-center justify-between text-xs">
                <div className="pr-4">
                  <span className="font-medium text-foreground block">{t('settings.selling.transport_cost')}</span>
                  <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                    {t('settings.selling.transport_sub')}
                  </span>
                </div>
                <CustomSelect
                  value={transportRate}
                  options={[
                    { value: '3.50', label: '₹3.50 / km' },
                    { value: '4.20', label: '₹4.20 / km' },
                    { value: '5.00', label: '₹5.00 / km' },
                    { value: '6.50', label: '₹6.50 / km' },
                    { value: '8.00', label: '₹8.00 / km' },
                    { value: '10.00', label: '₹10.00 / km' },
                  ]}
                  onChange={(val) => {
                    setTransportRate(val)
                    updateUser({ transportCostPerKm: parseFloat(val) || 4.2 }).catch(() => {})
                    triggerSave()
                  }}
                />
              </div>

              {/* Data saver */}
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('settings.selling.data_saver')}</span>
                <CustomSelect
                  value={dataSaver}
                  options={[
                    { value: 'off', label: t('settings.appearance.off') },
                    { value: 'on', label: t('settings.appearance.on') },
                  ]}
                  onChange={(val) => {
                    setDataSaver(val as any)
                    triggerSave()
                  }}
                />
              </div>
            </div>
          </section>

          {/* Card 4: Account */}
          <section className="rounded-2xl border border-border/80 bg-card px-5 py-2 shadow-2xs">
            <h2 className="text-xs font-semibold text-foreground pt-3 pb-1">
              {t('settings.account.title')}
            </h2>

            <div className="py-3 flex items-center justify-between text-xs">
              <div className="pr-4">
                <span className="font-medium text-foreground block">{t('settings.account.delete_label')}</span>
                <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                  {t('settings.account.delete_sub')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs font-normal text-red-600 dark:text-red-400 hover:underline cursor-pointer shrink-0"
              >
                {t('settings.account.delete_btn')}
              </button>
            </div>
          </section>
        </div>

        {/* ── Crop Selection Modal ───────────────────────────────────────── */}
        {cropModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <h3 className="text-xs font-semibold text-foreground">{t('settings.modals.crops_title')}</h3>
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="py-3 grid grid-cols-2 gap-2">
                {AVAILABLE_CROPS.map((crop) => {
                  const isSelected = selectedCrops.includes(crop)
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left',
                        isSelected
                          ? 'border-primary/40 bg-primary/10 text-primary font-semibold'
                          : 'border-border/70 bg-background/50 text-foreground hover:bg-muted/40'
                      )}
                    >
                      <span>{tData('crop', crop)}</span>
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </button>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-border/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="button-primary !min-h-[34px] !px-4 text-xs font-semibold"
                >
                  {t('settings.modals.crops_done')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Account Modal ───────────────────────────────────────── */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <AlertTriangle className="size-4" />
                <h3 className="text-xs font-semibold text-foreground">{t('settings.modals.delete_title')}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {t('settings.modals.delete_warning')}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  {t('settings.modals.cancel')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout()
                    window.location.href = '/'
                  }}
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs cursor-pointer transition-colors"
                >
                  {t('settings.modals.confirm_delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
