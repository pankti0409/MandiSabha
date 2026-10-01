import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id, draft, recommendation, status, userStatus } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Sabha ID is required' }, { status: 400 })
    }

    // Determine current user from cookie if available
    let userId = body.userId
    const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
    if (!userId && sessionCookie) {
      try {
        const u = JSON.parse(decodeURIComponent(sessionCookie))
        userId = u.id || `usr-${u.mobile}`
      } catch {}
    }

    const { saveSabhaToDb } = await import('@/lib/db')
    const saved = await saveSabhaToDb({
      id,
      userId,
      draft: draft || body,
      recommendation,
      status: status || 'completed',
      userStatus: userStatus || 'none',
    })

    return NextResponse.json({ success: true, sabha: saved })
  } catch (err: any) {
    console.error('[API/SABHA] Error saving sabha to DB:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to save sabha' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')

    // If userId not provided in query, attempt to read from session cookie
    if (!userId) {
      const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
      if (sessionCookie) {
        try {
          const u = JSON.parse(decodeURIComponent(sessionCookie))
          userId = u.id || `usr-${u.mobile}`
        } catch {}
      }
    }

    const { getSabhasForUserFromDb } = await import('@/lib/db')
    const list = await getSabhasForUserFromDb(userId || undefined, 100)

    return NextResponse.json({ success: true, sabhas: list })
  } catch (err: any) {
    console.error('[API/SABHA] Error fetching sabhas from DB:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch sabhas' }, { status: 500 })
  }
}
