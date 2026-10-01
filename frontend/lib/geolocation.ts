'use client'

export type LocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'GEOCODE_FAILED'

export type LocationResult =
  | {
      ok: true
      village: string
      district: string
      state: string
      formatted: string
      lat: number
      lon: number
      source?: string
    }
  | {
      ok: false
      error: string
      code?: LocationErrorCode
    }

export async function detectUserLocation(): Promise<LocationResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      ok: false,
      error: 'Geolocation is not supported by your device or browser.',
      code: 'NOT_SUPPORTED',
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords

        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`)
          if (!res.ok) {
            throw new Error('Reverse geocode request failed')
          }
          const data = await res.json()

          resolve({
            ok: true,
            village: data.village || '',
            district: data.district || '',
            state: data.state || '',
            formatted: data.formatted || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
            lat,
            lon,
            source: data.source,
          })
        } catch {
          // If reverse geocoding lookup fails, provide coordinates as fallback
          resolve({
            ok: true,
            village: '',
            district: '',
            state: '',
            formatted: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
            lat,
            lon,
            source: 'coordinates',
          })
        }
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location.'
        let code: LocationErrorCode = 'POSITION_UNAVAILABLE'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Please allow location access in browser or type manually.'
            code = 'PERMISSION_DENIED'
            break
          case error.TIMEOUT:
            errorMsg = 'Location detection timed out. Please try again or type manually.'
            code = 'TIMEOUT'
            break
          case error.POSITION_UNAVAILABLE:
          default:
            errorMsg = 'Location information is currently unavailable. Please enter manually.'
            code = 'POSITION_UNAVAILABLE'
            break
        }

        resolve({
          ok: false,
          error: errorMsg,
          code,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}
