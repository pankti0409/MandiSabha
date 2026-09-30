'use client'

import { useState } from 'react'
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
  Calendar
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { allCrops, createSabha, formatINR, type Crop } from '@/lib/api/sabha'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { VoiceAssistantModal } from '@/components/voice-assistant-modal'
import { LiveRouteMap } from '@/components/live-route-map'
import { cn } from '@/lib/utils'

export default function NewSabhaPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [crop, setCrop] = useState<Crop>('Onion')
  const [quantity, setQuantity] = useState(20)
  const [location, setLocation] = useState(user?.village ? `${user.village}, ${user.district || 'Maharashtra'}` : 'Nashik, Maharashtra')
  const [urgency, setUrgency] = useState<'today' | 'soon' | 'week'>('today')
  const getTodayISO = () => new Date().toISOString().split('T')[0]
  const [targetDate, setTargetDate] = useState<string>(getTodayISO())
  const [activeTimingPreset, setActiveTimingPreset] = useState<'today' | 'soon' | 'week' | 'custom'>('today')

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
  const [selectedMandiTarget, setSelectedMandiTarget] = useState('Surat APMC')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const selectedCropObj = allCrops.find((item) => item.name === crop) || allCrops[0]
  const visibleCrops = allCrops.filter((item) => `${item.name} ${item.local}`.toLowerCase().includes(search.toLowerCase()))

  // Quality multiplier
  const gradeMultiplier = qualityGrade === 'A' ? 1.05 : qualityGrade === 'B' ? 1.0 : 0.92
  const baseRate = Math.round(selectedCropObj.price * gradeMultiplier)

  const totalKg = quantity * 100
  const grossEstimated = baseRate * quantity
  const distanceKm = selectedMandiTarget === 'Surat APMC' ? 142 : selectedMandiTarget === 'Pune Market Yard' ? 188 : 260
  const estimatedFreight = Math.round(distanceKm * (vehicle === 'pickup' ? 7 : vehicle === 'truck' ? 12 : 18) * 1.6)
  const netEstimated = Math.max(0, grossEstimated - estimatedFreight)
  const localBenchmark = Math.round(selectedCropObj.price * 0.81 * quantity)
  const netSurplus = Math.max(0, netEstimated - localBenchmark)

  async function submit() {
    setLoading(true)
    try {
      const sabha = await createSabha({
        crop,
        quantity,
        location,
        urgency,
        targetDate,
        radius,
        vehicleType: vehicle,
      })
      router.push(`/sabha/${sabha.id}`)
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
            <span className="section-kicker">NEW SESSION CONVENER</span>
            <h1 className="page-title">
              Start a New Mandi Sabha.
            </h1>
            <p className="page-subtitle">
              Provide your crop specifications. 5 AI agents will simultaneously analyze price spreads, weather risks, and transport logistics.
            </p>
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
                  Select Commodity / Crop
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1 text-xs">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search crops..."
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
                            {item.name}
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
                          {formatINR(item.price)}/q
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
                  Volume (Quintals)
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
                    <span className="text-xs font-bold text-muted-foreground ml-1">quintals</span>
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
                  Crop Grade & Moisture
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { grade: 'A', label: 'Grade A (Top)', bonus: '+5%' },
                    { grade: 'B', label: 'Grade B (Modal)', bonus: '0%' },
                    { grade: 'C', label: 'Grade C (Fair)', bonus: '-8%' },
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
                  Effective rate: <strong className="font-mono text-primary font-bold">{formatINR(baseRate)}/q</strong>
                </p>
              </div>
            </div>

            {/* Step 3: Location, Vehicle & Urgency */}
            <div className="card-luxury flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">4</span>
                    Farm Origin
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 h-11">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none font-medium"
                      placeholder="e.g. Niphad, Nashik"
                    />
                    <button type="button" className="text-primary hover:scale-110 transition-transform" title="GPS Auto-detect">
                      <LocateFixed className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Step 5: Sale Timing & Target Dispatch Date */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">5</span>
                      Target Sale & Dispatch Date
                    </label>
                    <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {formatDisplayDate(targetDate)}
                    </span>
                  </div>

                  {/* Preset Quick Timing Options */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'today', label: 'Immediately', sub: 'Today', offset: 0 },
                      { id: 'soon', label: 'In 2–3 Days', sub: 'Short Notice', offset: 3 },
                      { id: 'week', label: 'Next Week', sub: 'Harvest Window', offset: 7 },
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
                      title="Click to select specific sale date from calendar"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold shrink-0 uppercase tracking-wider">
                      Pick Date
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle selector */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-muted-foreground">Transport Vehicle</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pickup', label: 'Pickup (1.5 Ton)', rate: '₹7/km' },
                    { id: 'truck', label: 'Medium (5 Ton)', rate: '₹12/km' },
                    { id: 'heavy', label: 'Heavy (10 Ton)', rate: '₹18/km' },
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
              targetMandi={selectedMandiTarget}
              onSelectMandi={setSelectedMandiTarget}
            />

            {/* Live Financial Breakdown Card */}
            <div className="card-luxury relative overflow-hidden bg-gradient-to-b from-card to-primary/5 flex flex-col gap-4">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground pb-3 border-b border-border">
                Live Payoff Calculator
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gross Value ({quantity}q @ {formatINR(baseRate)}/q)</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatINR(grossEstimated)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Freight ({distanceKm} km)</span>
                  <span className="font-semibold text-orange-600 tabular-nums">- {formatINR(estimatedFreight)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Local Mandi Baseline</span>
                  <span className="font-medium text-muted-foreground tabular-nums">{formatINR(localBenchmark)}</span>
                </div>

                <div className="pt-3 border-t border-border/70 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-foreground">Estimated Net In-Hand</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatINR(netEstimated)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mt-0.5">
                    <span>Pure Arbitrage Surplus:</span>
                    <span className="tabular-nums font-bold">+{formatINR(netSurplus)}</span>
                  </div>
                </div>
              </div>

              {/* Radius Range Slider */}
              <div className="pt-3 border-t border-border/70 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Search Radius Filter</span>
                  <span className="text-primary font-bold">{radius} km</span>
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
                  <span>Calling Mandi Sabha Agents…</span>
                ) : (
                  <>
                    <span>Convene 5-Agent Sabha</span>
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
