import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config'

// EN
import enCommon from './en/common.json'
import enNav from './en/nav.json'
import enDashboard from './en/dashboard.json'
import enExplore from './en/explore.json'
import enSabha from './en/sabha.json'
import enHistory from './en/history.json'
import enSettings from './en/settings.json'
import enVoice from './en/voice.json'
import enAuth from './en/auth.json'
import enCrops from './en/crops.json'
import enMandis from './en/mandis.json'
import enGeo from './en/geo.json'

// HI
import hiCommon from './hi/common.json'
import hiNav from './hi/nav.json'
import hiDashboard from './hi/dashboard.json'
import hiExplore from './hi/explore.json'
import hiSabha from './hi/sabha.json'
import hiHistory from './hi/history.json'
import hiSettings from './hi/settings.json'
import hiVoice from './hi/voice.json'
import hiAuth from './hi/auth.json'
import hiCrops from './hi/crops.json'
import hiMandis from './hi/mandis.json'
import hiGeo from './hi/geo.json'

// GU
import guCommon from './gu/common.json'
import guNav from './gu/nav.json'
import guDashboard from './gu/dashboard.json'
import guExplore from './gu/explore.json'
import guSabha from './gu/sabha.json'
import guHistory from './gu/history.json'
import guSettings from './gu/settings.json'
import guVoice from './gu/voice.json'
import guAuth from './gu/auth.json'
import guCrops from './gu/crops.json'
import guMandis from './gu/mandis.json'
import guGeo from './gu/geo.json'

export const translations = {
  en: {
    common: enCommon,
    nav: enNav,
    dashboard: enDashboard,
    explore: enExplore,
    sabha: enSabha,
    history: enHistory,
    settings: enSettings,
    voice: enVoice,
    auth: enAuth,
    crops: enCrops,
    mandis: enMandis,
    geo: enGeo,
  },
  hi: {
    common: hiCommon,
    nav: hiNav,
    dashboard: hiDashboard,
    explore: hiExplore,
    sabha: hiSabha,
    history: hiHistory,
    settings: hiSettings,
    voice: hiVoice,
    auth: hiAuth,
    crops: hiCrops,
    mandis: hiMandis,
    geo: hiGeo,
  },
  gu: {
    common: guCommon,
    nav: guNav,
    dashboard: guDashboard,
    explore: guExplore,
    sabha: guSabha,
    history: guHistory,
    settings: guSettings,
    voice: guVoice,
    auth: guAuth,
    crops: guCrops,
    mandis: guMandis,
    geo: guGeo,
  },
} as const

export type LocaleKeyPath = string

/**
 * Resolves a dot-notated key path (e.g. 'dashboard.greeting' or 'common.actions.save')
 * with fallback to English and variable interpolation (e.g. {{name}}).
 */
export function translateKey(
  locale: SupportedLocale,
  path: string,
  params?: Record<string, string | number>
): string {
  const targetBundle = (translations[locale] as any) || translations[DEFAULT_LOCALE]
  const fallbackBundle = translations[DEFAULT_LOCALE]

  let resolved = getDeep(targetBundle, path)
  if (resolved === undefined || resolved === null) {
    resolved = getDeep(fallbackBundle, path)
  }

  if (typeof resolved !== 'string') {
    return path
  }

  if (params) {
    return resolved.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, varName) => {
      return params[varName] !== undefined ? String(params[varName]) : `{{${varName}}}`
    })
  }

  return resolved
}

function getDeep(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }
  return current
}

/**
 * Agmarknet Canonical Data Translator
 * Maps canonical English strings (crop, mandi, state/district) to the active locale without breaking API contracts.
 */
export function translateCanonical(
  locale: SupportedLocale,
  type: 'crop' | 'mandi' | 'geo',
  canonical: string
): string {
  if (!canonical) return canonical
  const trimmed = canonical.trim()

  // Handle compound slash strings like "Soybean / Onion" or "Onion / Tomato"
  if (trimmed.includes('/')) {
    return trimmed
      .split('/')
      .map((part) => translateCanonical(locale, type, part.trim()))
      .join(' / ')
  }

  const dictGroup = type === 'crop' ? 'crops' : type === 'mandi' ? 'mandis' : 'geo'
  const bundle = translations[locale] as any
  const dict = bundle?.[dictGroup]
  if (dict && dict[trimmed]) {
    return dict[trimmed]
  }

  // Cross-lookup between mandi and geo (e.g. city name used as mandi, or vice-versa)
  if (type === 'mandi' && bundle?.geo && bundle.geo[trimmed]) {
    return bundle.geo[trimmed]
  }
  if (type === 'geo' && bundle?.mandis && bundle.mandis[trimmed]) {
    return bundle.mandis[trimmed]
  }

  // Try fallback in English or return trimmed canonical as-is
  const fallbackBundle = translations[DEFAULT_LOCALE] as any
  const fallbackDict = fallbackBundle?.[dictGroup]
  if (fallbackDict?.[trimmed]) {
    return fallbackDict[trimmed]
  }
  if (type === 'mandi' && fallbackBundle?.geo && fallbackBundle.geo[trimmed]) {
    return fallbackBundle.geo[trimmed]
  }

  return trimmed
}

export * from './config'
