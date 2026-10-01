export interface LocaleMeta {
  code: 'en' | 'hi' | 'gu'
  name: string
  nativeName: string
  script: 'Latn' | 'Deva' | 'Gujr'
  bcp47: string
  sarvamCode: string
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latn', bcp47: 'en-IN', sarvamCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Deva', bcp47: 'hi-IN', sarvamCode: 'hi-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujr', bcp47: 'gu-IN', sarvamCode: 'gu-IN' },
]

export type SupportedLocale = 'en' | 'hi' | 'gu'
export const DEFAULT_LOCALE: SupportedLocale = 'en'
