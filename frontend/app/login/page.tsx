'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, ShieldCheck, Sparkles, Smartphone, KeyRound, Leaf } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { mobileSchema } from '@/lib/api/auth'
import { GoogleSignInButton } from '@/components/google-sign-in-button'

function LoginForm() {
  const router = useRouter()
  const { t } = useLocale()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const queryError = params.get('error')
  const { requestOtp, verifyOtp } = useAuth()

  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
  const [error, setError] = useState(
    queryError
      ? queryError === 'missing_google_credentials'
        ? 'Google credentials are not configured in .env.local.'
        : queryError === 'access_denied'
        ? 'Google Sign-In was cancelled.'
        : 'Google Sign-In failed. Please try again or use mobile OTP.'
      : ''
  )
  const [busy, setBusy] = useState(false)

  async function send(e: FormEvent) {
    e.preventDefault()
    const clean = mobile.replace(/\D/g, '').slice(-10)
    if (!mobileSchema.safeParse(clean).success) {
      return setError(t('auth.validation.invalid_mobile'))
    }
    setBusy(true)
    setError('')
    try {
      await requestOtp(clean)
      setMobile(clean)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login.btn_sending'))
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await verifyOtp(mobile, otp)
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.validation.invalid_otp'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground group">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
              <Leaf className="size-5" />
            </span>
            <span>Mandi Sabha</span>
          </Link>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-mono font-bold text-muted-foreground">
            Agri AI Platform
          </span>
        </div>

        {/* Minimalist Card Container */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="mb-6">
            <span className="section-kicker">Mandi Sabha</span>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {step === 'mobile' ? t('auth.login.title') : t('auth.login.otp_title')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {step === 'mobile'
                ? t('auth.login.subtitle')
                : t('auth.login.otp_subtitle', { mobile })}
            </p>
          </div>

          {step === 'mobile' ? (
            <div className="flex flex-col gap-5">
              <GoogleSignInButton text={t('auth.login.google_signin')} />

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Or continue with phone
                </span>
              </div>

              <form onSubmit={send} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-mobile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('auth.login.mobile_label')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground border-r border-border pr-2.5">
                    <span>+91</span>
                  </div>
                  <input
                    id="login-mobile"
                    autoFocus
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={t('auth.login.mobile_placeholder')}
                    className="h-12 w-full rounded-xl border border-border bg-background pl-16 pr-4 font-mono text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Terms and Privacy Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary accent-[var(--primary)] cursor-pointer"
                />
                <span>
                  {t('auth.agree_terms', {
                    terms: '',
                    privacy: ''
                  }).split(/\{\{.*?\}\}/)[0] || 'I agree to the '}
                  <Link href="/terms" target="_blank" className="font-semibold text-foreground underline hover:text-primary">
                    {t('auth.terms_link')}
                  </Link>{' '}
                  &{' '}
                  <Link href="/privacy" target="_blank" className="font-semibold text-foreground underline hover:text-primary">
                    {t('auth.privacy_link')}
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={busy || mobile.length < 10 || !agreedToTerms}
                className="button-primary min-h-12 w-full justify-center text-sm font-bold shadow-sm disabled:opacity-50"
              >
                <span>{busy ? t('auth.login.btn_sending') : t('auth.login.btn_continue')}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        ) : (
            <form onSubmit={verify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('auth.login.otp_title')}
                  </label>
                </div>
                <input
                  id="login-otp"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="h-14 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-2xl tracking-[0.35em] font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="button-primary min-h-12 w-full justify-center text-sm font-bold shadow-sm disabled:opacity-50"
              >
                <span>{busy ? t('auth.login.btn_sending') : t('auth.login.btn_verify')}</span>
                <Check className="size-4" />
              </button>

              <button
                type="button"
                className="flex min-h-10 items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setStep('mobile')
                  setOtp('')
                }}
              >
                <ChevronLeft className="size-3.5" />
                <span>{t('auth.login.btn_change')}</span>
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
            {t('auth.login.no_account')}{' '}
            <Link className="font-bold text-primary hover:underline ml-1" href="/signup">
              {t('auth.login.link_signup')}
            </Link>
          </div>
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Encrypted APMC verified login</span>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}
