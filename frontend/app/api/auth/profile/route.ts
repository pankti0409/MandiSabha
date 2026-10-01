import { NextRequest, NextResponse } from 'next/server'
import { DemoUser } from '@/lib/api/auth'

const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawSession = request.cookies.get(cookieName)?.value

    let existingUser: DemoUser = {
      id: `usr-${Date.now()}`,
      name: 'Farmer',
      mobile: '',
      village: '',
      district: '',
      state: '',
      language: 'en',
      crops: [],
      cropDetails: [],
      farmSizeAcres: 0,
      transportCostPerKm: 14,
      vehicleType: 'pickup',
      priceAlerts: true,
      weatherAlerts: true,
    }

    if (rawSession) {
      try {
        existingUser = JSON.parse(decodeURIComponent(rawSession))
      } catch {}
    }

    const updatedUser: DemoUser = {
      ...existingUser,
      ...body,
      onboarded: true,
      crops: Array.isArray(body.crops)
        ? body.crops
        : existingUser.crops || (body.cropDetails ? body.cropDetails.map((c: any) => c.name) : ['Onion']),
    }

    const response = NextResponse.json({ success: true, user: updatedUser })
    response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(updatedUser)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    )
  }
}
