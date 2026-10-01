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
  const [mapStyle, setMapStyle] = useState<'voyager' | 'dark' | 'satellite'>('voyager')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)

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

      const tileUrls: Record<string, string> = {
        voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }

      const initialUrl = tileUrls[mapStyle] || tileUrls.voyager
      const tileLayer = L.tileLayer(initialUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; CARTO &copy; OpenStreetMap',
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
    const tileUrls: Record<string, string> = {
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    }

    const newUrl = tileUrls[mapStyle]
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
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(mapInstanceRef.current)
      })
    }
  }, [mapStyle])

  // Update Route Polyline and Markers when corridor or resolvedCoords change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !isMapReady || !corridor) return

    import('leaflet').then((LModule) => {
      const L = LModule.default
      const map = mapInstanceRef.current
      const layerGroup = layerGroupRef.current
      if (!map || !layerGroup) return

      layerGroup.clearLayers()

      // 1. Draw glowing Route Polyline
      L.polyline(corridor.routePath, {
        color: '#0F6B47',
        weight: 9,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup)

      L.polyline(corridor.routePath, {
        color: '#10B981',
        weight: 4.5,
        opacity: 0.95,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup)

      // 2. Add Waypoint Markers
      corridor.waypoints.forEach((wp) => {
        let iconHtml = ''

        if (wp.type === 'origin') {
          iconHtml = `
            <div class="custom-map-pin relative flex items-center justify-center">
              <span class="beacon-pulse bg-emerald-500/40"></span>
              <div class="size-8 rounded-full bg-emerald-700 border-2 border-white shadow-xl flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>
          `
        } else if (wp.type === 'target') {
          iconHtml = `
            <div class="custom-map-pin relative flex items-center justify-center">
              <span class="beacon-pulse bg-amber-500/40"></span>
              <div class="px-2.5 py-1 rounded-full bg-amber-600 border-2 border-white shadow-2xl flex items-center gap-1.5 text-white font-black text-[11px] whitespace-nowrap">
                <span class="size-2 rounded-full bg-white animate-ping"></span>
                <span>${wp.badge}</span>
              </div>
            </div>
          `
        } else if (wp.type === 'toll') {
          iconHtml = `
            <div class="custom-map-pin flex items-center justify-center">
              <div class="px-2 py-0.5 rounded-md bg-stone-900/95 text-amber-400 border border-amber-400/50 shadow-md text-[10px] font-mono font-bold whitespace-nowrap">
                ${wp.badge}
              </div>
            </div>
          `
        } else if (wp.type === 'weather') {
          iconHtml = `
            <div class="custom-map-pin flex items-center justify-center">
              <div class="px-2 py-0.5 rounded-md bg-sky-950/95 text-sky-300 border border-sky-400/50 shadow-md text-[10px] font-sans font-bold whitespace-nowrap">
                ${wp.badge}
              </div>
            </div>
          `
        } else if (wp.type === 'truck') {
          iconHtml = `
            <div class="custom-map-pin relative flex items-center justify-center">
              <div class="size-7 rounded-full bg-primary text-white border-2 border-white shadow-xl flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
            </div>
          `
        }

        const divIcon = L.divIcon({
          html: iconHtml,
          className: 'leaflet-clean-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        const marker = L.marker(wp.coords, { icon: divIcon }).addTo(layerGroup)

        const popupContent = `
          <div class="flex flex-col gap-1 text-xs p-1">
            <span class="font-extrabold text-foreground text-sm">${wp.title}</span>
            <span class="text-primary font-bold font-mono text-xs">${wp.badge}</span>
            <p class="text-muted-foreground text-[11px] leading-snug mt-0.5">${wp.detail}</p>
          </div>
        `

        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: [0, -12],
        })
      })

      // Smooth pan and fit bounds around new origin & destination
      map.flyToBounds(corridor.bounds, {
        padding: [35, 35],
        duration: 0.7,
      })

      setTimeout(() => map.invalidateSize(), 200)
    })
  }, [corridor, isMapReady])

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
              {(['voyager', 'dark', 'satellite'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMapStyle(style)}
                  title={`Switch map layer to ${style}`}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer',
                    mapStyle === style
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {style === 'voyager' ? 'Road' : style === 'dark' ? 'Dark' : 'Sat'}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Highway Telemetry Pill (Bottom Left) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg px-2.5 py-1.5 flex items-center gap-2 text-[11px] pointer-events-none">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="font-extrabold text-foreground">{corridor.name}</strong>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-muted-foreground">{corridor.transitHours}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-primary font-bold">Toll: ₹{corridor.toll}</span>
          </div>
        </div>

        {/* ── Bottom Telemetry & Backend Integration Banner ─────────────── */}
        <div className="px-3.5 py-2 bg-gradient-to-r from-card to-background border-t border-border z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Truck className="size-3 text-primary" /> {corridor.speedLimit}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CloudSun className="size-3 text-sky" /> {corridor.weatherStatus}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="size-3" /> FASTag Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>GPS Calibrated: {resolvedCoords[0].toFixed(3)}°N, {resolvedCoords[1].toFixed(3)}°E</span>
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
