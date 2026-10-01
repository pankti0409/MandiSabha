import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ message: 'Missing lat or lon query parameter' }, { status: 400 })
  }

  const numLat = parseFloat(lat)
  const numLon = parseFloat(lon)

  if (isNaN(numLat) || isNaN(numLon)) {
    return NextResponse.json({ message: 'Invalid coordinates' }, { status: 400 })
  }

  // 1. Try FastAPI backend reverse-geocode if available
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  try {
    const backendResp = await fetch(`${backendUrl}/markets/reverse-geocode?lat=${numLat}&lon=${numLon}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    })

    if (backendResp.ok) {
      const data = await backendResp.json()
      return NextResponse.json({
        success: true,
        village: data.village || '',
        district: data.district || '',
        state: data.state || '',
        formatted: data.displayName || (data.village && data.district ? `${data.village}, ${data.district}` : 'Local Farm Area'),
        lat: numLat,
        lon: numLon,
        source: data.source || 'backend',
      })
    }
  } catch {
    // Backend offline or timed out; fall through to direct Nominatim request
  }

  // 2. Direct OpenStreetMap Nominatim reverse geocode
  try {
    const nomResp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLon}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'VyaaparMitra-MandiSabha/1.0 (contact@vyaaparmitra.org)',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
        signal: AbortSignal.timeout(4500),
      }
    )

    if (nomResp.ok) {
      const json = await nomResp.json()
      const addr = json.address || {}
      const village = (
        addr.village ||
        addr.suburb ||
        addr.town ||
        addr.city ||
        addr.hamlet ||
        addr.municipality ||
        addr.county ||
        ''
      )
      const district = addr.state_district || addr.district || addr.county || ''
      const state = addr.state || ''

      let formatted = ''
      if (village && district) {
        formatted = `${village}, ${district}`
      } else if (village && state) {
        formatted = `${village}, ${state}`
      } else if (district && state) {
        formatted = `${district}, ${state}`
      } else if (json.display_name) {
        formatted = json.display_name.split(',').slice(0, 2).join(', ').trim()
      } else {
        formatted = `${numLat.toFixed(3)}°N, ${numLon.toFixed(3)}°E`
      }

      return NextResponse.json({
        success: true,
        village,
        district,
        state,
        formatted,
        lat: numLat,
        lon: numLon,
        source: 'nominatim',
      })
    }
  } catch {
    // Nominatim failed; fall through to graceful coordinate format
  }

  // 3. Fallback coordinate representation
  return NextResponse.json({
    success: true,
    village: 'Farm Area',
    district: 'Nashik',
    state: 'Maharashtra',
    formatted: `${numLat.toFixed(3)}°N, ${numLon.toFixed(3)}°E`,
    lat: numLat,
    lon: numLon,
    source: 'fallback',
  })
}
