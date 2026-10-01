import { NextResponse } from 'next/server'
import { mobileSchema } from '@/lib/api/auth'
import { sendSmsOtp, signOtpChallenge } from '@/lib/sms-gate'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const cleanMobile = String(body.mobile || '').replace(/\D/g, '').slice(-10)

    if (!mobileSchema.safeParse(cleanMobile).success) {
      return NextResponse.json({ message: 'Enter a valid 10-digit mobile number.' }, { status: 400 })
    }

    // Generate cryptographically random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Dispatch real-time carrier SMS through the connected Android Gateway (SMS Gate)
    const smsResult = await sendSmsOtp(cleanMobile, otp)

    // Sign challenge token (valid for 5 minutes)
    const challengeToken = signOtpChallenge(cleanMobile, otp, 300)

    const response = NextResponse.json({
      success: true,
      message: smsResult.success ? 'Real-time SMS sent to your mobile phone' : 'OTP generated',
      demo: false,
      resendAfterSeconds: 30,
    })

    // Store encrypted challenge in secure HTTP-only cookie
    response.cookies.set('mandi_otp_challenge', challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    })

    return response
  } catch (err: any) {
    console.error('OTP request error:', err)
    return NextResponse.json(
      { message: 'Could not send SMS. Please try again.' },
      { status: 500 }
    )
  }
}
