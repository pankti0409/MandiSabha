import { NextResponse } from 'next/server'

// Curated dictionary of major agricultural hubs & districts for instant fallback
const KNOWN_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  rajkot: { lat: 22.3039, lon: 70.8022, name: 'Rajkot, Gujarat' },
  surat: { lat: 21.1702, lon: 72.8311, name: 'Surat, Gujarat' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, Gujarat' },
  nashik: { lat: 19.9975, lon: 73.7898, name: 'Nashik, Maharashtra' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune, Maharashtra' },
  indore: { lat: 22.7196, lon: 75.8577, name: 'Indore, Madhya Pradesh' },
  nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur, Maharashtra' },
  kolhapur: { lat: 16.7050, lon: 74.2433, name: 'Kolhapur, Maharashtra' },
  vadodara: { lat: 22.3072, lon: 73.1812, name: 'Vadodara, Gujarat' },
  mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai, Maharashtra' },
  thane: { lat: 19.2183, lon: 72.9781, name: 'Thane, Maharashtra' },
  lasalgaon: { lat: 20.1472, lon: 74.2268, name: 'Lasalgaon, Nashik, Maharashtra' },
  pimpalgaon: { lat: 20.1706, lon: 73.9856, name: 'Pimpalgaon Baswant, Nashik' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur, Rajasthan' },
  kota: { lat: 25.1388, lon: 75.8714, name: 'Kota, Rajasthan' },
  ujjain: { lat: 23.1828, lon: 75.7772, name: 'Ujjain, Madhya Pradesh' },
  mandsaur: { lat: 24.0722, lon: 75.0689, name: 'Mandsaur, Madhya Pradesh' },
  bhavnagar: { lat: 21.7645, lon: 72.1519, name: 'Bhavnagar, Gujarat' },
  jamnagar: { lat: 22.4707, lon: 70.0577, name: 'Jamnagar, Gujarat' },
  junagadh: { lat: 21.5222, lon: 70.4579, name: 'Junagadh, Gujarat' },
  amreli: { lat: 21.6032, lon: 71.2221, name: 'Amreli, Gujarat' },
  morbi: { lat: 22.8120, lon: 70.8378, name: 'Morbi, Gujarat' },
  mehsana: { lat: 23.5880, lon: 72.3693, name: 'Mehsana, Gujarat' },
  anand: { lat: 22.5645, lon: 72.9289, name: 'Anand, Gujarat' },
  solapur: { lat: 17.6599, lon: 75.9064, name: 'Solapur, Maharashtra' },
  jalgaon: { lat: 21.0077, lon: 75.5626, name: 'Jalgaon, Maharashtra' },
  aurangabad: { lat: 19.8762, lon: 75.3433, name: 'Chhatrapati Sambhajinagar, Maharashtra' },
  ahmednagar: { lat: 19.0952, lon: 74.7496, name: 'Ahmednagar, Maharashtra' },
  satara: { lat: 17.6805, lon: 74.0183, name: 'Satara, Maharashtra' },
  sangli: { lat: 16.8524, lon: 74.5815, name: 'Sangli, Maharashtra' },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || !q.trim()) {
    return NextResponse.json({ message: 'Missing place query parameter (q)' }, { status: 400 })
  }

  const query = q.trim()
  const lowerQuery = query.toLowerCase()

  // 1. Check known coords dictionary first for fast lookup
  for (const [key, val] of Object.entries(KNOWN_COORDS)) {
    if (lowerQuery.includes(key)) {
      return NextResponse.json({
        success: true,
        lat: val.lat,
        lon: val.lon,
        displayName: val.name,
        source: 'curated',
      })
    }
  }

  // 2. Try FastAPI backend forward-geocode
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  try {
    const backendResp = await fetch(
      `${backendUrl}/markets/geocode?q=${encodeURIComponent(query)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    )

    if (backendResp.ok) {
      const data = await backendResp.json()
      return NextResponse.json({
        success: true,
        lat: Number(data.lat),
        lon: Number(data.lon),
        displayName: data.display_name || query,
        source: 'backend',
      })
    }
  } catch {
    // Backend offline or timeout; fall through to direct Nominatim
  }

  // 3. Fallback to direct Nominatim query
  try {
    const nomResp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'VyaaparMitra-MandiSabha/1.0 (contact@vyaaparmitra.org)',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
        signal: AbortSignal.timeout(4500),
      }
    )

    if (nomResp.ok) {
      const results = await nomResp.json()
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0]
        return NextResponse.json({
          success: true,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name || query,
          source: 'nominatim',
        })
      }
    }
  } catch {
    // Nominatim failed
  }

  // 4. Default to regional center if nothing matched
  return NextResponse.json({
    success: true,
    lat: 19.9975,
    lon: 73.7898,
    displayName: query,
    source: 'fallback',
  })
}
