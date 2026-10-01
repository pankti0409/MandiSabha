import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const value = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
  if (!value) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  try {
    const cookieUser = JSON.parse(decodeURIComponent(value))
    if (cookieUser?.mobile || cookieUser?.id) {
      try {
        const { getUserFromDb, saveUserToDb } = await import('@/lib/db')

        // 1. Try to load existing DB record
        const identifier = cookieUser.mobile || cookieUser.id
        let dbUser = await getUserFromDb(identifier)

        // 2. If not in DB yet, persist from cookie (happens after first OTP login before onboarding)
        if (!dbUser && cookieUser.mobile) {
          console.log('[Session] User not in DB, auto-seeding from cookie:', identifier)
          dbUser = await saveUserToDb({
            id: cookieUser.id || `usr-${String(cookieUser.mobile).replace(/\D/g, '').slice(-10)}`,
            mobile: cookieUser.mobile,
            name: cookieUser.name || 'Farmer',
            village: cookieUser.village || '',
            district: cookieUser.district || '',
            state: cookieUser.state || '',
            language: cookieUser.language || 'en',
            crops: cookieUser.crops || [],
            cropDetails: cookieUser.cropDetails || [],
            farmSizeAcres: cookieUser.farmSizeAcres,
            transportCostPerKm: cookieUser.transportCostPerKm,
            vehicleType: cookieUser.vehicleType,
            priceAlerts: cookieUser.priceAlerts,
            weatherAlerts: cookieUser.weatherAlerts,
            primaryMandi: cookieUser.primaryMandi,
            email: cookieUser.email,
            avatar: cookieUser.avatar,
          })
        }

        if (dbUser) return NextResponse.json({ user: dbUser })
      } catch (err) {
        console.warn('[DB] Session DB lookup failed, falling back to cookie:', err)
      }
    }
    return NextResponse.json({ user: cookieUser })
  } catch {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  }
}
