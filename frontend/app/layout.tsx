import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { LocaleProvider } from '@/components/locale-provider'
export const metadata: Metadata = { title: 'Mandi Sabha — A better price for your harvest', description: 'AI agents compare mandi prices, transport, weather, and risk for farmers.' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><LocaleProvider><AuthProvider>{children}</AuthProvider></LocaleProvider></body></html> }
