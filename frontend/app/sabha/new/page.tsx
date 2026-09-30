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
  Sparkles,
  Truck,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Mic,
  Navigation,
  CloudRain,
  Sliders,
  DollarSign
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { allCrops, createSabha, formatINR, type Crop } from '@/lib/api/sabha'
import { useRouter } from 'next/navigation'
import { VoiceAssistantModal } from '@/components/voice-assistant-modal'
import { cn } from '@/lib/utils'

export default function NewSabhaPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [crop, setCrop] = useState<Crop>('Onion')
  const [quantity, setQuantity] = useState(20)
  const [location, setLocation] = useState(user?.village ? `${user.village}, ${user.district || 'Maharashtra'}` : 'Nashik, Maharashtra')
  const [urgency, setUrgency] = useState<'today' | 'soon' | 'week'>('today')
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
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <span className="section-kicker">Multi-Agent Negotiation Desk</span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Start a New Mandi Sabha
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide your crop specifications. 5 AI agents will simultaneously analyze price spreads, weather risks, and transport logistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="flex items-center gap-2.5 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 to-emerald-500/10 px-5 py-3 text-xs sm:text-sm font-bold text-primary shadow-sm hover:scale-105 transition-all shimmer-badge"
            >
              <Mic className="size-4 animate-bounce text-accent" />
              <span>🎙️ Bolkar Shuru Karein (Voice AI)</span>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                {visibleCrops.map((item) => {
                  const isSelected = crop === item.name
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setCrop(item.name)}
                      className={cn(
                        'rounded-2xl border p-3.5 text-left transition-all flex flex-col justify-between group',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-md shadow-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="grid size-9 place-items-center rounded-xl font-bold font-display text-base transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                            color: item.color,
                          }}
                        >
                          {item.name.charAt(0)}
                        </span>
                        {isSelected && <Check className="size-4 text-primary stroke-[3]" />}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-foreground">{item.name}</span>
                        <span className="text-[11px] text-muted-foreground block truncate">{item.local}</span>
                        <span className="mt-1 block font-mono text-xs font-bold text-primary">
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
                      className="w-20 bg-transparent text-center font-mono text-2xl font-extrabold outline-none text-foreground"
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

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-white text-xs">5</span>
                    Sale Urgency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'soon', label: '2–3 Days' },
                      { id: 'week', label: 'This Week' },
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUrgency(u.id as any)}
                        className={cn(
                          'rounded-xl border py-2.5 text-xs font-bold transition-all text-center',
                          urgency === u.id ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {u.label}
                      </button>
                    ))}
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
            {/* Interactive Highway Route Map Card */}
            <div className="card-luxury relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Live Route & Toll Radar</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  NH48 Clear
                </span>
              </div>

              {/* Interactive Mandi Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['Surat APMC', 'Pune Market Yard', 'Ahmedabad APMC'].map((mandi) => (
                  <button
                    key={mandi}
                    type="button"
                    onClick={() => setSelectedMandiTarget(mandi)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0',
                      selectedMandiTarget === mandi
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {mandi.split(' ')[0]} ({mandi === 'Surat APMC' ? '142km' : mandi === 'Pune Market Yard' ? '188km' : '260km'})
                  </button>
                ))}
              </div>

              {/* Animated SVG Route Visualization */}
              <div className="relative h-44 w-full rounded-2xl border border-border bg-gradient-to-br from-background to-primary/5 p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <span className="size-2.5 rounded-full bg-primary" />
                    <span>Origin: Nashik</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-accent">
                    <span className="size-2.5 rounded-full bg-accent" />
                    <span>Target: {selectedMandiTarget}</span>
                  </div>
                </div>

                {/* Highway Route Arc */}
                <svg className="w-full h-16 my-auto" viewBox="0 0 300 60" fill="none">
                  <path
                    d="M 20 40 Q 150 5 280 40"
                    stroke="var(--border)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 40 Q 150 5 280 40"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="flow-route"
                  />
                  {/* Origin Node */}
                  <circle cx="20" cy="40" r="7" fill="var(--primary)" />
                  {/* Mid Toll Checkpoint */}
                  <circle cx="150" cy="22" r="5" fill="var(--accent)" />
                  {/* Destination Node */}
                  <circle cx="280" cy="40" r="7" fill="var(--accent)" />
                </svg>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground z-10 pt-1 border-t border-border/60">
                  <span className="flex items-center gap-1">
                    <Truck className="size-3.5 text-primary" /> Est. Transit: 3.5 hrs
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-primary">
                    Road Toll: ₹240
                  </span>
                </div>
              </div>
            </div>

            {/* Live Financial Breakdown Card */}
            <div className="card-luxury relative overflow-hidden bg-gradient-to-b from-card to-primary/5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground pb-3 border-b border-border">
                <Sparkles className="size-4 text-accent" />
                <span>Live Payoff Calculator</span>
              </div>

              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gross Value ({quantity}q @ {formatINR(baseRate)}/q)</span>
                  <strong className="font-mono text-base font-bold text-foreground">{formatINR(grossEstimated)}</strong>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Freight ({distanceKm} km)</span>
                  <strong className="font-mono text-sm text-orange-600">- {formatINR(estimatedFreight)}</strong>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Local Mandi Baseline</span>
                  <strong className="font-mono text-sm text-muted-foreground">{formatINR(localBenchmark)}</strong>
                </div>

                <div className="pt-3 border-t border-border flex flex-col gap-1">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-bold text-foreground">Estimated Net In-Hand</span>
                    <strong className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatINR(netEstimated)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-primary mt-1">
                    <span>Pure Arbitrage Surplus:</span>
                    <span className="font-mono text-sm font-extrabold">+{formatINR(netSurplus)}</span>
                  </div>
                </div>
              </div>

              {/* Radius Range Slider */}
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">Search Radius Filter</span>
                  <span className="font-mono text-primary font-extrabold">{radius} km</span>
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
                className="button-primary !min-h-[52px] w-full mt-2 text-sm font-extrabold shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span>Calling Mandi Sabha Agents…</span>
                ) : (
                  <>
                    <span>Convene 5-Agent Sabha</span>
                    <ArrowRight className="size-4 stroke-[3]" />
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
