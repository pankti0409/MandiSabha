import { NextRequest, NextResponse } from 'next/server'
import { mobileSchema, otpSchema, DemoUser } from '@/lib/api/auth'
import { verifyOtpChallenge } from '@/lib/sms-gate'

const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10)
    const otp = String(body.otp || '').trim()

    if (!mobileSchema.safeParse(mobile).success || !otpSchema.safeParse(otp).success) {
      return NextResponse.json({ message: 'Please check your mobile number and 6-digit code.' }, { status: 400 })
    }

    // Read the challenge token from the secure cookie
    const challengeToken = request.cookies.get('mandi_otp_challenge')?.value || ''

    // Verify OTP against the challenge signature
    const isValid = verifyOtpChallenge(mobile, otp, challengeToken)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code. Please check SMS on your phone or request a new code.' },
        { status: 401 }
      )
    }

    // ── Step 1: Check the DATABASE first for a returning user ─────────────
    // This is the primary source of truth — cookie is just a fallback for new users
    let dbExistingUser: Partial<DemoUser> | null = null
    try {
      const { getUserFromDb } = await import('@/lib/db')
      dbExistingUser = await getUserFromDb(mobile)
      if (dbExistingUser) {
        console.log('[OTP] Returning user found in DB:', mobile, dbExistingUser.name)
      }
    } catch (dbErr) {
      console.warn('[OTP] DB lookup failed, will fall back to cookie:', dbErr)
    }

    // ── Step 2: Cookie fallback (new users or DB-miss) ────────────────────
    const rawSession = request.cookies.get(cookieName)?.value
    let cookieUser: Partial<DemoUser> | null = null
    if (rawSession) {
      try { cookieUser = JSON.parse(decodeURIComponent(rawSession)) } catch {}
    }

    // Merge priority: DB profile > cookie > submitted profile body > defaults
    const existingUser = dbExistingUser || cookieUser

    const profile = body.profile || {}
    const hasProfile = Boolean(profile.name && profile.name.trim() !== '' && profile.village && profile.village.trim() !== '')
    const wasAlreadyOnboarded = Boolean(
      existingUser?.onboarded === true &&
      existingUser?.name &&
      existingUser.name.trim() !== '' &&
      existingUser.name.toLowerCase() !== 'farmer' &&
      existingUser?.village &&
      existingUser.village.trim() !== ''
    )

    const user: DemoUser = {
      id: existingUser?.id || `usr-${mobile}`,
      name: profile.name || (wasAlreadyOnboarded ? existingUser!.name! : (dbExistingUser?.name && dbExistingUser.name !== 'Farmer' ? dbExistingUser.name : 'Farmer')),
      mobile,
      village: profile.village || existingUser?.village || '',
      district: profile.district || existingUser?.district || '',
      state: profile.state || existingUser?.state || '',
      language: profile.language || existingUser?.language || 'en',
      crops: profile.crops || existingUser?.crops || [],
      cropDetails: profile.cropDetails || existingUser?.cropDetails,
      farmSizeAcres: profile.farmSizeAcres || existingUser?.farmSizeAcres,
      transportCostPerKm: profile.transportCostPerKm || existingUser?.transportCostPerKm,
      vehicleType: profile.vehicleType || existingUser?.vehicleType,
      priceAlerts: profile.priceAlerts ?? existingUser?.priceAlerts,
      weatherAlerts: profile.weatherAlerts ?? existingUser?.weatherAlerts,
      primaryMandi: profile.primaryMandi || existingUser?.primaryMandi,
      email: profile.email || existingUser?.email,
      avatar: profile.avatar || existingUser?.avatar,
      onboarded: hasProfile || wasAlreadyOnboarded || Boolean(dbExistingUser?.onboarded),
    }

    // Persist user record in SQLite database
    let persistedUser = user
    try {
      const { saveUserToDb } = await import('@/lib/db')
      persistedUser = await saveUserToDb(user)
    } catch (dbErr) {
      console.error('[DB] Failed to save user to SQLite:', dbErr)
    }

    const response = NextResponse.json({ user: persistedUser, success: true })

    // Set persistent session cookie (30 days)
    response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(persistedUser)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    // Clear the one-time challenge cookie
    response.cookies.delete('mandi_otp_challenge')

    return response
  } catch (err: any) {
    console.error('OTP verification error:', err)
    return NextResponse.json(
      { message: 'Verification error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
