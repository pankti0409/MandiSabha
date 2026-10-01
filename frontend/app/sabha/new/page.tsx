'use client'

import { useState, useEffect, Suspense } from 'react'
import { 
  ArrowRight, 
  Check, 
  ChevronDown, 
  LocateFixed, 
  MapPin, 
  Minus, 
  Plus, 
  Search,
  Truck,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Navigation,
  CloudRain,
  Sliders,
  DollarSign,
  Calendar,
  Loader2,
  Mic
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { allCrops, createSabha, formatINR, type Crop } from '@/lib/api/sabha'
import { detectUserLocation } from '@/lib/geolocation'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { VoiceAssistantModal } from '@/components/voice-assistant-modal'
import { LiveRouteMap } from '@/components/live-route-map'
import { cn } from '@/lib/utils'

function NewSabhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { t, tData, formatCurrency } = useLocale()

  const cropParam = searchParams.get('crop')
  const matchedCrop = cropParam
    ? allCrops.find((c) => c.name.toLowerCase() === cropParam.trim().toLowerCase())?.name
    : null

  const qtyParam = searchParams.get('quantity') || searchParams.get('qty')
  const initialQty = qtyParam && !isNaN(Number(qtyParam)) && Number(qtyParam) > 0 ? Number(qtyParam) : 20

  const locParam = searchParams.get('location') || searchParams.get('origin')
  const defaultLoc = user?.village
    ? `${user.village}, ${user.district || user.state || 'Maharashtra'}`
    : user?.district
    ? `${user.district}, ${user.state || 'Maharashtra'}`
    : 'Nashik, Maharashtra'
  const initialLoc = locParam || defaultLoc

  const urgencyParam = searchParams.get('urgency')
  const initialUrgency = (urgencyParam === 'today' || urgencyParam === 'soon' || urgencyParam === 'week') ? urgencyParam : 'today'

  const targetMandiParam = searchParams.get('targetMandi') || searchParams.get('mandi')
  const initialMandi = targetMandiParam || 'Surat APMC'

  const [crop, setCrop] = useState<Crop>(matchedCrop || 'Onion')
  const [quantity, setQuantity] = useState(initialQty)
  const [location, setLocation] = useState(initialLoc)
  const [urgency, setUrgency] = useState<'today' | 'soon' | 'week'>(initialUrgency)
  const getTodayISO = () => new Date().toISOString().split('T')[0]
  const [targetDate, setTargetDate] = useState<string>(getTodayISO())
  const [activeTimingPreset, setActiveTimingPreset] = useState<'today' | 'soon' | 'week' | 'custom'>(initialUrgency)

  // React to search parameter changes dynamically if user switches crop via link/radar
  useEffect(() => {
    const cParam = searchParams.get('crop')
    if (cParam) {
      const found = allCrops.find((c) => c.name.toLowerCase() === cParam.trim().toLowerCase())
      if (found) {
        setCrop(found.name)
      }
    }
    const qParam = searchParams.get('quantity') || searchParams.get('qty')
    if (qParam && !isNaN(Number(qParam)) && Number(qParam) > 0) {
      setQuantity(Number(qParam))
    }
    const lParam = searchParams.get('location') || searchParams.get('origin')
    if (lParam) {
      setLocation(lParam)
    }
    const uParam = searchParams.get('urgency')
    if (uParam === 'today' || uParam === 'soon' || uParam === 'week') {
      setUrgency(uParam)
      setActiveTimingPreset(uParam)
    }
    const mParam = searchParams.get('targetMandi') || searchParams.get('mandi')
    if (mParam) {
      setSelectedMandiTarget(mParam)
    }
  }, [searchParams])

  function handlePresetSelect(presetId: 'today' | 'soon' | 'week', offsetDays: number) {
    setActiveTimingPreset(presetId)
    setUrgency(presetId)
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    setTargetDate(d.toISOString().split('T')[0])
  }

  function handleCustomDateChange(selectedIso: string) {
    if (!selectedIso) return
    setTargetDate(selectedIso)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const selected = new Date(selectedIso + 'T00:00:00')
    const diffDays = Math.round((selected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      setUrgency('today')
      setActiveTimingPreset('today')
    } else if (diffDays <= 3) {
      setUrgency('soon')
      setActiveTimingPreset('soon')
    } else if (diffDays <= 7) {
      setUrgency('week')
      setActiveTimingPreset('week')
    } else {
      setUrgency('week')
      setActiveTimingPreset('custom')
    }
  }

  function formatDisplayDate(iso: string) {
    if (!iso) return 'Today'
    try {
      const d = new Date(iso + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 0) return 'Today, Immediate'
      if (diff === 1) return 'Tomorrow'
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
      return `${d.toLocaleDateString('en-IN', options)} (${diff > 0 ? `in ${diff}d` : 'Immediate'})`
    } catch {
      return iso
    }
  }

  const [radius, setRadius] = useState(200)
  const [vehicle, setVehicle] = useState<'pickup' | 'truck' | 'heavy'>('pickup')
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A')
  const [selectedMandiTarget, setSelectedMandiTarget] = useState(initialMandi)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locFeedback, setLocFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [originCoords, setOriginCoords] = useState<[number, number] | null>([22.3039, 70.8022])
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(36)

  // Geocode location input whenever user types a new farm location
  useEffect(() => {
    if (!location || !location.trim()) return
    let isCancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`)
        if (res.ok) {
          const data = await res.json()
          if (!isCancelled && data.lat && data.lon) {
            setOriginCoords([data.lat, data.lon])
            if (location.toLowerCase().includes('rajkot') || (Math.abs(data.lat - 22.3) < 0.5 && Math.abs(data.lon - 70.8) < 0.5)) {
              setSelectedMandiTarget('Gondal APMC')
              setRouteDistanceKm(36)
            }
          }
        }
      } catch {}
    }, 400)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [location])

  async function handleAutoDetectLocation() {
    setIsLocating(true)
    setLocFeedback(null)
    try {
      const res = await detectUserLocation()
      if (res.ok) {
        setLocation(res.formatted)
        if (res.lat && res.lon) {
          setOriginCoords([res.lat, res.lon])
        }
        setLocFeedback({ type: 'success', message: `Detected: ${res.formatted}` })
        setTimeout(() => setLocFeedback(null), 4500)
      } else {
        setLocFeedback({ type: 'error', message: res.error })
        setTimeout(() => setLocFeedback(null), 5000)
      }
    } catch {
      setLocFeedback({ type: 'error', message: 'Could not fetch GPS location.' })
      setTimeout(() => setLocFeedback(null), 5000)
    } finally {
      setIsLocating(false)
    }
  }

  const selectedCropObj = allCrops.find((item) => item.name === crop) || allCrops[0]
  const visibleCrops = allCrops.filter((item) => `${item.name} ${item.local}`.toLowerCase().includes(search.toLowerCase()))

  // Quality multiplier
  const gradeMultiplier = qualityGrade === 'A' ? 1.05 : qualityGrade === 'B' ? 1.0 : 0.92
  const baseRate = Math.round(selectedCropObj.price * gradeMultiplier)

  const totalKg = quantity * 100
  const grossEstimated = baseRate * quantity
  const distanceKm = routeDistanceKm || (selectedMandiTarget === 'Gondal APMC' ? 36 : selectedMandiTarget === 'Rajkot Market Yard' ? 6 : selectedMandiTarget === 'Morbi APMC' ? 68 : 36)
  const estimatedFreight = Math.round(distanceKm * (vehicle === 'pickup' ? 7 : vehicle === 'truck' ? 12 : 18) * 1.6)
  const netEstimated = Math.max(0, grossEstimated - estimatedFreight)
  const localBenchmark = Math.round(selectedCropObj.price * 0.81 * quantity)
  const netSurplus = Math.max(0, netEstimated - localBenchmark)

  async function submit() {
    setLoading(true)
    const effectiveLocation = location || 'Rajkot West Taluka, Rajkot'
    try {
      const sabha = await createSabha({
        crop,
        quantity,
        location: effectiveLocation,
        urgency,
        targetDate,
        radius,
        vehicleType: vehicle,
        originCoords: originCoords || [22.3039, 70.8022],
        targetMandi: selectedMandiTarget || 'Gondal APMC',
      })
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('latest_sabha', JSON.stringify({ ...sabha, crop, quantity, location: effectiveLocation, targetMandi: selectedMandiTarget }))
        } catch (e) {}
      }
      const query = new URLSearchParams({
        crop,
        qty: String(quantity),
        quantity: String(quantity),
        loc: effectiveLocation,
        location: effectiveLocation,
        rad: String(radius),
        veh: vehicle,
        targetMandi: selectedMandiTarget || '',
      }).toString()
      router.push(`/sabha/${sabha.id}?${query}`)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  function handleVoiceFill(data: { crop: string; quantity: number; location: string; urgency: 'today' | 'soon' | 'week' }) {
    if (allCrops.some((c) => c.name === data.crop)) {
      setCrop(data.crop as Crop)
    }
    setQuantity(data.quantity)
    setLocation(data.location)
    setUrgency(data.urgency)
    const offset = data.urgency === 'today' ? 0 : data.urgency === 'soon' ? 3 : 7
    handlePresetSelect(data.urgency, offset)

    const loc = (data.location || '').toLowerCase()
    if (loc.includes('rajkot') || loc.includes('gondal') || loc.includes('morbi')) {
      setSelectedMandiTarget('Gondal APMC')
      setRouteDistanceKm(36)
      setOriginCoords([22.3039, 70.8022])
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Voice Assistant Modal */}
        <VoiceAssistantModal
          isOpen={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onApply={handleVoiceFill}
        />

        {/* ── Page Header with Voice Trigger ───────────────────────────── */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <span className="section-kicker">{t('sabha.wizard.kicker')}</span>
            <h1 className="page-title">
              {t('sabha.wizard.title')}
            </h1>
            <p className="page-subtitle">
              {t('sabha.wizard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Voice Assistant (बोलकर भरें / બોલીને ભરો)"
            >
              <Mic className="size-4 animate-pulse" />
              <span>Voice Assistant (बोलकर भरें)</span>
            </button>
          </div>
        </header>

        {/* ── 2-Column Responsive Workbench ───────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Form Builder (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1: Crop Selection */}
            <div className="card-luxury flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">1</span>
                  {t('sabha.wizard.step_crop')}
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1 text-xs">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.actions.search')}
                    className="bg-transparent outline-none w-28 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1">
                {visibleCrops.map((item) => {
                  const isSelected = crop === item.name
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setCrop(item.name)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-all flex flex-col justify-between group relative select-none',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <span className="block text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {tData('crop', item.name)}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                            {item.local}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'size-4.5 rounded-full border grid place-items-center shrink-0 transition-all mt-0.5',
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-border/80 bg-background/80 group-hover:border-primary/60'
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">Modal</span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {formatCurrency(item.price)}/q
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Quality Grade & Quantity */}
            <div className="card-luxury grid gap-6 sm:grid-cols-2">
              {/* Quantity */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">2</span>
                  {t('sabha.wizard.step_quantity')}
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="icon-button shrink-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 5))}
                  >
                    <Minus className="size-4" />
                  </button>

                  <div className="flex flex-1 items-baseline justify-center rounded-2xl border border-border bg-background px-4 py-2.5">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 bg-transparent text-center text-xl font-bold tabular-nums outline-none text-foreground"
                    />
                    <span className="text-xs font-bold text-muted-foreground ml-1">{t('common.units.quintals')}</span>
                  </div>

                  <button
                    type="button"
                    className="icon-button shrink-0"
                    onClick={() => setQuantity(quantity + 5)}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[10, 20, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all',
                        quantity === preset ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {preset}q
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Grade */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">3</span>
                  {t('sabha.wizard.step_quality')}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { grade: 'A', label: t('sabha.wizard.grade_a_title'), bonus: '+5%' },
                    { grade: 'B', label: t('sabha.wizard.grade_b_title'), bonus: '0%' },
                    { grade: 'C', label: t('sabha.wizard.grade_c_title'), bonus: '-8%' },
                  ].map((g) => (
                    <button
                      key={g.grade}
                      type="button"
                      onClick={() => setQualityGrade(g.grade as any)}
                      className={cn(
                        'rounded-xl border p-2.5 text-center flex flex-col items-center justify-between transition-all',
                        qualityGrade === g.grade
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="font-bold text-xs">{g.grade}</span>
                      <span className="text-[10px] font-mono mt-1 opacity-90">{g.bonus}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {t('sabha.wizard.effective_rate', { rate: `${formatCurrency(baseRate)}/q` })}
                </p>
              </div>
            </div>

            {/* Step 3: Location, Vehicle & Urgency */}
            <div className="card-luxury flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">4</span>
                    {t('sabha.wizard.step_origin')}
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 h-11 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none font-medium placeholder:text-muted-foreground/60"
                      placeholder={t('sabha.wizard.step_origin_placeholder')}
                    />
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isLocating}
                      className="text-primary hover:scale-110 active:scale-95 transition-all p-1.5 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                      title={t('sabha.wizard.gps_locate')}
                    >
                      {isLocating ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <LocateFixed className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceOpen(true)}
                      className="text-primary hover:scale-110 active:scale-95 transition-all p-1.5 rounded-lg hover:bg-primary/10"
                      title="Voice Assistant (बोलकर भरें)"
                    >
                      <Mic className="size-4 animate-pulse" />
                    </button>
                  </div>
                  {locFeedback && (
                    <p
                      className={cn(
                        'text-xs font-medium flex items-center gap-1.5 transition-opacity',
                        locFeedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {locFeedback.type === 'success' ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      {locFeedback.message}
                    </p>
                  )}
                </div>

                {/* Step 5: Sale Timing & Target Dispatch Date */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">5</span>
                      {t('sabha.wizard.step_timing')}
                    </label>
                    <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {formatDisplayDate(targetDate)}
                    </span>
                  </div>

                  {/* Preset Quick Timing Options */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'today', label: t('sabha.wizard.preset_today'), sub: 'Today', offset: 0 },
                      { id: 'soon', label: t('sabha.wizard.preset_soon'), sub: '2–3 Days', offset: 3 },
                      { id: 'week', label: t('sabha.wizard.preset_week'), sub: 'Next Week', offset: 7 },
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handlePresetSelect(u.id as any, u.offset)}
                        className={cn(
                          'rounded-xl border py-2 px-1 text-center transition-all flex flex-col items-center justify-center',
                          activeTimingPreset === u.id
                            ? 'border-primary bg-primary text-white shadow-sm font-bold'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        )}
                      >
                        <span className="text-xs font-bold leading-tight">{u.label}</span>
                        <span className={cn('text-[10px] font-mono mt-0.5', activeTimingPreset === u.id ? 'text-white/80' : 'text-muted-foreground')}>
                          {u.sub}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Interactive Calendar Date Picker Input */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 h-10 transition-colors focus-within:border-primary">
                    <Calendar className="size-4 text-primary shrink-0" />
                    <input
                      type="date"
                      min={getTodayISO()}
                      value={targetDate}
                      onChange={(e) => handleCustomDateChange(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold outline-none text-foreground cursor-pointer"
                      title={t('sabha.wizard.preset_custom')}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold shrink-0 uppercase tracking-wider">
                      {t('sabha.wizard.preset_custom')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle selector */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-muted-foreground">{t('sabha.wizard.step_vehicle')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pickup', label: t('sabha.wizard.vehicle_pickup'), rate: '₹7/km' },
                    { id: 'truck', label: t('sabha.wizard.vehicle_truck'), rate: '₹12/km' },
                    { id: 'heavy', label: t('sabha.wizard.vehicle_heavy'), rate: '₹18/km' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicle(v.id as any)}
                      className={cn(
                        'rounded-xl border p-2.5 text-xs font-bold text-left transition-all',
                        vehicle === v.id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="block">{v.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{v.rate}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Live Interactive Economics & Highway Radar (5 cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            {/* Sophisticated Highway Route & Corridor Radar Map */}
            <LiveRouteMap
              originLocation={location}
              originCoords={originCoords || undefined}
              targetMandi={selectedMandiTarget}
              onSelectMandi={setSelectedMandiTarget}
              onDistanceChange={setRouteDistanceKm}
            />

            {/* Live Financial Breakdown Card */}
            <div className="card-luxury relative overflow-hidden bg-gradient-to-b from-card to-primary/5 flex flex-col gap-4">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground pb-3 border-b border-border">
                {t('sabha.wizard.payoff_title')}
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('sabha.wizard.gross_value', { qty: quantity, rate: `${formatCurrency(baseRate)}/q` })}</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(grossEstimated)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('sabha.wizard.est_freight', { distance: distanceKm })}</span>
                  <span className="font-semibold text-orange-600 tabular-nums">- {formatCurrency(estimatedFreight)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('sabha.wizard.local_baseline')}</span>
                  <span className="font-medium text-muted-foreground tabular-nums">{formatCurrency(localBenchmark)}</span>
                </div>

                <div className="pt-3 border-t border-border/70 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-foreground">{t('sabha.wizard.est_net')}</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(netEstimated)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mt-0.5">
                    <span>{t('sabha.wizard.arbitrage_surplus')}</span>
                    <span className="tabular-nums font-bold">+{formatCurrency(netSurplus)}</span>
                  </div>
                </div>
              </div>

              {/* Radius Range Slider */}
              <div className="pt-3 border-t border-border/70 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{t('sabha.wizard.step_radius', { radius })}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-[var(--primary)] cursor-pointer"
                />
              </div>

              {/* CTA Submit Button */}
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="button-primary !min-h-[40px] w-full mt-1 text-xs font-semibold"
              >
                {loading ? (
                  <span>{t('sabha.wizard.submitting')}</span>
                ) : (
                  <>
                    <span>{t('sabha.wizard.submit_convene')}</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default function NewSabhaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <NewSabhaContent />
    </Suspense>
  )
}
