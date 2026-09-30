import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/dashboard', '/sabha', '/explore', '/history', '/settings']

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = Boolean(
    request.cookies.get(process.env.AUTH_COOKIE_NAME || 'mandi_session')?.value
  )

  const isProtected = protectedPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )

  // Redirect unauthenticated user to login
  if (isProtected && !hasSession) {
    const url = new URL('/login', request.url)
    const target = `${pathname}${search}`
    // Validate target is same-origin relative path
    if (target.startsWith('/') && !target.startsWith('//')) {
      url.searchParams.set('next', target)
    }
    return NextResponse.redirect(url)
  }

  // Redirect authenticated user away from login/signup
  if ((pathname === '/login' || pathname === '/signup') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sabha/:path*',
    '/explore/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
}
