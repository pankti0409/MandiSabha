import { NextResponse } from 'next/server'
import { mobileSchema } from '@/lib/api/auth'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = mobileSchema.safeParse(String(body.mobile || '').replace(/\D/g, '').slice(-10))
  if (!parsed.success) return NextResponse.json({ message: 'Enter a valid 10-digit mobile number.' }, { status: 400 })
  return NextResponse.json({ demo: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' })
}
