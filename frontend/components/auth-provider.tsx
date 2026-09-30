'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { DemoUser, getSession, logoutRequest, requestOtp, verifyOtp } from '@/lib/api/auth'
type AuthContextValue = {
  user: DemoUser | null
  status: 'loading' | 'authenticated' | 'anonymous'
  requestOtp: (mobile: string) => Promise<void>
  verifyOtp: (mobile: string, otp: string, profile?: Partial<DemoUser>) => Promise<DemoUser>
  updateUser: (updates: Partial<DemoUser>) => Promise<DemoUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const refresh = async () => {
    const next = await getSession()
    setUser(next)
    setStatus(next ? 'authenticated' : 'anonymous')
  }
  useEffect(() => {
    refresh()
  }, [])
  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        requestOtp: async (mobile) => {
          await requestOtp(mobile)
        },
        verifyOtp: async (mobile, otp, profile) => {
          const result = await verifyOtp(mobile, otp, profile)
          setUser(result.user)
          setStatus('authenticated')
          return result.user
        },
        updateUser: async (updates) => {
          const { updateProfile } = await import('@/lib/api/auth')
          const result = await updateProfile(updates)
          setUser(result.user)
          return result.user
        },
        logout: async () => {
          await logoutRequest()
          setUser(null)
          setStatus('anonymous')
        },
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
