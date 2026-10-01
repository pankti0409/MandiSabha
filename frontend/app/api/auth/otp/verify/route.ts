import { NextRequest, NextResponse } from 'next/server'
import { mobileSchema, otpSchema, DemoUser } from '@/lib/api/auth'

const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10)

  if (!mobileSchema.safeParse(mobile).success || !otpSchema.safeParse(String(body.otp || '')).success) {
    return NextResponse.json({ message: 'Please check your number and code.' }, { status: 400 })
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false' && !body.token) {
    return NextResponse.json({ message: 'Backend authentication is not configured.' }, { status: 503 })
  }

  if (String(body.otp) !== '123456') {
    return NextResponse.json({ message: 'That code does not match. Try again.' }, { status: 401 })
  }

  const rawSession = request.cookies.get(cookieName)?.value
  let existingUser: Partial<DemoUser> | null = null
  if (rawSession) {
    try {
      existingUser = JSON.parse(decodeURIComponent(rawSession))
    } catch {}
  }

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
    id: existingUser?.id || `demo-${mobile}`,
    name: profile.name || (wasAlreadyOnboarded ? existingUser!.name : ''),
    mobile,
    village: profile.village || (wasAlreadyOnboarded ? existingUser!.village : ''),
    district: profile.district || (wasAlreadyOnboarded ? existingUser!.district : ''),
    state: profile.state || (wasAlreadyOnboarded ? existingUser!.state : 'Maharashtra'),
    language: profile.language || existingUser?.language || 'en',
    crops: profile.crops || existingUser?.crops || ['Onion', 'Wheat'],
    onboarded: hasProfile || wasAlreadyOnboarded,
  }

  const response = NextResponse.json({ user })
  response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(user)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
