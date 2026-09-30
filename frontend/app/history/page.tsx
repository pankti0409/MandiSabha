'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Play, 
  Download, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  FileSpreadsheet,
  Printer,
  ChevronRight
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { formatINR } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'

interface HistorySession {
  id: string
  date: string
  crop: string
  quantity: number
  mandi: string
  state: string
  gain: number
  rate: number
  localRate: number
  status: 'Completed' | 'Ready to Dispatch'
  distance: string
}

const historyData: HistorySession[] = [
  { id: 'SB-2026-0929', date: '29 Sep 2026, 10:42 AM', crop: 'Onion', quantity: 20, mandi: 'Surat APMC', state: 'Gujarat', gain: 8200, rate: 2140, localRate: 1730, status: 'Ready to Dispatch', distance: '142 km' },
  { id: 'SB-2026-0918', date: '18 Sep 2026, 09:15 AM', crop: 'Wheat', quantity: 35, mandi: 'Pune Market Yard', state: 'Maharashtra', gain: 5600, rate: 2640, localRate: 2480, status: 'Completed', distance: '188 km' },
  { id: 'SB-2026-0909', date: '09 Sep 2026, 04:30 PM', crop: 'Tomato', quantity: 15, mandi: 'Ahmedabad APMC', state: 'Gujarat', gain: 4120, rate: 2480, localRate: 2200, status: 'Completed', distance: '260 km' },
  { id: 'SB-2026-0828', date: '28 Aug 2026, 11:20 AM', crop: 'Soybean', quantity: 25, mandi: 'Indore Mandi', state: 'Madhya Pradesh', gain: 6750, rate: 4750, localRate: 4480, status: 'Completed', distance: '310 km' },
]

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('All')

  const filtered = historyData.filter((s) => {
    const matchesCrop = selectedCrop === 'All' || s.crop === selectedCrop
    const matchesSearch =
      s.crop.toLowerCase().includes(search.toLowerCase()) ||
      s.mandi.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    return matchesCrop && matchesSearch
  })

  const totalGain = historyData.reduce((acc, s) => acc + s.gain, 0)

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <span className="section-kicker">Verified Record of Trades</span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Sabha Trade History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Audit trail of all multi-agent trade recommendations, freight deductions, and verified buyer slips.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('Exporting all trade records to Excel CSV...')}
              className="button-secondary !min-h-[44px] !px-4 text-xs font-bold"
            >
              <FileSpreadsheet className="size-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* ── Summary Stats ────────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="card-luxury p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Realized Gain
            </span>
            <strong className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatINR(totalGain)}
            </strong>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct surplus pocketed by choosing optimal mandis
            </p>
          </div>

          <div className="card-luxury p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Sabhas Convened
            </span>
            <strong className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
              {historyData.length} Sessions
            </strong>
            <p className="mt-1 text-xs text-primary font-semibold">
              Average surplus: +{formatINR(Math.round(totalGain / historyData.length))} / sabha
            </p>
          </div>

          <div className="card-luxury p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Buyer Trust Score
            </span>
            <strong className="mt-2 block font-mono text-3xl sm:text-4xl font-extrabold text-accent tabular-nums">
              99.4%
            </strong>
            <p className="mt-1 text-xs text-muted-foreground">
              Zero payment defaults on APMC electronic weighbridges
            </p>
          </div>
        </section>

        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 h-11 flex-1 w-full sm:w-auto">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search session ID, crop, or mandi..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['All', 'Onion', 'Wheat', 'Tomato', 'Soybean'].map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={cn(
                  'rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0',
                  selectedCrop === crop
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                )}
              >
                {crop}
              </button>
            ))}
          </div>
        </section>

        {/* ── Session List ────────────────────────────────────────────── */}
        <section className="card-luxury flex flex-col gap-4">
          <div className="pb-4 border-b border-border/70 flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold">
              Past Sabha Records ({filtered.length})
            </h2>
            <span className="text-xs text-muted-foreground">Click any record to inspect audit slip</span>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-border bg-card hover:border-primary/60 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-foreground">{session.crop}</h3>
                      <span className="text-xs font-mono font-bold text-muted-foreground">· {session.quantity} quintals</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {session.id}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {session.mandi}, {session.state} ({session.distance})
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {session.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/70">
                  <div className="text-left lg:text-right">
                    <span className="block font-mono text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatINR(session.gain)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatINR(session.rate)}/q vs local {formatINR(session.localRate)}/q
                    </span>
                  </div>

                  <Link
                    href="/sabha/demo-result"
                    className="button-secondary !min-h-[40px] !px-4 text-xs font-bold hover:border-primary shrink-0"
                  >
                    <span>View Dispatch Slip</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
