import { NextResponse } from 'next/server'
export async function POST() { const response = NextResponse.json({ ok: true }); response.cookies.set(process.env.AUTH_COOKIE_NAME || 'mandi_session', '', { httpOnly: true, expires: new Date(0), path: '/' }); return response }
