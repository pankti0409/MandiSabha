import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getSabhaFromDb } = await import('@/lib/db')
    const sabha = await getSabhaFromDb(id)

    if (!sabha) {
      return NextResponse.json({ success: false, error: 'Sabha not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, sabha })
  } catch (err: any) {
    console.error('[API/SABHA/[ID]] Error reading sabha from DB:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to read sabha' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { saveSabhaToDb, getSabhaFromDb } = await import('@/lib/db')

    const existing = await getSabhaFromDb(id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Sabha not found' }, { status: 404 })
    }

    const updated = await saveSabhaToDb({
      id,
      userId: existing.user_id,
      draft: body.draft || existing.draft,
      recommendation: body.recommendation || existing.recommendation,
      status: body.status || existing.status,
      userStatus: body.userStatus || existing.user_status,
      actualPricePerQ: body.actualPricePerQ ?? existing.actual_price_per_q,
    })

    return NextResponse.json({ success: true, sabha: updated })
  } catch (err: any) {
    console.error('[API/SABHA/[ID]] Error updating sabha in DB:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to update sabha' }, { status: 500 })
  }
}
