import { NextRequest, NextResponse } from 'next/server'

interface RouteCacheEntry {
  data: any
  expiresAt: number
}

// In-memory cache for fast repeated corridor queries
const routeCache = new Map<string, RouteCacheEntry>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

function getCacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
  return `${lat1.toFixed(3)},${lon1.toFixed(3)}->${lat2.toFixed(3)},${lon2.toFixed(3)}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hrs = Math.floor(minutes / 60)
  const rem = Math.round(minutes % 60)
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const originLat = parseFloat(searchParams.get('originLat') || searchParams.get('lat1') || '')
  const originLon = parseFloat(searchParams.get('originLon') || searchParams.get('lon1') || '')
  const destLat = parseFloat(searchParams.get('destLat') || searchParams.get('lat2') || '')
  const destLon = parseFloat(searchParams.get('destLon') || searchParams.get('lon2') || '')

  if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
    return NextResponse.json({ success: false, error: 'Valid originLat, originLon, destLat, and destLon are required' }, { status: 400 })
  }

  const cacheKey = getCacheKey(originLat, originLon, destLat, destLon)
  const cached = routeCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data)
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&alternatives=true`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VyaaparMitra/1.0 (Agriculture Mandi Logistics)',
        Accept: 'application/json',
      },
    })
    clearTimeout(timeoutId)

    if (resp.ok) {
      const data = await resp.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0]
        const distanceKm = Math.round((primary.distance / 1000) * 10) / 10
        const durationMin = Math.round(primary.duration / 60)
        // Convert OSRM [lon, lat] coordinates to Leaflet [lat, lon]
        const coordinates: [number, number][] = (primary.geometry?.coordinates || []).map(
          ([lon, lat]: [number, number]) => [Number(lat.toFixed(5)), Number(lon.toFixed(5))]
        )

        const alternatives = (data.routes.slice(1) || []).map((alt: any) => ({
          distanceKm: Math.round((alt.distance / 1000) * 10) / 10,
          durationMin: Math.round(alt.duration / 60),
          formattedDuration: formatDuration(alt.duration / 60),
          summary: alt.legs?.[0]?.summary || 'Alternative Highway',
          coordinates: (alt.geometry?.coordinates || []).map(
            ([lon, lat]: [number, number]) => [Number(lat.toFixed(5)), Number(lon.toFixed(5))]
          ),
        }))

        const result = {
          success: true,
          distanceKm,
          durationMin,
          formattedDuration: formatDuration(durationMin),
          summary: primary.legs?.[0]?.summary || 'National Highway',
          coordinates,
          alternatives,
          source: 'osrm',
        }

        routeCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    console.warn('[ROUTING] OSRM live query failed or timed out, generating curved highway path:', err)
  }

  // Fallback: Generates a realistic curved highway path between coordinates
  const steps = 16
  const coordinates: [number, number][] = []
  const dLat = destLat - originLat
  const dLon = destLon - originLon
  const dist = Math.sqrt(dLat * dLat + dLon * dLon)
  const perpLat = -dLon / (dist || 1)
  const perpLon = dLat / (dist || 1)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const curve = Math.sin(t * Math.PI) * (dist * 0.08)
    const pLat = originLat + dLat * t + perpLat * curve
    const pLon = originLon + dLon * t + perpLon * curve
    coordinates.push([Number(pLat.toFixed(5)), Number(pLon.toFixed(5))])
  }

  const estKm = Math.round(dist * 111 * 1.25)
  const estMin = Math.round((estKm / 60) * 60)

  const fallbackResult = {
    success: true,
    distanceKm: estKm,
    durationMin: estMin,
    formattedDuration: formatDuration(estMin),
    summary: 'Corridor Highway',
    coordinates,
    alternatives: [],
    source: 'fallback',
  }

  return NextResponse.json(fallbackResult)
}
