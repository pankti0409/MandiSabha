import { NextResponse } from 'next/server'
import { mobileSchema, otpSchema } from '@/lib/api/auth'
const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10)
  if (!mobileSchema.safeParse(mobile).success || !otpSchema.safeParse(String(body.otp || '')).success) return NextResponse.json({ message: 'Please check your number and code.' }, { status: 400 })
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false' && !body.token) return NextResponse.json({ message: 'Backend authentication is not configured.' }, { status: 503 })
  if (String(body.otp) !== '123456') return NextResponse.json({ message: 'That code does not match. Try again.' }, { status: 401 })
  const profile = body.profile || {}
  const user = { id: `demo-${mobile}`, name: profile.name || 'Farmer', mobile, village: profile.village || 'Nashik', district: profile.district || 'Nashik', language: profile.language || 'en', crops: profile.crops || ['Onion'] }
  const response = NextResponse.json({ user })
  response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(user)), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return response
}
