'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, ShieldCheck, Sparkles, UserCheck, Leaf } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { GoogleSignInButton } from '@/components/google-sign-in-button'

export default function SignupPage() {
  const router = useRouter()
  const { requestOtp, verifyOtp } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('Nashik')
  const [state, setState] = useState('Maharashtra')
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>('en')
  const [crops, setCrops] = useState<string[]>(['Onion', 'Wheat'])
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const availableCrops = ['Onion', 'Wheat', 'Soybean', 'Cotton', 'Tomato', 'Garlic', 'Mustard', 'Maize']

  function toggleCrop(crop: string) {
    if (crops.includes(crop)) {
      if (crops.length <= 1) return
      setCrops(crops.filter((c) => c !== crop))
    } else {
      setCrops([...crops, crop])
    }
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter your full name.')
    if (!mobile.match(/^[6-9]\d{9}$/)) return setError('Please enter a valid 10-digit mobile number.')
    if (!village.trim()) return setError('Please enter your village/town.')
    if (!crops.length) return setError('Please select at least one crop that you grow.')

    setBusy(true)
    setError('')
    try {
      await requestOtp(mobile)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send code')
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await verifyOtp(mobile, otp, {
        name,
        mobile,
        village,
        district,
        state,
        language,
        crops,
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code does not match. Try 123456.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground group">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
              <Leaf className="size-5" />
            </span>
            <span>Mandi Sabha</span>
          </Link>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-mono font-bold text-muted-foreground">
            Step {step} of 2
          </span>
        </div>

        {/* Minimalist Card Container */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Progress Indicator */}
          <div className="mb-6 flex items-center gap-2">
            <span className="h-1.5 flex-1 rounded-full bg-primary" />
            <span className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-border'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={submitProfile} className="flex flex-col gap-4">
              <div>
                <span className="section-kicker">Account Setup</span>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                  Let’s set up your profile.
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Personalize your dashboard with your local village and the commodities you harvest.
                </p>
              </div>

              <GoogleSignInButton text="Sign up with Google" />

              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Or register with details
                </span>
              </div>

              {/* Name and Mobile */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    id="name-input"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mobile-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mobile Number
                  </label>
                  <input
                    id="mobile-input"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 font-mono text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="village-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Village / Tehsil
                  </label>
                  <input
                    id="village-input"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Pimpalgaon"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="district-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    District
                  </label>
                  <input
                    id="district-input"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Nashik"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Crops Selection */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Leaf className="size-3.5 text-primary" />
                    What do you grow or sell?
                  </label>
                  <span className="text-[11px] font-mono text-primary font-bold">{crops.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCrops.map((cropName) => {
                    const isSelected = crops.includes(cropName)
                    return (
                      <button
                        type="button"
                        key={cropName}
                        onClick={() => toggleCrop(cropName)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {cropName}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="button-primary min-h-12 w-full justify-center text-sm font-bold shadow-sm mt-2 disabled:opacity-50"
              >
                <span>{busy ? 'Sending OTP…' : 'Continue to Verification'}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="flex flex-col gap-4">
              <div>
                <span className="section-kicker">Step 2 of 2</span>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                  Verify your number.
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the 6-digit one-time code sent to +91 {mobile}.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="signup-otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="text-[11px] font-mono font-bold text-primary hover:underline cursor-pointer"
                  >
                    Use Demo Code (123456)
                  </button>
                </div>
                <input
                  id="signup-otp"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="h-14 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-2xl tracking-[0.35em] font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="button-primary min-h-12 w-full justify-center text-sm font-bold shadow-sm disabled:opacity-50"
              >
                <span>{busy ? 'Setting up…' : 'Verify & Launch Dashboard'}</span>
                <Check className="size-4" />
              </button>

              <button
                type="button"
                className="flex min-h-10 items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="size-3.5" />
                <span>Back to profile details</span>
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link className="font-bold text-primary hover:underline ml-1" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
