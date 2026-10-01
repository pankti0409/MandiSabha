import { NextResponse } from 'next/server'
import { parseHarvestDetails } from '@/lib/voice-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text = body.text || ''
    const parsed = parseHarvestDetails(text)

    return NextResponse.json({
      success: true,
      text,
      ...parsed,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to parse speech' },
      { status: 400 }
    )
  }
}
