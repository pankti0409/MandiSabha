'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Navigation, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  CloudSun, 
  Maximize2, 
  RotateCcw,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LiveRouteMapProps {
  originLocation?: string
  originCoords?: [number, number]
  targetMandi?: string
  onSelectMandi?: (mandi: string) => void
  onDistanceChange?: (distanceKm: number) => void
  className?: string
  initialHeight?: string
  compact?: boolean
}

export interface CorridorData {
  name: string
  shortName: string
  highway: string
  distanceKm: number
  transitHours: string
  toll: number
  tollPlaza: string
  weatherStatus: string
  speedLimit: string
  surplus: string
  modalRate: string
  originCoords: [number, number]
  targetCoords: [number, number]
  bounds: [[number, number], [number, number]]
  waypoints: {
    id: string
    title: string
    type: 'origin' | 'target' | 'toll' | 'weather' | 'truck'
    coords: [number, number]
    badge: string
    detail: string
  }[]
  routePath: [number, number][]
}

interface MandiDef {
  name: string
  shortName: string
  highway: string
  targetCoords: [number, number]
  tollPlaza: string
  weatherStatus: string
  speedLimit: string
  surplus: string
  modalRate: string
  color: string
}

const MANDI_DEFINITIONS: Record<string, MandiDef> = {
  'Gondal APMC': {
    name: 'Gondal APMC',
    shortName: 'Gondal',
    highway: 'NH27 / Gondal Highway',
    targetCoords: [21.9620, 70.7960],
    tollPlaza: 'Bhojpara Toll Plaza',
    weatherStatus: 'Clear 31°C · Dry Road',
    speedLimit: '80 km/h Limit',
    surplus: '+₹7,925',
    modalRate: '₹2,520/q',
    color: '#0F6B47',
  },
  'Rajkot Market Yard': {
    name: 'Rajkot Market Yard',
    shortName: 'Rajkot',
    highway: 'NH27 Saurashtra Corridor',
    targetCoords: [22.3039, 70.8022],
    tollPlaza: 'Bedi Toll Plaza',
    weatherStatus: 'Clear 32°C · Dry Road',
    speedLimit: '80 km/h Limit',
    surplus: 'Baseline',
    modalRate: '₹2,120/q',
    color: '#8B5CF6',
  },
  'Morbi APMC': {
    name: 'Morbi APMC',
    shortName: 'Morbi',
    highway: 'NH8A Morbi Highway',
    targetCoords: [22.8120, 70.8378],
    tollPlaza: 'Wankaner Toll Plaza',
    weatherStatus: 'Sunny 33°C · Dry Road',
    speedLimit: '75 km/h Limit',
    surplus: '+₹800',
    modalRate: '₹2,180/q',
    color: '#0284C7',
  },
  'Jamnagar APMC': {
    name: 'Jamnagar APMC',
    shortName: 'Jamnagar',
    highway: 'SH26 / Jamnagar Highway',
    targetCoords: [22.4707, 70.0577],
    tollPlaza: 'Theba Toll Plaza',
    weatherStatus: 'Clear 30°C · Dry Road',
    speedLimit: '80 km/h Limit',
    surplus: '+₹450',
    modalRate: '₹2,140/q',
    color: '#D97706',
  },
  'Surat APMC': {
    name: 'Surat APMC',
    shortName: 'Surat',
    highway: 'NH48 Freight Expressway',
    targetCoords: [21.1702, 72.8311],
    tollPlaza: 'Surat National Toll Plaza',
    weatherStatus: 'Clear 31°C · 0% Rain Risk',
    speedLimit: '80 km/h Limit',
    surplus: '+₹5,900',
    modalRate: '₹2,600/q',
    color: '#10B981',
  },
  'Pune Market Yard': {
    name: 'Pune Market Yard',
    shortName: 'Pune',
    highway: 'NH60 / Expressway',
    targetCoords: [18.4967, 73.8643],
    tollPlaza: 'Khed Shivapur Toll Plaza',
    weatherStatus: 'Partly Cloudy 28°C · Dry Surface',
    speedLimit: '75 km/h Limit',
    surplus: '+₹3,800',
    modalRate: '₹2,200/q',
    color: '#0284C7',
  },
  'Ahmedabad APMC': {
    name: 'Ahmedabad APMC',
    shortName: 'Ahmedabad',
    highway: 'NH47 & NE1 Expressway',
    targetCoords: [23.0225, 72.5714],
    tollPlaza: 'Ahmedabad Ring Toll',
    weatherStatus: 'Sunny 34°C · Dry Road',
    speedLimit: '90 km/h Limit',
    surplus: '+₹2,550',
    modalRate: '₹2,380/q',
    color: '#EAB308',
  },
  'Indore Mandi': {
    name: 'Indore Mandi',
    shortName: 'Indore',
    highway: 'NH52 Malwa Expressway',
    targetCoords: [22.7196, 75.8577],
    tollPlaza: 'Dhamnod Toll Plaza',
    weatherStatus: 'Sunny 30°C · 0% Rain',
    speedLimit: '80 km/h Limit',
    surplus: '+₹4,100',
    modalRate: '₹2,280/q',
    color: '#10B981',
  },
  'Lasalgaon APMC': {
    name: 'Lasalgaon APMC',
    shortName: 'Lasalgaon',
    highway: 'NH848 Agri Expressway',
    targetCoords: [20.1472, 74.2268],
    tollPlaza: 'Pimpalgaon Toll Gate',
    weatherStatus: 'Clear 29°C · Clear Sky',
    speedLimit: '70 km/h Limit',
    surplus: '+₹1,400',
    modalRate: '₹1,850/q',
    color: '#EA580C',
  },
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function generateCorridorPath(origin: [number, number], target: [number, number]): [number, number][] {
  const [lat1, lon1] = origin
  const [lat2, lon2] = target

  // Check if crossing Gulf of Khambhat (Saurashtra <-> South Gujarat/Maharashtra)
  const isSaurashtraOrigin = lon1 < 71.9 && lat1 > 20.8 && lat1 < 23.5
  const isSouthGujaratOrMHTarget = lon2 > 72.6 && lat2 < 21.8
  const isSaurashtraTarget = lon2 < 71.9 && lat2 > 20.8 && lat2 < 23.5
  const isSouthGujaratOrMHOrigin = lon1 > 72.6 && lat1 < 21.8

  if (isSaurashtraOrigin && isSouthGujaratOrMHTarget) {
    return [
      [lat1, lon1],
      [22.4500, Math.min(lon1 + 0.5, 71.5000)],
      [22.5600, 71.8000], // Limbdi
      [22.4500, 72.1500], // Bagodara
      [22.3100, 73.1800], // Vadodara
      [21.7100, 72.9900], // Bharuch
      [lat2, lon2],
    ]
  }

  if (isSouthGujaratOrMHOrigin && isSaurashtraTarget) {
    return [
      [lat1, lon1],
      [21.7100, 72.9900], // Bharuch
      [22.3100, 73.1800], // Vadodara
      [22.4500, 72.1500], // Bagodara
      [22.5600, 71.8000], // Limbdi
      [lat2, lon2],
    ]
  }

  // Smooth realistic interpolator for other corridors
  const steps = 8
  const path: [number, number][] = []
  const dLat = lat2 - lat1
  const dLon = lon2 - lon1
  const dist = Math.sqrt(dLat * dLat + dLon * dLon)
  const perpLat = -dLon / (dist || 1)
  const perpLon = dLat / (dist || 1)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const curve = Math.sin(t * Math.PI) * (dist * 0.05)
    const pLat = lat1 + dLat * t + perpLat * curve
    const pLon = lon1 + dLon * t + perpLon * curve
    path.push([Number(pLat.toFixed(4)), Number(pLon.toFixed(4))])
  }
  return path
}

