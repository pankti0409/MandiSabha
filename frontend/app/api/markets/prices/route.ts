import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const crop = searchParams.get('crop') || 'Onion'
  const state = searchParams.get('state')
  const q = searchParams.get('q')

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  const params = new URLSearchParams()
  params.set('crop', crop)
  if (state && state !== 'All') params.set('state', state)
  if (q) params.set('q', q)

  try {
    const res = await fetch(`${backendUrl}/markets/prices?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
    return NextResponse.json({ rows: [], total: 0, error: 'Failed to fetch prices' }, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ rows: [], total: 0, error: err.message }, { status: 500 })
  }
}
