'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from '@/locales/en'
import hi from '@/locales/hi'
import gu from '@/locales/gu'

type Language = 'en' | 'hi' | 'gu'
type Messages = typeof en
const messages = { en, hi, gu } as const

type LocaleContextValue = { language: Language; setLanguage: (language: Language) => void; t: Messages }
const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )mandi-language=(en|hi|gu)/)?.[1] as Language | undefined
    if (saved) setLanguageState(saved)
  }, [])
  const setLanguage = (next: Language) => {
    setLanguageState(next)
    document.cookie = `mandi-language=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next === 'hi' ? 'hi-IN' : next === 'gu' ? 'gu-IN' : 'en-IN'
  }
  const value = useMemo(() => ({ language, setLanguage, t: messages[language] as Messages }), [language])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}

export type { Language }
