import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
    let userId: string | undefined = undefined
    if (sessionCookie) {
      try {
        const u = JSON.parse(decodeURIComponent(sessionCookie))
        userId = u.id || `usr-${u.mobile}`
      } catch {}
    }

    const { getUserDashboardStats } = await import('@/lib/db')
    const stats = await getUserDashboardStats(userId)

    return NextResponse.json({ success: true, ...stats })
  } catch (err: any) {
    console.error('[API/DASHBOARD] Error computing dashboard stats from DB:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to compute dashboard stats' }, { status: 500 })
  }
}
