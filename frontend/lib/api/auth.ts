import { z } from 'zod'

export const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.')
export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.')

export type DemoUser = {
  id: string
  name: string
  mobile: string
  village: string
  district: string
  state?: string
  language: 'en' | 'hi' | 'gu'
  crops: string[]
  cropDetails?: {
    name: string
    acres: number
    harvestMonth: string
    variety?: string
    isPrimary?: boolean
  }[]
  farmSizeAcres?: number
  transportCostPerKm?: number
  vehicleType?: 'pickup' | 'truck' | 'heavy'
  priceAlerts?: boolean
  weatherAlerts?: boolean
  primaryMandi?: string
  email?: string
  avatar?: string
}

export async function requestOtp(mobile: string) {
  const response = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile }) })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Unable to send code')
  return response.json() as Promise<{ demo: boolean }>
}

export async function verifyOtp(mobile: string, otp: string, profile?: Partial<DemoUser>) {
  const response = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile, otp, profile }) })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Unable to verify code')
  return response.json() as Promise<{ user: DemoUser }>
}

export async function updateProfile(updates: Partial<DemoUser>) {
  const response = await fetch('/api/auth/profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Failed to update profile')
  return response.json() as Promise<{ success: boolean; user: DemoUser }>
}

export async function getSession() {
  const response = await fetch('/api/auth/session', { cache: 'no-store' })
  if (!response.ok) return null
  return (await response.json()).user as DemoUser
}

export async function logoutRequest() { await fetch('/api/auth/logout', { method: 'POST' }) }
