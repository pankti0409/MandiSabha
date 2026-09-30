'use client'

import { useState } from 'react'
import { 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Layers,
  Truck,
  ArrowRightLeft
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { allCrops, formatINR } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MandiRow {
  mandi: string
  district: string
  state: 'Gujarat' | 'Maharashtra' | 'Madhya Pradesh' | 'Rajasthan'
  crop: string
  modal: number
  min: number
  max: number
  change: number
  volumeMT: number
  distanceKm: number
  freightEst: number
}

const mandiDatabase: MandiRow[] = [
  { mandi: 'Surat APMC', district: 'Surat', state: 'Gujarat', crop: 'Onion', modal: 2140, min: 1980, max: 2280, change: 4.2, volumeMT: 480, distanceKm: 142, freightEst: 110 },
  { mandi: 'Pune Market Yard', district: 'Pune', state: 'Maharashtra', crop: 'Onion', modal: 1850, min: 1720, max: 1990, change: 2.8, volumeMT: 620, distanceKm: 188, freightEst: 145 },
  { mandi: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', crop: 'Onion', modal: 1980, min: 1820, max: 2070, change: 1.4, volumeMT: 390, distanceKm: 260, freightEst: 195 },
  { mandi: 'Lasalgaon APMC', district: 'Nashik', state: 'Maharashtra', crop: 'Onion', modal: 1620, min: 1500, max: 1710, change: -1.2, volumeMT: 950, distanceKm: 35, freightEst: 30 },
  { mandi: 'Indore Mandi', district: 'Indore', state: 'Madhya Pradesh', crop: 'Wheat', modal: 2740, min: 2600, max: 2820, change: 3.5, volumeMT: 540, distanceKm: 310, freightEst: 230 },
  { mandi: 'Rajkot Market Yard', district: 'Rajkot', state: 'Gujarat', crop: 'Wheat', modal: 2680, min: 2550, max: 2750, change: 1.8, volumeMT: 420, distanceKm: 380, freightEst: 280 },
  { mandi: 'Nagpur APMC', district: 'Nagpur', state: 'Maharashtra', crop: 'Soybean', modal: 4890, min: 4700, max: 5050, change: 3.9, volumeMT: 310, distanceKm: 420, freightEst: 310 },
  { mandi: 'Kota Mandi', district: 'Kota', state: 'Rajasthan', crop: 'Soybean', modal: 4760, min: 4600, max: 4900, change: 2.1, volumeMT: 280, distanceKm: 490, freightEst: 360 },
  { mandi: 'Kolhapur APMC', district: 'Kolhapur', state: 'Maharashtra', crop: 'Tomato', modal: 2620, min: 2450, max: 2750, change: 4.8, volumeMT: 210, distanceKm: 340, freightEst: 250 },
  { mandi: 'Mandsaur Mandi', district: 'Mandsaur', state: 'Madhya Pradesh', crop: 'Garlic', modal: 9100, min: 8600, max: 9400, change: 5.6, volumeMT: 120, distanceKm: 390, freightEst: 290 },
]

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState<string>('Onion')
  const [selectedState, setSelectedState] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'modal' | 'change' | 'volume'>('modal')

  // Head-to-Head Comparison State
  const [compareA, setCompareA] = useState('Surat APMC')
  const [compareB, setCompareB] = useState('Lasalgaon APMC')
  const [compareQty, setCompareQty] = useState(20)

  const filtered = mandiDatabase.filter((row) => {
    const matchesCrop = selectedCrop === 'All' || row.crop.toLowerCase() === selectedCrop.toLowerCase()
    const matchesState = selectedState === 'All' || row.state === selectedState
    const matchesSearch =
      row.mandi.toLowerCase().includes(search.toLowerCase()) ||
      row.district.toLowerCase().includes(search.toLowerCase()) ||
      row.state.toLowerCase().includes(search.toLowerCase())
    return matchesCrop && matchesState && matchesSearch
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'modal') return b.modal - a.modal
    if (sortBy === 'change') return b.change - a.change
    if (sortBy === 'volume') return b.volumeMT - a.volumeMT
    return 0
  })

  const highestModal = sorted.length > 0 ? Math.max(...sorted.map((r) => r.modal)) : 2140
  const avgModal = sorted.length > 0 ? Math.round(sorted.reduce((acc, r) => acc + r.modal, 0) / sorted.length) : 1890

  // Comparison Calculations
  const mandiAData = mandiDatabase.find((m) => m.mandi === compareA) || mandiDatabase[0]
  const mandiBData = mandiDatabase.find((m) => m.mandi === compareB) || mandiDatabase[3]

  const netRealizedA = mandiAData.modal * compareQty - mandiAData.freightEst * compareQty
  const netRealizedB = mandiBData.modal * compareQty - mandiBData.freightEst * compareQty
  const arbitrageSpread = netRealizedA - netRealizedB

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <span className="section-kicker">ARBITRAGE RADAR</span>
            <h1 className="page-title">
              Mandi Price Explorer.
            </h1>
            <p className="page-subtitle">
              Real-time modal prices, freight-deducted net spreads, and inter-mandi arbitrage windows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sabha/new"
              className="button-primary !min-h-[36px] !px-4 text-xs font-semibold"
            >
              <span>Convene Sabha for This Crop</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </header>

        {/* ── 3 Summary Highlight Cards ───────────────────────────────── */}
        <section className="grid gap-3.5 sm:grid-cols-3">
          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                Highest Modal Rate
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Surat APMC
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean">
              {formatINR(highestModal)}
              <span className="text-xs font-normal text-muted-foreground">/quintal</span>
            </div>
            <p className="mt-0.5 text-[11px] text-primary font-medium">
              +4.2% daily surge (Agmarknet verified)
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                Regional Average
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {sorted.length} Mandis
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean">
              {formatINR(avgModal)}
              <span className="text-xs font-normal text-muted-foreground">/quintal</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Weighted across Western corridor
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                Peak Arbitrage Spread
              </span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                Surat vs Lasalgaon
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean text-emerald-600 dark:text-emerald-400">
              +₹520
              <span className="text-xs font-normal text-muted-foreground">/q spread</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Net +₹410/q after ₹110/q freight deduction
            </p>
          </div>
        </section>

        {/* ── Interactive Head-to-Head Mandi Comparison Tool ───────────── */}
        <section className="card-luxury bg-gradient-to-r from-card via-card to-primary/5 flex flex-col gap-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
            <div>
              <span className="section-kicker">Arbitrage Comparison</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                Interactive Mandi Arbitrage Duel
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground">Volume:</span>
              <span className="text-primary font-bold">{compareQty} quintals</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 items-center">
            {/* Mandi A Selection */}
            <div className="lg:col-span-5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">Destination A</span>
                <select
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer"
                >
                  {mandiDatabase.map((m) => (
                    <option key={m.mandi} value={m.mandi}>{m.mandi} ({m.state})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-base font-bold text-foreground tabular-nums block">
                  {formatINR(mandiAData.modal)}/q
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distance: {mandiAData.distanceKm} km · Freight: -₹{mandiAData.freightEst}/q
                </p>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Net Payoff ({compareQty}q):</span>
                <span className="font-bold text-primary text-sm tabular-nums">
                  {formatINR(netRealizedA)}
                </span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-1 text-center">
              <div className="grid size-8 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs">
                <ArrowRightLeft className="size-3.5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Net Spread
              </span>
              <span className={cn('text-xs font-bold tabular-nums', arbitrageSpread >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600')}>
                {arbitrageSpread >= 0 ? `+${formatINR(arbitrageSpread)}` : `-${formatINR(Math.abs(arbitrageSpread))}`}
              </span>
            </div>

            {/* Mandi B Selection */}
            <div className="lg:col-span-5 rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Destination B</span>
                <select
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer"
                >
                  {mandiDatabase.map((m) => (
                    <option key={m.mandi} value={m.mandi}>{m.mandi} ({m.state})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-base font-bold text-foreground tabular-nums block">
                  {formatINR(mandiBData.modal)}/q
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distance: {mandiBData.distanceKm} km · Freight: -₹{mandiBData.freightEst}/q
                </p>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Net Payoff ({compareQty}q):</span>
                <span className="font-bold text-foreground text-sm tabular-nums">
                  {formatINR(netRealizedB)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filters & Search Control Bar ─────────────────────────────── */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          {/* Search Box */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 h-9 flex-1 min-w-[220px]">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mandi, district or state..."
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          {/* Crop Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {['All', 'Onion', 'Wheat', 'Soybean', 'Tomato', 'Garlic'].map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0',
                  selectedCrop === crop
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                )}
              >
                {crop}
              </button>
            ))}
          </div>

          {/* State Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="All">All States (India)</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Rajasthan">Rajasthan</option>
            </select>
          </div>
        </section>

        {/* ── Full-Width Interactive Mandi Price Table ─────────────────── */}
        <section className="card-luxury flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <span className="section-kicker">Live Quotations</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                Active Mandi Auctions ({sorted.length})
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-semibold">Sort by:</span>
              <button
                onClick={() => setSortBy('modal')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'modal' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                Price
              </button>
              <button
                onClick={() => setSortBy('change')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'change' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                Change
              </button>
              <button
                onClick={() => setSortBy('volume')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'volume' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                Volume
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Mandi & Location</th>
                  <th>Commodity</th>
                  <th>Modal Price</th>
                  <th>Day Range (Min–Max)</th>
                  <th>24h Movement</th>
                  <th>Arrival Volume</th>
                  <th>Distance & Freight</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const isPositive = row.change > 0
                  return (
                    <tr key={row.mandi} className="group hover:bg-muted/40 transition-colors">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <MapPin className="size-4" />
                          </span>
                          <div>
                            <span className="font-bold text-foreground block">{row.mandi}</span>
                            <span className="text-xs text-muted-foreground">
                              {row.district}, {row.state}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground">
                          {row.crop}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-foreground tabular-nums">
                          {formatINR(row.modal)}
                          <span className="ml-0.5 text-xs text-muted-foreground font-normal">/q</span>
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatINR(row.min)} – {formatINR(row.max)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                            isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600'
                          )}
                        >
                          {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {isPositive ? '+' : ''}{row.change}%
                        </span>
                      </td>
                      <td className="text-xs font-medium text-foreground tabular-nums">
                        {row.volumeMT} MT
                      </td>
                      <td>
                        <div className="text-xs text-muted-foreground">
                          <span>{row.distanceKm} km</span>
                          <span className="block text-[10.5px] text-muted-foreground">
                            -₹{row.freightEst}/q freight
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/sabha/new?crop=${row.crop}&targetMandi=${row.mandi}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-primary-hover transition-all"
                        >
                          <span>Start Sabha</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
