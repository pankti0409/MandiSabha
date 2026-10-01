import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID is not configured in .env.local' }, { status: 500 })
  }

  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const redirectUri = `${protocol}://${host}/api/auth/callback/google`

  const next = request.nextUrl.searchParams.get('next') || '/dashboard'

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('access_type', 'online')
  googleAuthUrl.searchParams.set('prompt', 'select_account')
  googleAuthUrl.searchParams.set('state', encodeURIComponent(next))

  return NextResponse.redirect(googleAuthUrl.toString())
}
