'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  translations,
  translateKey,
  translateCanonical,
} from '@/locales'

export type Language = SupportedLocale

export interface LocaleContextValue {
  language: SupportedLocale
  setLanguage: (language: SupportedLocale) => void
  t: ((path: string, params?: Record<string, string | number>) => string) & (typeof translations)['en']
  tData: (type: 'crop' | 'mandi' | 'geo', canonical: string) => string
  formatCurrency: (val: number) => string
  formatNumber: (val: number) => string
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string
  sarvamLangCode: string
  activeLocaleMeta: (typeof SUPPORTED_LOCALES)[number]
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function applyDocumentLocale(lang: SupportedLocale) {
  if (typeof document === 'undefined') return
  const bcp47 = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN'
  document.documentElement.lang = bcp47
  document.documentElement.dir = 'ltr'

  if (lang === 'hi') {
    document.title = 'मंडी सभा — अपनी फसल का सर्वोत्तम भाव'
  } else if (lang === 'gu') {
    document.title = 'મંડી સભા — તમારા પાકનો શ્રેષ્ઠ ભાવ'
  } else {
    document.title = 'Mandi Sabha — A better price for your harvest'
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLocale>(DEFAULT_LOCALE)

  useEffect(() => {
    // 1. Try localStorage
    let saved: SupportedLocale | null = null
    try {
      saved = localStorage.getItem('mandi-language') as SupportedLocale | null
    } catch {}

    // 2. Try cookie
    if (!saved) {
      const match = document.cookie.match(/(?:^|; )mandi-language=(en|hi|gu)/)
      if (match) saved = match[1] as SupportedLocale
    }

    // 3. Fallback to browser language
    if (!saved && typeof navigator !== 'undefined') {
      const navLang = (navigator.language || '').toLowerCase()
      if (navLang.startsWith('hi')) saved = 'hi'
      else if (navLang.startsWith('gu')) saved = 'gu'
    }

    if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
      setLanguageState(saved)
      applyDocumentLocale(saved)
    } else {
      applyDocumentLocale(DEFAULT_LOCALE)
    }
  }, [])

  const setLanguage = (next: SupportedLocale) => {
    setLanguageState(next)
    try {
      localStorage.setItem('mandi-language', next)
    } catch {}
    document.cookie = `mandi-language=${next}; path=/; max-age=31536000; samesite=lax`
    applyDocumentLocale(next)

    // Sync to user profile if API is accessible
    fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: next }),
    }).catch(() => {})
  }

  const value = useMemo<LocaleContextValue>(() => {
    const meta = SUPPORTED_LOCALES.find((m) => m.code === language) || SUPPORTED_LOCALES[0]

    // Create dual-capability translation function (supports both t('key.path') and legacy t.nav.dashboard)
    const tFn = (path: string, params?: Record<string, string | number>) => {
      return translateKey(language, path, params)
    }
    const rawBundle = (translations[language] || translations[DEFAULT_LOCALE]) as any
    Object.assign(tFn, rawBundle)

    const formatCurrency = (val: number) => {
      const bcp = meta.bcp47
      return new Intl.NumberFormat(bcp, {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        numberingSystem: 'latn',
      }).format(val)
    }

    const formatNumber = (val: number) => {
      return new Intl.NumberFormat(meta.bcp47, {
        numberingSystem: 'latn',
      }).format(val)
    }

    const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      return new Intl.DateTimeFormat(meta.bcp47, {
        dateStyle: 'medium',
        numberingSystem: 'latn',
        ...options,
      }).format(d)
    }

    const formatRelativeTime = (val: number, unit: Intl.RelativeTimeFormatUnit) => {
      return new Intl.RelativeTimeFormat(meta.bcp47, { numeric: 'auto' }).format(val, unit)
    }

    const tData = (type: 'crop' | 'mandi' | 'geo', canonical: string) => {
      return translateCanonical(language, type, canonical)
    }

    return {
      language,
      setLanguage,
      t: tFn as any,
      tData,
      formatCurrency,
      formatNumber,
      formatDate,
      formatRelativeTime,
      sarvamLangCode: meta.sarvamCode,
      activeLocaleMeta: meta,
    }
  }, [language])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}

export const useTranslation = useLocale
