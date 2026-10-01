import { NextRequest, NextResponse } from 'next/server'

const cookieName = process.env.AUTH_COOKIE_NAME || 'mandi_session'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const next = state ? decodeURIComponent(state) : '/dashboard'

  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const redirectUri = `${protocol}://${host}/api/auth/callback/google`

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!code) {
    const error = request.nextUrl.searchParams.get('error') || 'no_code'
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url))
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=missing_google_credentials', request.url))
  }

  try {
    // 1. Exchange code for access token with Google OAuth
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('Google token exchange error:', errText)
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    // 2. Fetch user information from Google UserInfo endpoint
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userinfoResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url))
    }

    const googleUser = await userinfoResponse.json()

    // 3. Look up existing user profile or create a new one
    let user: any = {
      id: `google-${googleUser.sub}`,
      name: googleUser.name || 'Farmer',
      email: googleUser.email || '',
      mobile: '',                // Google users start with no mobile
      village: '',
      district: '',
      state: '',
      language: 'en' as const,
      crops: ['Wheat'],
      avatar: googleUser.picture || null,
      onboarded: false,
    }

    // Try to fetch an existing profile from DB (in case user logged in before)
    try {
      const { getUserFromDb, saveUserToDb } = await import('@/lib/db')
      const existing = googleUser.email
        ? await getUserFromDb(`google-${googleUser.sub}`)
        : null

      if (existing) {
        // Merge: keep DB data but refresh avatar/name from Google
        user = {
          ...existing,
          name: existing.name && existing.name !== 'Farmer' ? existing.name : (googleUser.name || 'Farmer'),
          avatar: googleUser.picture || existing.avatar,
          email: googleUser.email || existing.email,
        }
      } else {
        // First login — persist to DB
        user = await saveUserToDb({
          id: `google-${googleUser.sub}`,
          name: googleUser.name || 'Farmer',
          email: googleUser.email || '',
          mobile: `g-${googleUser.sub.slice(-10)}`, // synthetic mobile for DB key
          village: '',
          district: '',
          state: '',
          language: 'en',
          crops: ['Wheat'],
          avatar: googleUser.picture || null,
        })
      }
    } catch (dbErr) {
      console.warn('[Google Auth] DB persist failed, using session only:', dbErr)
    }

    const targetUrl = next.startsWith('/') ? next : '/dashboard'
    const redirectTarget = !user.onboarded ? '/signup?step=profile' : targetUrl
    const response = NextResponse.redirect(new URL(redirectTarget, request.url))

    // 4. Set the session cookie
    response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(user)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (err) {
    console.error('Google Auth callback exception:', err)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
