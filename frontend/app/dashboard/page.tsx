'use client'

import Link from 'next/link'
import { 
  ArrowUpRight, 
  CloudSun, 
  Leaf, 
  MapPin, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Truck, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { formatINR, formatNumber, getDashboardData } from '@/lib/api/sabha'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [activeRange, setActiveRange] = useState<'3M' | '6M' | '1Y'>('6M')
  const [selectedBar, setSelectedBar] = useState<number | null>(5)

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  if (!data) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-12 w-96 rounded-2xl bg-muted" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-3xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-80 rounded-3xl bg-muted lg:col-span-2" />
            <div className="h-80 rounded-3xl bg-muted" />
          </div>
        </div>
      </AppShell>
    )
  }

  const userCrops = user?.crops && user.crops.length > 0 ? user.crops : ['Onion', 'Wheat', 'Soybean']

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Dashboard Greeting Banner ─────────────────────────────────── */}
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end border-b border-border/80 pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="section-kicker !mb-0">DASHBOARD OVERVIEW</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {user?.village || 'Nashik'}, {user?.district || 'Maharashtra'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(new Date())}
              </span>
            </div>

            <h1 className="page-title">
              Good morning, {user?.name?.split(' ')[0] || 'Ramesh'}.
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <TrendingUp className="size-3.5" />
                Surat mandi onion up +4.2% · Best dispatch window open
              </p>
              <div className="flex items-center gap-1">
                {userCrops.map((c) => (
                  <span key={c} className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/sabha/new"
              className="button-primary button-large"
            >
              <Plus className="size-3.5" />
              <span>Start New Sabha</span>
            </Link>
          </div>
        </header>

        {/* ── 4-Column Metric Stat Cards ───────────────────────────────── */}
        <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1: Total Realized Extra Earned */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                ₹
              </span>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                +22% vs Local
              </span>
            </div>
            <p className="stat-label-clean">
              Total Extra Earned
            </p>
            <div className="mt-1 stat-number-clean">
              {formatINR(15800)}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Direct net gain after freight deductions
            </p>
          </div>

          {/* Stat 2: Active & Completed Sabhas */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="size-3.5" />
              </span>
              <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                4 Sessions
              </span>
            </div>
            <p className="stat-label-clean">
              Sabhas Convened
            </p>
            <div className="mt-1 stat-number-clean">
              {data.sessions.length}
            </div>
            <p className="mt-0.5 text-[11px] text-primary font-medium">
              +2 sessions this harvest cycle
            </p>
          </div>

          {/* Stat 3: Best Winning Mandi */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-sky/10 text-sky">
                <Truck className="size-3.5" />
              </span>
              <span className="rounded-md bg-sky/10 border border-sky/20 px-2 py-0.5 text-[10px] font-semibold text-sky">
                50% Win Rate
              </span>
            </div>
            <p className="stat-label-clean">
              Top Mandi Partner
            </p>
            <div className="mt-1 stat-number-clean truncate">
              Surat APMC
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Avg. +₹410/q higher than Nashik local
            </p>
          </div>

          {/* Stat 4: Live Agmarknet Feed */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CloudSun className="size-3.5" />
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="status-pulse !size-1.5" />
                Live Feed
              </span>
            </div>
            <p className="stat-label-clean">
              Agmarknet Sync
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="stat-number-clean">24</span>
              <span className="text-xs font-normal text-muted-foreground">Mandis</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Real-time prices refreshed 8 mins ago
            </p>
          </div>
        </section>

        {/* ── Wide Analytics Grid: Earning Story + Mandi Winners ───────── */}
        <section className="grid gap-5 lg:grid-cols-12">
          {/* Earning Story (8 cols) */}
          <article className="card-luxury lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                <div>
                  <span className="section-kicker">Financial Growth</span>
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                    Extra Realized Over Time
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cumulative profit unlocked by multi-agent logistics & price arbitrage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs font-semibold">
                    {(['3M', '6M', '1Y'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setActiveRange(range)
                          setSelectedBar(range === '3M' ? 2 : 5)
                        }}
                        className={cn(
                          'rounded-md px-2.5 py-1 transition-all',
                          activeRange === range ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Bar Visualization with Guidelines and Comparison Bars */}
              <div className="mt-4 relative pt-6 pb-2">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-border/70 border-dashed w-full flex justify-end">
                    <span className="text-[9.5px] font-mono text-muted-foreground -mt-3.5 pr-1">₹16k</span>
                  </div>
                  <div className="border-b border-border/70 border-dashed w-full flex justify-end">
                    <span className="text-[9.5px] font-mono text-muted-foreground -mt-3.5 pr-1">₹12k</span>
                  </div>
                  <div className="border-b border-border/70 border-dashed w-full flex justify-end">
                    <span className="text-[9.5px] font-mono text-muted-foreground -mt-3.5 pr-1">₹8k</span>
                  </div>
                  <div className="border-b border-border/70 border-dashed w-full flex justify-end">
                    <span className="text-[9.5px] font-mono text-muted-foreground -mt-3.5 pr-1">₹4k</span>
                  </div>
                  <div className="border-b border-border w-full flex justify-end">
                    <span className="text-[9.5px] font-mono text-muted-foreground -mt-3.5 pr-1">₹0</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 flex items-end justify-between gap-3 sm:gap-6 h-48 px-2 sm:px-4">
                  {(activeRange === '3M' ? data.monthlyData.slice(-3) : data.monthlyData).map((item, index, arr) => {
                    const isSelected = selectedBar === index || (selectedBar === null && index === arr.length - 1)
                    const earnedHeight = Math.max(16, Math.min(100, Math.round((item.earned / 16000) * 100)))
                    const baselineHeight = Math.max(12, Math.round((item.earned * 0.62 / 16000) * 100))

                    return (
                      <div
                        key={item.month}
                        onClick={() => setSelectedBar(index)}
                        className="group flex-1 flex flex-col items-center justify-end h-full cursor-pointer relative"
                      >
                        {/* Tooltip on Hover / Active */}
                        <div
                          className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-mono font-semibold text-background shadow-lg transition-all pointer-events-none z-20',
                            isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                          )}
                        >
                          +{formatINR(item.earned)} · {item.sabhas} sabhas
                        </div>

                        {/* Dual Bars: Local Baseline vs Net Realized Profit */}
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-[140px] pb-1">
                          {/* Local Baseline Bar (grey/slate) */}
                          <div
                            className="w-2.5 sm:w-3.5 rounded-t-md bg-muted-foreground/20 group-hover:bg-muted-foreground/30 transition-all duration-300"
                            style={{ height: `${baselineHeight}%` }}
                            title={`Local Baseline: ${formatINR(Math.round(item.earned * 0.62))}`}
                          />

                          {/* Net Realized Profit Bar (primary emerald gradient) */}
                          <div
                            className={cn(
                              'w-3 sm:w-6 rounded-t-md transition-all duration-300',
                              isSelected
                                ? 'bg-gradient-to-t from-primary via-emerald-500 to-emerald-400 shadow-md shadow-primary/30 ring-1 ring-primary'
                                : 'bg-primary/50 group-hover:bg-primary/80'
                            )}
                            style={{ height: `${earnedHeight}%` }}
                            title={`Net Realized: ${formatINR(item.earned)}`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className={cn('text-[11px] font-medium transition-colors pt-1.5', isSelected ? 'text-primary font-bold' : 'text-muted-foreground')}>
                          {item.month}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground font-medium text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Net Realized Profit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-border-strong" /> Local Baseline
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-primary">
                Peak month: Sep 2026 (+₹15,800)
              </p>
            </div>
          </article>

          {/* Mandi Winners & Frequency (4 cols) */}
          <article className="card-luxury lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-border/70">
                <span className="section-kicker">Arbitrage Performance</span>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                  Where You Win
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best dispatch recommendations by Mandi
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {data.winners.map((mandi, idx) => (
                  <div key={mandi.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {mandi.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px] tabular-nums">{mandi.avgGain} gain</span>
                        <span className="text-primary font-semibold text-xs tabular-nums">{mandi.percent}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-accent' : idx === 2 ? 'bg-sky' : 'bg-muted-foreground'
                        )}
                        style={{ width: `${mandi.percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Best crop: {mandi.crop}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">Surat remains #1 highest return</span>
              <Link href="/explore" className="font-semibold text-primary hover:underline flex items-center gap-1 text-xs">
                Explore mandis <ArrowRight className="size-3" />
              </Link>
            </div>
          </article>
        </section>

        {/* ── Market Pulse Ticker & Start Direct Sabha ─────────────────── */}
        <section className="flex flex-col gap-3.5">
          <div className="flex items-end justify-between">
            <div>
              <span className="section-kicker">Live Commodity Radar</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                Today&apos;s Modal Prices
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All 24 Mandis</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {data.pulse.map((item) => {
              const isPositive = item.change > 0
              return (
                <div
                  key={item.crop}
                  className="card-luxury p-3.5 flex flex-col justify-between hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">{item.crop}</span>
                    <span
                      className={cn(
                        'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                        isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600'
                      )}
                    >
                      {isPositive ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                      {isPositive ? '+' : ''}{item.change}%
                    </span>
                  </div>

                  <div>
                    <div className="stat-number-clean">
                      {formatINR(item.price)}
                      <span className="ml-0.5 text-xs text-muted-foreground font-normal">/q</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Best at {item.mandi}
                    </p>
                  </div>

                  {/* Sparkline Visual */}
                  <div className="mt-3 flex items-end gap-1 h-7 border-b border-border/40 pb-0.5">
                    {item.trend.map((val, i) => {
                      const minVal = Math.min(...item.trend)
                      const maxVal = Math.max(...item.trend)
                      const height = maxVal === minVal ? 50 : ((val - minVal) / (maxVal - minVal)) * 80 + 20
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-t-xs transition-all',
                            isPositive ? 'bg-primary/35 group-hover:bg-primary' : 'bg-orange-400/35 group-hover:bg-orange-500'
                          )}
                          style={{ height: `${height}%` }}
                        />
                      )
                    })}
                  </div>

                  <Link
                    href={`/sabha/new?crop=${item.crop}`}
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border/70 bg-background py-1.5 text-[11.5px] font-medium text-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                  >
                    <span>Analyze {item.crop}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Recent Sabha Sessions & Activity Table ──────────────────── */}
        <section className="card-luxury">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div>
              <span className="section-kicker">Audit Trail</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                Recent Sabha Sessions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every negotiated trade, route calculation, and verified gain record
              </p>
            </div>
            <Link
              href="/history"
              className="button-secondary !min-h-[34px] !px-3 !text-xs font-semibold"
            >
              <span>View Full History</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Session & Crop</th>
                  <th>Quantity</th>
                  <th>Destination Mandi</th>
                  <th>Distance</th>
                  <th>Modal Price</th>
                  <th>Net Extra Earned</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id} className="group cursor-pointer">
                    <td>
                      <div>
                        <span className="font-semibold text-foreground block text-xs">{session.crop}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{session.date}</span>
                      </div>
                    </td>
                    <td className="font-mono font-semibold text-xs text-foreground">
                      {session.quantity} quintals
                      <small className="block text-[10px] text-muted-foreground font-normal">
                        ≈ {session.quantity * 100} kg
                      </small>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs text-foreground">
                        <MapPin className="size-3 text-primary" />
                        {session.mandi}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">
                      {session.distance}
                    </td>
                    <td className="font-mono font-semibold text-xs text-foreground">
                      {formatINR(session.pricePerQ)}/q
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        +{formatINR(session.gain)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          session.status === 'Ready to Dispatch'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        <CheckCircle2 className="size-3" />
                        {session.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href="/sabha/demo-result"
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        <span>View Slip</span>
                        <ArrowUpRight className="size-3" />
                      </Link>
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
