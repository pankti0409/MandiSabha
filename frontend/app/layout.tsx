import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { LocaleProvider } from '@/components/locale-provider'

export const metadata: Metadata = {
  title: 'Mandi Sabha — A better price for your harvest',
  description: 'AI agents compare mandi prices, transport, weather, and risk for farmers.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#090E0B' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
