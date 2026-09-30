import { NextRequest, NextResponse } from 'next/server'
import { DemoUser } from '@/lib/api/auth'

const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawSession = request.cookies.get(cookieName)?.value

    let existingUser: DemoUser = {
      id: `demo-${Date.now()}`,
      name: 'Farmer',
      mobile: '9812345678',
      village: 'Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      language: 'en',
      crops: ['Onion'],
      cropDetails: [{ name: 'Onion', acres: 3, harvestMonth: 'April', isPrimary: true }],
      farmSizeAcres: 5,
      transportCostPerKm: 7,
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
