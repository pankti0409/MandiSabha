'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { 
  ArrowRight, 
  Check, 
  CircleDot, 
  MapPin, 
  Pause, 
  Play, 
  RotateCcw, 
  Truck, 
  Users, 
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  Share2,
  Calendar
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { formatINR, formatNumber } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'
import { LiveRouteMap } from '@/components/live-route-map'

type Mandi = { name: string; state: string; price: number; freight: number; net: number; distance: string; color: string; advantage: number }
const mandis: Mandi[] = [
  { name: 'Surat APMC', state: 'Gujarat', price: 2140, freight: 6200, net: 36600, distance: '142 km', color: '#0F6B47', advantage: 8200 },
  { name: 'Pune Market Yard', state: 'Maharashtra', price: 1850, freight: 4800, net: 32200, distance: '188 km', color: '#0284C7', advantage: 3800 },
  { name: 'Ahmedabad APMC', state: 'Gujarat', price: 1980, freight: 7900, net: 31700, distance: '260 km', color: '#D97706', advantage: 3300 },
  { name: 'Lasalgaon (Local)', state: 'Maharashtra', price: 1620, freight: 1400, net: 31000, distance: '35 km', color: '#EA580C', advantage: 0 },
]

const agents = [
  { name: 'Price Scout', role: 'Mandi Arbitrage', desc: 'Comparing Surat, Pune, Ahmedabad live books' },
  { name: 'Route Planner', role: 'Logistics & Fuel', desc: 'Calculating NH48 tolls, diesel & driver freight' },
  { name: 'Weather Watch', role: 'Risk & Moisture', desc: 'Monitoring humidity & rainfall across transport corridor' },
  { name: 'Buyer Network', role: 'APMC Clearing', desc: 'Verifying verified commission agent cash settlements' },
  { name: 'Advisor Chair', role: 'Consensus Engine', desc: 'Synthesizing net payoff vs transit risks' },
]