// ─── Google Maps Tile Servers (No API key needed, zero watermark) ─────────────
const GOOGLE_TILE_URLS: Record<string, string> = {
  road: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  satellite: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  terrain: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
}

export function LiveRouteMap({
  originLocation = 'Nashik, Maharashtra',
  originCoords,
  targetMandi = 'Surat APMC',
  onSelectMandi,
  onDistanceChange,
  className,
  initialHeight = 'h-[460px] lg:h-[500px]',
  compact = false,
}: LiveRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  const [activeMandi, setActiveMandi] = useState<string>(targetMandi)
  useEffect(() => {
    if (targetMandi) {
      setActiveMandi(targetMandi)
    }
  }, [targetMandi])
  const [mapStyle, setMapStyle] = useState<'road' | 'satellite' | 'terrain'>('road')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [liveRoute, setLiveRoute] = useState<{
    distanceKm: number
    durationMin: number
    formattedDuration: string
    summary: string
    coordinates: [number, number][]
    alternatives: {
      distanceKm: number
      durationMin: number
      formattedDuration: string
      summary: string
      coordinates: [number, number][]
    }[]
  } | null>(null)

  // Dynamic origin coordinates resolved from prop or geocoding
  const [resolvedCoords, setResolvedCoords] = useState<[number, number]>(() => {
    if (originCoords) return originCoords
    const lower = originLocation.toLowerCase()
    if (lower.includes('rajkot')) return [22.2967, 70.7582]
    if (lower.includes('surat')) return [21.1702, 72.8311]
    if (lower.includes('ahmedabad')) return [23.0225, 72.5714]
    if (lower.includes('pune')) return [18.5204, 73.8567]
    if (lower.includes('indore')) return [22.7196, 75.8577]
    return [19.9975, 73.7898] // Nashik default
  })

  // Keep resolvedCoords in sync with originCoords prop
  useEffect(() => {
    if (originCoords) {
      setResolvedCoords(originCoords)
    }
  }, [originCoords])

  // Geocode location whenever originLocation text changes and no direct originCoords
  useEffect(() => {
    if (originCoords) return
    if (!originLocation || !originLocation.trim()) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(originLocation)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.lat && data.lon) {
            setResolvedCoords([data.lat, data.lon])
          }
        }
      } catch {
        // Fallback remains active
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [originLocation, originCoords])

  // Synchronize targetMandi prop
  useEffect(() => {
    if (targetMandi) {
      setActiveMandi(targetMandi)
    }
  }, [targetMandi])

  // Fetch real highway turn-by-turn road route whenever activeMandi or resolvedCoords change
  useEffect(() => {
    let cancelled = false
    const def = MANDI_DEFINITIONS[activeMandi]
    if (!def) return

    const [lat1, lon1] = resolvedCoords
    const [lat2, lon2] = def.targetCoords

    async function fetchLiveRoadRoute() {
      try {
        const res = await fetch(`/api/route?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.success && data.coordinates?.length) {
            setLiveRoute(data)
            if (onDistanceChange) {
              onDistanceChange(data.distanceKm)
            }
          }
        }
      } catch (err) {
        console.warn('[MAP] Live road route fetch fallback to generated corridor', err)
      }
    }

    fetchLiveRoadRoute()
    return () => {
      cancelled = true
    }
  }, [activeMandi, resolvedCoords, onDistanceChange])

  // Dynamically compute corridors based on current resolvedCoords
  const corridors = useMemo<Record<string, CorridorData>>(() => {
    const result: Record<string, CorridorData> = {}

    // Ensure targetMandi is included even if not among defaults
    const mandiList = { ...MANDI_DEFINITIONS }
    if (targetMandi && !mandiList[targetMandi]) {
      mandiList[targetMandi] = {
        name: targetMandi,
        shortName: targetMandi.replace(' APMC', '').replace(' Market Yard', '').replace(' Mandi', ''),
        highway: 'National Freight Corridor',
        targetCoords: [21.1702, 72.8311],
        tollPlaza: 'Agri Corridor Toll Plaza',
        weatherStatus: 'Clear 30°C · 0% Rain',
        speedLimit: '80 km/h Limit',
        surplus: '+₹3,200',
        modalRate: '₹2,100/q',
        color: '#10B981',
      }
    }

    for (const [key, def] of Object.entries(mandiList)) {
      const straight = haversineKm(
        resolvedCoords[0],
        resolvedCoords[1],
        def.targetCoords[0],
        def.targetCoords[1]
      )

      // Road distance is roughly 1.25x straight-line, or ~1.35x around Gulf of Khambhat
      const isSaurashtraToSouth =
        resolvedCoords[1] < 71.9 && def.targetCoords[1] > 72.6 && def.targetCoords[0] < 21.8
      const multiplier = isSaurashtraToSouth ? 1.4 : 1.25
      const distanceKm = Math.max(15, Math.round(straight * multiplier))
      const hours = (distanceKm / 50).toFixed(1)
      const toll = Math.max(80, Math.round((distanceKm * 1.55) / 10) * 10)
      const routePath = generateCorridorPath(resolvedCoords, def.targetCoords)

      const minLat = Math.min(...routePath.map((p) => p[0])) - 0.25
      const maxLat = Math.max(...routePath.map((p) => p[0])) + 0.25
      const minLon = Math.min(...routePath.map((p) => p[1])) - 0.25
      const maxLon = Math.max(...routePath.map((p) => p[1])) + 0.25

      const waypoints = [
        {
          id: 'origin',
          title: `${originLocation || 'Farm'} Origin Hub`,
          type: 'origin' as const,
          coords: resolvedCoords,
          badge: 'Dispatch Point',
          detail: 'Farm Gate Loading Bay · Certified Electronic Weighbridge',
        },
        {
          id: 'truck-1',
          title: 'Fleet Pilot #402 (Active Dispatch)',
          type: 'truck' as const,
          coords: routePath[Math.max(1, Math.floor(routePath.length * 0.3))],
          badge: 'Transit · 62 km/h',
          detail: `1.5T Pickup · ETA ${hours} hrs to Gate 2`,
        },
        {
          id: 'toll-1',
          title: def.tollPlaza,
          type: 'toll' as const,
          coords: routePath[Math.floor(routePath.length * 0.45)],
          badge: `FASTag ₹${toll}`,
          detail: 'Commercial Lane Clear · Avg 45s clearance',
        },
        {
          id: 'weather-1',
          title: `${def.shortName} Weather Radar`,
          type: 'weather' as const,
          coords: routePath[Math.floor(routePath.length * 0.7)],
          badge: def.weatherStatus.split(' · ')[0],
          detail: 'IMD Station Telemetry · Zero moisture risk on transit cargo',
        },
        {
          id: 'target',
          title: `${def.name} Market Yard`,
          type: 'target' as const,
          coords: def.targetCoords,
          badge: `${def.modalRate} (${def.surplus})`,
          detail: 'Auction Floor Terminal · Electronic Weighbridge · Spot Cash Clearing',
        },
      ]

      result[key] = {
        name: def.name,
        shortName: def.shortName,
        highway: def.highway,
        distanceKm,
        transitHours: `${hours} hrs`,
        toll,
        tollPlaza: def.tollPlaza,
        weatherStatus: def.weatherStatus,
        speedLimit: def.speedLimit,
        surplus: def.surplus,
        modalRate: def.modalRate,
        originCoords: resolvedCoords,
        targetCoords: def.targetCoords,
        bounds: [
          [minLat, minLon],
          [maxLat, maxLon],
        ],
        waypoints,
        routePath,
      }
    }

    return result
  }, [resolvedCoords, originLocation, targetMandi])

  const corridor = corridors[activeMandi] || (targetMandi && corridors[targetMandi]) || Object.values(corridors)[0]

  // Notify parent of distance change
  useEffect(() => {
    if (corridor && onDistanceChange) {
      onDistanceChange(corridor.distanceKm)
    }
  }, [corridor, onDistanceChange])

  // Initialize Leaflet Map on Client
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return

      const L = (await import('leaflet')).default

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center: resolvedCoords,
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      const initialUrl = GOOGLE_TILE_URLS[mapStyle] || GOOGLE_TILE_URLS.road
      const tileLayer = L.tileLayer(initialUrl, {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
      }).addTo(map)
      tileLayerRef.current = tileLayer

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup

      if (isMounted) {
        setIsMapReady(true)
      }

      setTimeout(() => map.invalidateSize(), 100)
      setTimeout(() => map.invalidateSize(), 300)
    }

    initMap()

    const container = mapContainerRef.current
    let resizeObserver: ResizeObserver | null = null
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize()
      })
      resizeObserver.observe(container)
    }

    return () => {
      isMounted = false
      if (resizeObserver) resizeObserver.disconnect()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update Tile Layer immediately when style changes
  useEffect(() => {
    const newUrl = GOOGLE_TILE_URLS[mapStyle]
    if (!newUrl) return

    if (tileLayerRef.current && typeof tileLayerRef.current.setUrl === 'function') {
      tileLayerRef.current.setUrl(newUrl)
      tileLayerRef.current.redraw?.()
    } else if (mapInstanceRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default
        if (tileLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(tileLayerRef.current)
        }
        tileLayerRef.current = L.tileLayer(newUrl, {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
        }).addTo(mapInstanceRef.current)
      })
    }
  }, [mapStyle])

  // Update Route Polyline and Markers when corridor, liveRoute, or resolvedCoords change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !isMapReady || !corridor) return

    import('leaflet').then((LModule) => {
      const L = LModule.default
      const map = mapInstanceRef.current
      const layerGroup = layerGroupRef.current
      if (!map || !layerGroup) return

      layerGroup.clearLayers()

      // Exact turn-by-turn road coordinates from live OSRM (or fallback)
      const primaryRouteCoords = liveRoute?.coordinates?.length ? liveRoute.coordinates : corridor.routePath

      // ── 1. Draw Alternative Route (Muted Slate, matching Google Maps image 2) ──
      if (liveRoute?.alternatives?.[0]?.coordinates?.length) {
        const altRoute = liveRoute.alternatives[0]
        L.polyline(altRoute.coordinates, {
          color: '#94A3B8',
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup)

        const altMidIndex = Math.floor(altRoute.coordinates.length * 0.45)
        const altMidCoord = altRoute.coordinates[altMidIndex]
        if (altMidCoord) {
          const altChipHtml = `
            <div class="px-2 py-0.5 rounded-lg bg-card/95 text-stone-700 dark:text-stone-300 border border-border shadow-md text-[10px] font-bold whitespace-nowrap pointer-events-none">
              ${altRoute.formattedDuration} · No tolls
            </div>
          `
          L.marker(altMidCoord, {
            icon: L.divIcon({
              html: altChipHtml,
              className: 'leaflet-clean-pin',
              iconSize: [80, 24],
              iconAnchor: [40, 12],
            }),
          }).addTo(layerGroup)
        }
      }

      // ── 2. Draw Active Highway Route (Google Maps solid royal blue) ────────
      // Dark blue casing border
      L.polyline(primaryRouteCoords, {
        color: '#1E40AF',
        weight: 8,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup)

      // Vibrant Google Maps blue solid inner line
      L.polyline(primaryRouteCoords, {
        color: '#2563EB',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup)

      // ── 3. Route Duration Callout Chip (Floating on road, Google Maps style) ─
      const midIndex = Math.floor(primaryRouteCoords.length * 0.48)
      const midCoord = primaryRouteCoords[midIndex]
      if (midCoord) {
        const routeChipHtml = `
          <div class="px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-xl border border-white/90 flex flex-col items-center pointer-events-none whitespace-nowrap">
            <span class="font-extrabold text-[11px] leading-tight tracking-wide">
              ${liveRoute?.formattedDuration || corridor.transitHours}
            </span>
            <span class="text-[9.5px] opacity-90 font-mono">
              ₹${corridor.toll}.00 · ${liveRoute?.distanceKm || corridor.distanceKm} km
            </span>
          </div>
        `
        L.marker(midCoord, {
          icon: L.divIcon({
            html: routeChipHtml,
            className: 'leaflet-clean-pin',
            iconSize: [110, 38],
            iconAnchor: [55, 19],
          }),
        }).addTo(layerGroup)
      }

      // ── 4. Origin Marker (Google Maps blue location dot with "Home" badge) ─
      const originHtml = `
        <div class="relative flex flex-col items-center">
          <span class="mb-1 px-1.5 py-0.5 rounded-md bg-card/95 border border-border shadow-md text-[10px] font-bold text-foreground whitespace-nowrap">
            Home
          </span>
          <div class="relative flex items-center justify-center">
            <span class="size-6 rounded-full bg-blue-500/30 animate-ping absolute"></span>
            <div class="size-4 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="size-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      `
      L.marker(resolvedCoords, {
        icon: L.divIcon({
          html: originHtml,
          className: 'leaflet-clean-pin',
          iconSize: [50, 40],
          iconAnchor: [25, 30],
        }),
      }).addTo(layerGroup)

      // ── 5. Destination Marker (Google Maps red location pin with Mandi name) ─
      const destHtml = `
        <div class="relative flex flex-col items-center">
          <span class="mb-1 px-2 py-0.5 rounded-md bg-red-600 text-white shadow-md text-[10px] font-bold whitespace-nowrap">
            ${corridor.shortName}
          </span>
          <div class="size-7 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        </div>
      `
      L.marker(corridor.targetCoords, {
        icon: L.divIcon({
          html: destHtml,
          className: 'leaflet-clean-pin',
          iconSize: [80, 48],
          iconAnchor: [40, 42],
        }),
      }).addTo(layerGroup)

      // ── 6. Along-Route FASTag Toll Badge ──────────────────────────────────
      const tollIndex = Math.floor(primaryRouteCoords.length * 0.3)
      const tollCoord = primaryRouteCoords[tollIndex]
      if (tollCoord) {
        const tollHtml = `
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-900/90 text-amber-300 border border-amber-400/40 shadow-sm text-[9.5px] font-mono font-bold whitespace-nowrap">
            FASTag ₹${corridor.toll}
          </div>
        `
        L.marker(tollCoord, {
          icon: L.divIcon({
            html: tollHtml,
            className: 'leaflet-clean-pin',
            iconSize: [70, 20],
            iconAnchor: [35, 10],
          }),
        }).addTo(layerGroup)
      }

      // Smooth pan and fit bounds around real road coordinates
      const latList = primaryRouteCoords.map((p) => p[0])
      const lonList = primaryRouteCoords.map((p) => p[1])
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...latList) - 0.03, Math.min(...lonList) - 0.03],
        [Math.max(...latList) + 0.03, Math.max(...lonList) + 0.03],
      ]

      map.flyToBounds(bounds, {
        padding: [30, 30],
        duration: 0.8,
      })

      setTimeout(() => map.invalidateSize(), 200)
    })
  }, [corridor, isMapReady, liveRoute, resolvedCoords])

  const handleSelectCorridor = (mandiName: string) => {
    setActiveMandi(mandiName)
    onSelectMandi?.(mandiName)
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current && corridor) {
      mapInstanceRef.current.flyToBounds(corridor.bounds, {
        padding: [35, 35],
        duration: 0.6,
      })
    }
  }

  // Display top 3 mandis in the switcher strip
  const switcherMandis = useMemo(() => {
    const keys = Object.keys(corridors)
    if (activeMandi && keys.includes(activeMandi)) {
      const rest = keys.filter((k) => k !== activeMandi)
      return [activeMandi, ...rest.slice(0, 2)]
    }
    return keys.slice(0, 3)
  }, [corridors, activeMandi])

  return (
    <>
      <div
        className={cn(
          'card-luxury relative overflow-hidden flex flex-col p-0 border border-border bg-card shadow-md transition-all',
          initialHeight,
          className
        )}
      >
        {/* ── Top Header Bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/25 shadow-2xs shrink-0">
              <Navigation className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                  Live Highway Route & Mandi Radar
                </span>
                <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.2 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="status-pulse !size-1.5 mr-1 inline-block" />
                  GIS Live
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {corridor.highway} · Origin: {originLocation}
              </p>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRecenter}
              title="Recenter highway view"
              className="grid size-7 place-items-center rounded-lg bg-background hover:bg-muted text-foreground border border-border text-xs transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title="Open full interactive map modal"
              className="grid size-7 place-items-center rounded-lg bg-background hover:bg-muted text-foreground border border-border text-xs transition-colors"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* ── Dedicated 3-Column Mandi Switcher Strip (Dynamic Distances from Origin) ── */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 border-b border-border z-20">
          {switcherMandis.map((mandi) => {
            const isSelected = activeMandi === mandi
            const item = corridors[mandi]
            if (!item) return null
            return (
              <button
                key={mandi}
                type="button"
                onClick={() => handleSelectCorridor(mandi)}
                className={cn(
                  'rounded-xl p-2 text-left transition-all flex flex-col justify-between border',
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-sm ring-1 ring-primary'
                    : 'border-border/70 bg-card hover:bg-muted text-foreground'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-[11px] leading-tight truncate">
                    {item.shortName}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-mono font-bold px-1 rounded',
                      isSelected ? 'bg-white/20 text-white' : 'text-primary bg-primary/10'
                    )}
                  >
                    {item.distanceKm}km
                  </span>
                </div>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className={cn('text-[10px] font-mono', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                    {item.modalRate}
                  </span>
                  <span className={cn('text-[10px] font-mono font-bold', isSelected ? 'text-amber-200' : 'text-emerald-600 dark:text-emerald-400')}>
                    {item.surplus}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Leaflet Interactive Map Viewport ─────────────────────────── */}
        <div className="relative flex-1 w-full overflow-hidden bg-muted/30">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Floating Map Layer Switcher & Zoom Controls (Top Right) */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border shadow-md">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="size-6 grid place-items-center rounded-lg text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="size-6 grid place-items-center rounded-lg text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Zoom Out"
              >
                −
              </button>
            </div>

            <div className="flex items-center gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border shadow-md">
              {(['road', 'satellite', 'terrain'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMapStyle(style)}
                  title={`Switch map layer to Google ${style}`}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer',
                    mapStyle === style
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {style === 'road' ? 'Road' : style === 'satellite' ? 'Sat' : 'Terrain'}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Highway Telemetry Pill (Bottom Left) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg px-2.5 py-1.5 flex items-center gap-2 text-[11px] pointer-events-none">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="font-extrabold text-foreground">{corridor.name}</strong>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-muted-foreground">{liveRoute?.formattedDuration || corridor.transitHours}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-primary font-bold">Toll: ₹{corridor.toll}</span>
          </div>
        </div>

        {/* ── Google Maps Style Drive Bar (Matching Reference Image) ───────── */}
        <div className="p-3 sm:p-3.5 bg-card border-t border-border z-20 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-foreground">Drive</span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm sm:text-base font-mono">
                  {liveRoute?.formattedDuration || corridor.transitHours}
                </span>
                <span className="text-muted-foreground font-semibold text-xs sm:text-sm">
                  ({liveRoute?.distanceKm || corridor.distanceKm} km)
                </span>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${resolvedCoords[0]},${resolvedCoords[1]}&destination=${corridor.targetCoords[0]},${corridor.targetCoords[1]}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Navigation className="size-3.5" />
              <span>Start in Google Maps</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-muted-foreground border-t border-border/40 pt-1.5">
            <span className="flex items-center gap-1 text-[11px]">
              Fastest route now via <strong className="text-foreground">{corridor.highway}</strong> · FASTag: ₹{corridor.toll}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">FASTag Active</span>
              <span>·</span>
              <span>{corridor.weatherStatus.split(' · ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Expansive Map Modal (When Maximize clicked) ─────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[85vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/25">
                  <Navigation className="size-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    Western India Agri-Freight Corridor Radar
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Direct Highway Route: {originLocation} → {corridor.name} ({corridor.distanceKm} km via {corridor.highway})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="grid size-8 place-items-center rounded-xl bg-muted hover:bg-muted-foreground/20 text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Corridor Switcher */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 border-b border-border">
              {switcherMandis.map((mandi) => {
                const isSelected = activeMandi === mandi
                const item = corridors[mandi]
                if (!item) return null
                return (
                  <button
                    key={mandi}
                    type="button"
                    onClick={() => handleSelectCorridor(mandi)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left flex items-center justify-between transition-all',
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-card hover:bg-muted text-foreground'
                    )}
                  >
                    <div>
                      <p className="font-extrabold text-xs">{item.name}</p>
                      <p className={cn('text-[10px] font-mono', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                        {item.distanceKm} km · {item.transitHours}
                      </p>
                    </div>
                    <span className={cn('text-xs font-mono font-black', isSelected ? 'text-amber-200' : 'text-primary')}>
                      {item.surplus}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Modal Content Details */}
            <div className="p-4 grid gap-4 sm:grid-cols-4 bg-muted/20 border-b border-border text-xs">
              <div className="card-minimal bg-card p-3">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Transit Highway</span>
                <strong className="text-sm font-bold text-foreground mt-0.5 block">{corridor.highway}</strong>
                <span className="text-[10px] text-emerald-600 font-semibold">Toll clearance guaranteed</span>
              </div>
              <div className="card-minimal bg-card p-3">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Estimated Freight Time</span>
                <strong className="text-sm font-bold text-foreground mt-0.5 block">{corridor.transitHours}</strong>
                <span className="text-[10px] text-muted-foreground">{corridor.speedLimit}</span>
              </div>
              <div className="card-minimal bg-card p-3">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Toll & FASTag</span>
                <strong className="text-sm font-bold text-primary mt-0.5 block">₹{corridor.toll} Total</strong>
                <span className="text-[10px] text-muted-foreground">{corridor.tollPlaza}</span>
              </div>
              <div className="card-minimal bg-card p-3">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Weather Risk</span>
                <strong className="text-sm font-bold text-sky mt-0.5 block">{corridor.weatherStatus}</strong>
                <span className="text-[10px] text-emerald-600 font-semibold">Zero moisture hazard</span>
              </div>
            </div>

            {/* Modal Waypoints Table */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Corridor Telemetry & Waypoints (Origin: {originLocation})
              </h4>
              <div className="grid gap-2">
                {corridor.waypoints.map((wp, i) => (
                  <div key={wp.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="size-6 rounded-full bg-primary/10 text-primary font-mono font-bold grid place-items-center text-xs">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{wp.title}</p>
                        <p className="text-[11px] text-muted-foreground">{wp.detail}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                      {wp.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono text-[11px]">
                Origin Coords: {resolvedCoords[0].toFixed(4)}°N, {resolvedCoords[1].toFixed(4)}°E
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="button-primary !min-h-[36px] !px-4 text-xs font-bold"
              >
                Close Full Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
