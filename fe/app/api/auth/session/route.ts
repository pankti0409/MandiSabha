import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const value = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
  if (!value) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  try { return NextResponse.json({ user: JSON.parse(decodeURIComponent(value)) }) } catch { return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 }) }
}
