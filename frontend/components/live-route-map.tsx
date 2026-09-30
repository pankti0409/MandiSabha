'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Navigation, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  CloudSun, 
  Radio, 
  Compass, 
  CheckCircle2, 
  Layers, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Sparkles,
  Info,
  TrendingUp,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveRouteMapProps {
  originLocation?: string
  targetMandi?: string
  onSelectMandi?: (mandi: string) => void
  className?: string
  initialHeight?: string
  compact?: boolean
}

interface CorridorData {
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

const corridorData: Record<string, CorridorData> = {
  'Surat APMC': {
    name: 'Surat APMC',
    shortName: 'Surat',
    highway: 'NH48 Freight Expressway',
    distanceKm: 142,
    transitHours: '3.5 hrs',
    toll: 240,
    tollPlaza: 'Manor Toll Plaza',
    weatherStatus: 'Clear 31°C · 0% Rain Risk',
    speedLimit: '80 km/h Limit',
    surplus: '+₹8,200',
    modalRate: '₹2,140/q',
    originCoords: [19.9975, 73.7898],
    targetCoords: [21.1702, 72.8311],
    bounds: [[19.80, 72.60], [21.35, 74.00]],
    routePath: [
      [19.9975, 73.7898], // Nashik
      [20.0800, 73.6500],
      [20.2100, 73.4000],
      [20.3500, 73.1200],
      [20.4400, 72.9500], // Manor Toll
      [20.6100, 72.9300], // Vapi
      [20.8500, 72.9300], // Navsari
      [21.0500, 72.8700],
      [21.1702, 72.8311], // Surat APMC
    ],
    waypoints: [
      {
        id: 'origin',
        title: 'Nashik Farm Origin Hub',
        type: 'origin',
        coords: [19.9975, 73.7898],
        badge: 'Dispatch Point',
        detail: 'Farm Gate Loading Bay · Certified Electronic Weighbridge',
      },
      {
        id: 'toll-1',
        title: 'Manor Toll Plaza (NH48)',
        type: 'toll',
        coords: [20.4400, 72.9500],
        badge: 'FASTag ₹240',
        detail: 'Commercial Lane 4 Clear · Avg 45s clearance',
      },
      {
        id: 'weather-1',
        title: 'Navsari Weather Radar',
        type: 'weather',
        coords: [20.8500, 72.9300],
        badge: 'Dry 31°C · 0% Rain',
        detail: 'IMD Station Telemetry · 0% moisture risk on transit load',
      },
      {
        id: 'truck-1',
        title: 'Fleet Pilot #402 (Active Dispatch)',
        type: 'truck',
        coords: [20.6100, 72.9300],
        badge: 'Transit · 64 km/h',
        detail: '1.5T Bolero Pickup · ETA 1 hr 45 min to Surat Gate 2',
      },
      {
        id: 'target',
        title: 'Surat APMC Market Yard',
        type: 'target',
        coords: [21.1702, 72.8311],
        badge: '₹2,140/q (+₹8,200)',
        detail: 'Gate 2 Auction Floor · High Export Demand · Instant APMC Settlement',
      },
    ],
  },
  'Pune Market Yard': {
    name: 'Pune Market Yard',
    shortName: 'Pune',
    highway: 'NH60 Industrial Corridor',
    distanceKm: 188,
    transitHours: '4.2 hrs',
    toll: 290,
    tollPlaza: 'Sangamner Toll Gate',
    weatherStatus: 'Partly Cloudy 28°C · Dry Surface',
    speedLimit: '75 km/h Limit',
    surplus: '+₹3,800',
    modalRate: '₹1,850/q',
    originCoords: [19.9975, 73.7898],
    targetCoords: [18.4967, 73.8643],
    bounds: [[18.30, 73.50], [20.15, 74.45]],
    routePath: [
      [19.9975, 73.7898], // Nashik
      [19.8200, 73.9500], // Sinnar
      [19.5772, 74.2081], // Sangamner
      [19.3200, 74.1500], // Alephata
      [19.0800, 73.9800], // Narayangaon
      [18.7800, 73.8800], // Chakan
      [18.6200, 73.8400], // Bhosari
      [18.4967, 73.8643], // Pune Market Yard
    ],
    waypoints: [
      {
        id: 'origin',
        title: 'Nashik Farm Origin Hub',
        type: 'origin',
        coords: [19.9975, 73.7898],
        badge: 'Dispatch Point',
        detail: 'Farm Gate Loading Bay',
      },
      {
        id: 'toll-1',
        title: 'Sangamner Toll Plaza',
        type: 'toll',
        coords: [19.5772, 74.2081],
        badge: 'FASTag ₹160',
        detail: 'Smooth transit · No freight queues',
      },
      {
        id: 'toll-2',
        title: 'Narayangaon Checkpost',
        type: 'toll',
        coords: [19.0800, 73.9800],
        badge: 'FASTag ₹130',
        detail: 'Agri corridor clearance verified',
      },
      {
        id: 'truck-1',
        title: 'Fleet Pilot #118',
        type: 'truck',
        coords: [19.3200, 74.1500],
        badge: 'Transit · 58 km/h',
        detail: '5T Eicher Pro · Approaching Alephata',
      },
      {
        id: 'target',
        title: 'Pune Market Yard (Gultekdi)',
        type: 'target',
        coords: [18.4967, 73.8643],
        badge: '₹1,850/q (+₹3,800)',
        detail: 'Terminal Gate · Rapid direct-to-buyer settlement',
      },
    ],
  },
  'Ahmedabad APMC': {
    name: 'Ahmedabad APMC',
    shortName: 'Ahmedabad',
    highway: 'NH48 & NE1 Expressway',
    distanceKm: 260,
    transitHours: '5.5 hrs',
    toll: 410,
    tollPlaza: 'Vadodara Expressway Toll',
    weatherStatus: 'Sunny & Hot 34°C · Dry Road',
    speedLimit: '90 km/h Limit',
    surplus: '+₹3,300',
    modalRate: '₹1,980/q',
    originCoords: [19.9975, 73.7898],
    targetCoords: [23.0225, 72.5714],
    bounds: [[19.70, 72.30], [23.30, 73.60]],
    routePath: [
      [19.9975, 73.7898], // Nashik
      [20.4400, 72.9500],
      [21.1702, 72.8311], // Surat
      [21.7000, 73.0100], // Bharuch
      [22.3072, 73.1812], // Vadodara NE1
      [22.6800, 72.8500], // Nadiad
      [23.0225, 72.5714], // Ahmedabad APMC
    ],
    waypoints: [
      {
        id: 'origin',
        title: 'Nashik Farm Origin Hub',
        type: 'origin',
        coords: [19.9975, 73.7898],
        badge: 'Dispatch Point',
        detail: 'Farm Gate Loading Bay',
      },
      {
        id: 'toll-1',
        title: 'Surat Bypass Toll',
        type: 'toll',
        coords: [21.1702, 72.8311],
        badge: 'FASTag ₹180',
        detail: 'Flyover bypass operational',
      },
      {
        id: 'toll-2',
        title: 'Vadodara NE1 Express Toll',
        type: 'toll',
        coords: [22.3072, 73.1812],
        badge: 'FASTag ₹230',
        detail: 'Automated high-speed FASTag lane',
      },
      {
        id: 'truck-1',
        title: 'Fleet Pilot #709',
        type: 'truck',
        coords: [21.7000, 73.0100],
        badge: 'Transit · 72 km/h',
        detail: '10T Multi-axle on NE1 Expressway',
      },
      {
        id: 'target',
        title: 'Ahmedabad APMC (Jamalpur)',
        type: 'target',
        coords: [23.0225, 72.5714],
        badge: '₹1,980/q (+₹3,300)',
        detail: 'Largest volume Northern terminal',
      },
    ],
  },
}

export function LiveRouteMap({
  originLocation = 'Nashik, Maharashtra',
  targetMandi = 'Surat APMC',
  onSelectMandi,
  className,
  initialHeight = 'h-[380px]',
  compact = false,
}: LiveRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  const [activeMandi, setActiveMandi] = useState<string>(targetMandi)
  const [mapStyle, setMapStyle] = useState<'voyager' | 'dark' | 'satellite'>('voyager')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)

