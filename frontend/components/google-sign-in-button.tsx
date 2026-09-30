'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GoogleSignInButtonInner({ text = 'Continue with Google' }: { text?: string }) {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const googleAuthHref = `/api/auth/google?next=${encodeURIComponent(next)}`

  return (
    <a
      href={googleAuthHref}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 font-semibold text-foreground text-sm shadow-xs transition-all hover:bg-muted/70 hover:border-border/80 focus:ring-2 focus:ring-primary/20 active:scale-[0.99] cursor-pointer"
    >
      <svg className="size-5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>{text}</span>
    </a>
  )
}

export function GoogleSignInButton(props: { text?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground">
          <span>{props.text || 'Continue with Google'}</span>
        </div>
      }
    >
      <GoogleSignInButtonInner {...props} />
    </Suspense>
  )
}