export function SabhaLive({ id }: { id: string }) {
  const [progress, setProgress] = useState(15)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState<'Race' | 'Routes' | 'Log'>('Race')
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([])

  useEffect(() => {
    if (paused || done) return
    const timer = setInterval(() => {
      setProgress((value) => {
        const next = Math.min(value + 6, 100)
        if (next === 100) setDone(true)
        return next
      })
    }, 600)
    return () => clearInterval(timer)
  }, [paused, done])

  const activeAgentIndex = Math.min(Math.floor(progress / 22), agents.length - 1)
  const ranked = useMemo(() => [...mandis].sort((a, b) => b.net - a.net), [])

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Live Sabha Header ────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="section-kicker">Live Multi-Agent Sabha</span>
              <span>·</span>
              <span className="font-mono">#{id.replace('demo-', '').slice(0, 8)}</span>
            </div>
            <h1 className="page-title">
              Finding Your Best Mandi Deal.
            </h1>
            <p className="page-subtitle">
              Analyzing 20 quintals of Onions from Nashik · {progress}% computed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="status-pulse !size-2" /> 5 Agents Active
            </span>

            <button
              onClick={() => setPaused(!paused)}
              className="button-secondary !min-h-[42px] !px-4 text-xs font-bold"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              <span>{paused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </header>

        {/* ── Real-time Progress Bar ──────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className="text-primary flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              {done ? 'Consensus Reached!' : `Agent ${activeAgentIndex + 1} of 5: ${agents[activeAgentIndex].name} processing`}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-[#10B981] to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── 3-Column Live Workspace ─────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Column 1: Organized Sabha Agents Panel (Clean & Structured) */}
          <section className="card-luxury lg:col-span-3 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Sabha Agents</span>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                  {done ? '5/5 Done' : `${activeAgentIndex + 1}/5 Active`}
                </span>
              </div>
              <Users className="size-4 text-muted-foreground" />
            </div>

            {/* Unified Pipeline List (Organized & Minimal) */}
            <div className="rounded-xl border border-border/80 bg-background/60 divide-y divide-border/60 overflow-hidden shadow-2xs">
              {agents.map((agent, index) => {
                const isWorking = index === activeAgentIndex && !done
                const isFinished = index < activeAgentIndex || done

                return (
                  <div
                    key={agent.name}
                    className={cn(
                      'px-3 py-2.5 flex items-center justify-between gap-2.5 transition-colors',
                      isWorking ? 'bg-primary/10' : 'hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Minimal status indicator */}
                      <span className="grid size-5 place-items-center shrink-0">
                        {isFinished ? (
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                        ) : isWorking ? (
                          <span className="relative flex size-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className={cn('text-xs leading-tight truncate', isWorking ? 'font-bold text-primary' : 'font-semibold text-foreground')}>
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate leading-tight">
                          {agent.role}
                        </p>
                      </div>
                    </div>

                    {/* Compact Status Pill */}
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0',
                        isFinished
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isWorking
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isFinished ? 'Ready' : isWorking ? 'Active' : 'Queued'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Bottom Consensus Status Footer */}
            <div className="rounded-lg bg-card/70 border border-border/70 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <span className={cn('size-1.5 rounded-full', done ? 'bg-emerald-500' : 'bg-primary animate-pulse')} />
                {done ? 'Consensus Validated' : 'Simulating Arbitrage'}
              </span>
              <span className="font-mono text-[10px] font-bold text-primary">
                {done ? '100% Ready' : `${progress}%`}
              </span>
            </div>
          </section>

          {/* Column 2: Net Realization Live Race & Corridor Radar (6 cols) */}
          <section className="card-luxury lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <span className="font-bold text-sm text-foreground">
                    {tab === 'Race' ? 'Race to Maximum Net Profit' : 'Live Highway Corridor Radar'}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {tab === 'Race' ? 'Revenue minus freight, tolls, and loading' : 'Interactive GIS telemetry & FASTag route'}
                  </p>
                </div>
                
                {/* View Switcher: Race vs Radar */}
                <div className="flex items-center gap-1 rounded-xl bg-background border border-border p-0.5 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setTab('Race')}
                    className={cn(
                      'rounded-lg px-2.5 py-1 transition-all',
                      tab === 'Race' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Profit Race
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('Routes')}
                    className={cn(
                      'rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5',
                      tab === 'Routes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Corridor Radar</span>
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                </div>
              </div>

              {tab === 'Race' ? (
                <div className="mt-6 flex flex-col gap-5">
                  {ranked.map((mandi, idx) => {
                    const maxNet = 36600
                    const percent = Math.round((mandi.net / maxNet) * 100)
                    return (
                      <div key={mandi.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-foreground">
                            <span
                              className="grid size-5 place-items-center rounded-full text-[10px] text-white font-mono"
                              style={{ backgroundColor: mandi.color }}
                            >
                              {idx + 1}
                            </span>
                            {mandi.name} ({mandi.distance})
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {formatINR(mandi.price)}/q
                            </span>
                            <span className="font-mono font-extrabold text-foreground">
                              {formatINR(mandi.net)}
                            </span>
                          </div>
                        </div>

                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(percent * progress) / 100}%`,
                              backgroundColor: mandi.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Freight: {formatINR(mandi.freight)}</span>
                          {mandi.advantage > 0 && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatINR(mandi.advantage)} vs Local
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <LiveRouteMap targetMandi="Surat APMC" initialHeight="h-[360px]" className="border-0 shadow-none p-0" />
                </div>
              )}
            </div>

            <div className="mt-6 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2.5 text-xs text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" />
              <span>Direct highway routes Nashik → Surat NH48 verified clear of transit delays.</span>
            </div>
          </section>

          {/* Column 3: Live Agent Transcripts & Synthesis (3 cols) */}
          <section className="card-luxury lg:col-span-3 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-bold text-sm text-foreground">Live Transcript</span>
                <Truck className="size-4 text-muted-foreground" />
              </div>

              <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                {[
                  { sender: 'Price Scout', text: 'Surat APMC onion modal surged to ₹2,140/q on high export demand.' },
                  { sender: 'Route Planner', text: 'Nashik-Surat freight estimated at ₹6,200 via 1.5T pickup.' },
                  { sender: 'Weather Watch', text: 'Clear weather on Western corridor. Zero rainfall risk.' },
                  { sender: 'Advisor Chair', text: 'Surat net payout ₹36,600 delivers +₹8,200 pure surplus.' },
                  ...chatMessages,
                ]
                  .slice(0, Math.max(1, Math.ceil((progress / 100) * 4) + chatMessages.length))
                  .map((msg, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-3 text-xs flex flex-col gap-1 animate-in fade-in duration-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                        {msg.sender}
                      </span>
                      <p className="text-foreground leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
              </div>

              {/* Interactive Quick Questions */}
              <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Ask Sabha Agent:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { q: 'Rain risk on NH48?', a: 'Weather Watch: NH48 corridor is 100% dry. No transit cover needed.' },
                    { q: 'Hold till Friday?', a: 'Price Scout: Arrivals expected to increase by 30% Friday. Sell today.' },
                  ].map((item) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => {
                        setChatMessages((prev) => [
                          ...prev,
                          { sender: 'Farmer', text: item.q },
                          { sender: 'Agent Answer', text: item.a },
                        ])
                      }}
                      className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground hover:border-primary transition-all text-left"
                    >
                      {item.q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {done && (
              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  href={`/sabha/${id}/result`}
                  className="button-primary !min-h-[44px] w-full text-xs font-bold shadow-lg shadow-primary/25 hover:scale-105"
                >
                  <span>Inspect Final Recommendation</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

export function ResultPage({ id }: { id: string }) {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Result Header ───────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="section-kicker !mb-0">CONSENSUS VERDICT</span>
              <span>·</span>
              <span className="font-mono">#{id.replace('demo-', '').slice(0, 8)}</span>
            </div>
            <h1 className="page-title">
              Surat APMC is Your Winning Move.
            </h1>
            <p className="page-subtitle">
              Delivers maximum in-hand return with lowest transit degradation risk.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="button-secondary !min-h-[36px] !px-3 text-xs font-semibold"
            >
              <Printer className="size-3.5" />
              <span>Print Slip</span>
            </button>
            <Link
              href="/sabha/new"
              className="button-primary !min-h-[36px] !px-4 text-xs font-semibold"
            >
              <RotateCcw className="size-3.5" />
              <span>New Sabha</span>
            </Link>
          </div>
        </header>

        {/* ── Key Decision Banner ─────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Main Recommendation Hero (8 cols) */}
          <div className="card-luxury lg:col-span-8 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="section-kicker">Primary Destination</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" /> 100% Agent Unanimity
                </span>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-normal text-foreground">
                    Surat APMC
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    20 quintals Onion · ₹2,140/q modal rate · 142 km via NH48
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="block text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatINR(36600)}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    +₹8,200 surplus vs local Nashik sale
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 grid gap-3 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Gross Revenue</span>
                <strong className="text-sm font-semibold text-foreground tabular-nums">{formatINR(42800)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Transport & Tolls</span>
                <strong className="text-sm font-semibold text-orange-600 tabular-nums">- {formatINR(6200)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Net In-Hand Payout</span>
                <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatINR(36600)}</strong>
              </div>
            </div>
          </div>

          {/* Confidence & Verification (4 cols) */}
          <div className="card-luxury lg:col-span-4 flex flex-col justify-between p-4">
            <div>
              <span className="section-kicker">Sabha Confidence Gauge</span>
              <h3 className="mt-1 font-display text-base font-bold text-foreground">94% Confidence</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluated against road transit, toll checkpoints, and historical price volatility.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Price Arbitrage Spread</span>
                  <span className="text-primary tabular-nums">+24%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[94%]" />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold mt-1">
                  <span>Weather & Highway Safety</span>
                  <span className="text-sky tabular-nums">100% Clear</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-sky rounded-full w-full" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">Authorized APMC Yard</span>
              <span className="font-semibold text-primary flex items-center gap-1 text-[11px]">
                <ShieldCheck className="size-3.5" /> Verified Clearing
              </span>
            </div>
          </div>
        </div>

        {/* ── Winning Route & Corridor Radar ─────────────────────────── */}
        <section className="flex flex-col gap-2.5">
          <div>
            <span className="section-kicker">Transit Telematics</span>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground">
              Winning Corridor Radar & Logistics Route
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified route from Nashik farm hub to Surat APMC Gate 2 via NH48 Express corridor
            </p>
          </div>
          <LiveRouteMap targetMandi="Surat APMC" initialHeight="h-[390px]" />
        </section>

        {/* ── Mandi Breakdown Comparison Table ────────────────────────── */}
        <section className="card-luxury flex flex-col gap-3">
          <div className="pb-3 border-b border-border/70 flex items-center justify-between">
            <div>
              <span className="section-kicker">All Evaluated Routes</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                Mandi Payout Matrix
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Mandi</th>
                  <th>Location</th>
                  <th>Quoted Rate</th>
                  <th>Total Gross</th>
                  <th>Freight Toll</th>
                  <th>Net Realized</th>
                  <th>Net Advantage</th>
                </tr>
              </thead>
              <tbody>
                {mandis.map((m, idx) => (
                  <tr key={m.name} className={cn(idx === 0 && 'bg-primary/5 font-bold')}>
                    <td>
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] text-white uppercase font-mono font-bold">Best</span>}
                        <span className="text-foreground">{m.name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{m.state} ({m.distance})</td>
                    <td className="font-mono text-foreground">{formatINR(m.price)}/q</td>
                    <td className="font-mono text-foreground">{formatINR(m.price * 20)}</td>
                    <td className="font-mono text-orange-600">- {formatINR(m.freight)}</td>
                    <td className="font-mono font-extrabold text-foreground">{formatINR(m.net)}</td>
                    <td>
                      <span className={cn('font-mono font-bold', m.advantage > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                        {m.advantage > 0 ? `+${formatINR(m.advantage)}` : 'Baseline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