  // Sync with prop
  useEffect(() => {
    if (targetMandi && corridorData[targetMandi]) {
      setActiveMandi(targetMandi)
    }
  }, [targetMandi])

  const corridor = corridorData[activeMandi] || corridorData['Surat APMC']

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
        center: [20.60, 73.30],
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      const tileUrls = {
        voyager: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }

      const tileLayer = L.tileLayer(tileUrls[mapStyle], {
        maxZoom: 18,
      }).addTo(map)
      tileLayerRef.current = tileLayer

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup

      if (isMounted) {
        setIsMapReady(true)
      }

      // Ensure proper sizing after DOM layout
      setTimeout(() => map.invalidateSize(), 100)
      setTimeout(() => map.invalidateSize(), 300)
    }

    initMap()

    // Resize observer to auto-adapt to any container layout shifts
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

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    import('leaflet').then((LModule) => {
      const L = LModule.default
      const tileUrls = {
        voyager: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }

      if (tileLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current)
        tileLayerRef.current = L.tileLayer(tileUrls[mapStyle], {
          maxZoom: 18,
        }).addTo(mapInstanceRef.current)
      }
    })
  }, [mapStyle])

  // Update Route Polyline and Markers when corridor changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !isMapReady) return

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
                🛑 ${wp.badge}
              </div>
            </div>
          `
        } else if (wp.type === 'weather') {
          iconHtml = `
            <div class="custom-map-pin flex items-center justify-center">
              <div class="px-2 py-0.5 rounded-md bg-sky-950/95 text-sky-300 border border-sky-400/50 shadow-md text-[10px] font-sans font-bold whitespace-nowrap">
                ⛅ ${wp.badge}
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

      // Smooth pan and fit bounds
      map.flyToBounds(corridor.bounds, {
        padding: [35, 35],
        duration: 0.7,
      })

      setTimeout(() => map.invalidateSize(), 200)
    })
  }, [activeMandi, isMapReady, corridor])

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

        {/* ── Dedicated 3-Column Mandi Switcher Strip (No Cutoff / No Ugly Scrollbar) ── */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 border-b border-border z-20">
          {Object.keys(corridorData).map((mandi) => {
            const isSelected = activeMandi === mandi
            const item = corridorData[mandi]
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

          {/* Floating Map Layer Switcher (Top Right) */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border shadow-md">
            {(['voyager', 'dark', 'satellite'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setMapStyle(style)}
                title={`Switch map layer to ${style}`}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all',
                  mapStyle === style
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {style === 'voyager' ? 'Road' : style === 'dark' ? 'Dark' : 'Sat'}
              </button>
            ))}
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
            <span>Backend GIS Telemetry: Ready for API Stream</span>
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
              {Object.keys(corridorData).map((mandi) => {
                const isSelected = activeMandi === mandi
                const item = corridorData[mandi]
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
                Corridor Telemetry & Waypoints
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
                Backend GIS Router: Telematics stream will link to live vehicle GPS coordinates
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
