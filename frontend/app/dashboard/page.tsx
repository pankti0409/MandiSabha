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
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end border-b border-border pb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-muted">
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

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Good morning, {user?.name?.split(' ')[0] || 'Ramesh'}.
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-0.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <TrendingUp className="size-3.5" />
                Surat mandi onion up +4.2% · Best dispatch window open
              </p>
              <div className="flex items-center gap-1.5">
                {userCrops.map((c) => (
                  <span key={c} className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/sabha/new"
              className="button-primary button-large"
            >
              <Plus className="size-4" />
              <span>Start New Sabha</span>
            </Link>
          </div>
        </header>

        {/* ── 4-Column Metric Stat Cards ───────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1: Total Realized Extra Earned */}
          <div className="card-luxury relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="size-16 text-accent" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-amber-500/10 text-accent font-display text-2xl font-black">
                ₹
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                +22% vs Local
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Extra Earned
            </p>
            <strong className="mt-1 block font-mono text-3xl sm:text-4xl font-black text-foreground tabular-nums">
              {formatINR(15800)}
            </strong>
            <p className="mt-2 text-xs text-muted-foreground">
              Direct net gain after freight deductions
            </p>
          </div>

          {/* Stat 2: Active & Completed Sabhas */}
          <div className="card-luxury relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <Leaf className="size-16 text-primary" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Leaf className="size-6" />
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
                4 Sessions
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sabhas Convened
            </p>
            <strong className="mt-1 block font-mono text-3xl sm:text-4xl font-black text-foreground tabular-nums">
              {data.sessions.length}
            </strong>
            <p className="mt-2 text-xs text-primary font-semibold">
              +2 sessions this harvest cycle
            </p>
          </div>

          {/* Stat 3: Best Winning Mandi */}
          <div className="card-luxury relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <Truck className="size-16 text-sky" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-sky/10 text-sky">
                <Truck className="size-6" />
              </span>
              <span className="rounded-full bg-sky/10 px-2.5 py-1 text-[11px] font-extrabold text-sky">
                50% Win Rate
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Top Mandi Partner
            </p>
            <strong className="mt-1 block font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
              Surat APMC
            </strong>
            <p className="mt-2 text-xs text-muted-foreground">
              Avg. +₹410/q higher than Nashik local
            </p>
          </div>

          {/* Stat 4: Live Agmarknet Feed */}
          <div className="card-luxury relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <CloudSun className="size-16 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CloudSun className="size-6" />
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                <span className="status-pulse !size-2" />
                Live Feed
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Agmarknet Sync
            </p>
            <strong className="mt-1 block font-mono text-2xl sm:text-3xl font-extrabold text-foreground">
              24 Mandis
            </strong>
            <p className="mt-2 text-xs text-muted-foreground">
              Real-time prices refreshed 8 mins ago
            </p>
          </div>
        </section>

        {/* ── Wide Analytics Grid: Earning Story + Mandi Winners ───────── */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Earning Story (8 cols) */}
          <article className="card-luxury lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
                <div>
                  <span className="section-kicker">Financial Growth</span>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
                    Extra Realized Over Time
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cumulative profit unlocked by multi-agent logistics & price arbitrage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-border bg-background p-1 text-xs font-bold">
                    {(['3M', '6M', '1Y'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setActiveRange(range)}
                        className={cn(
                          'rounded-lg px-3 py-1 transition-all',
                          activeRange === range ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Bar Visualization */}
              <div className="mt-8 flex items-end justify-between gap-3 sm:gap-6 h-56 px-2 border-b border-border/70 pb-4">
                {data.monthlyData.map((item, index) => {
                  const isSelected = selectedBar === index
                  const heightPercent = Math.max(16, (item.earned / 16000) * 100)
                  return (
                    <div
                      key={item.month}
                      onClick={() => setSelectedBar(index)}
                      className="group flex-1 flex flex-col items-center gap-2 cursor-pointer relative"
                    >
                      {/* Tooltip on Hover / Active */}
                      <div
                        className={cn(
                          'absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-foreground px-3 py-1.5 text-xs font-mono font-bold text-background shadow-xl transition-all pointer-events-none z-10',
                          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                        )}
                      >
                        {formatINR(item.earned)} · {item.sabhas} sabhas
                      </div>

                      {/* Bar Fill */}
                      <div className="w-full max-w-[48px] h-full flex items-end">
                        <div
                          className={cn(
                            'w-full rounded-t-xl transition-all duration-300',
                            isSelected
                              ? 'bg-gradient-to-t from-primary to-[#10B981] shadow-lg shadow-primary/30'
                              : 'bg-primary/25 group-hover:bg-primary/50'
                          )}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Month Label */}
                      <span className={cn('text-xs font-bold transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
              <div className="flex items-center gap-4 text-muted-foreground font-medium">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-primary" /> Net Realized Profit
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-border-strong" /> Local Baseline
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-primary">
                Peak month: Sep 2026 (+₹15,800)
              </p>
            </div>
          </article>

          {/* Mandi Winners & Frequency (4 cols) */}
          <article className="card-luxury lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-border/70">
                <span className="section-kicker">Arbitrage Performance</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold">
                  Where You Win
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best dispatch recommendations by Mandi
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                {data.winners.map((mandi, idx) => (
                  <div key={mandi.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-foreground">
                        <span className="size-2 rounded-full bg-primary" />
                        {mandi.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">{mandi.avgGain} gain</span>
                        <span className="font-mono text-primary">{mandi.percent}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
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

            <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Surat remains #1 highest return</span>
              <Link href="/explore" className="font-bold text-primary hover:underline flex items-center gap-1">
                Explore mandis <ArrowRight className="size-3" />
              </Link>
            </div>
          </article>
        </section>

        {/* ── Market Pulse Ticker & Start Direct Sabha ─────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="section-kicker">Live Commodity Radar</span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                Today&apos;s Modal Prices
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All 24 Mandis</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {data.pulse.map((item) => {
              const isPositive = item.change > 0
              return (
                <div
                  key={item.crop}
                  className="card-luxury p-5 flex flex-col justify-between hover:border-primary transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-foreground">{item.crop}</span>
                    <span
                      className={cn(
                        'flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold',
                        isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600'
                      )}
                    >
                      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {isPositive ? '+' : ''}{item.change}%
                    </span>
                  </div>

                  <div>
                    <strong className="block font-mono text-2xl font-extrabold text-foreground tabular-nums">
                      {formatINR(item.price)}
                      <small className="ml-1 text-xs font-sans text-muted-foreground font-normal">/q</small>
                    </strong>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Best at {item.mandi}
                    </p>
                  </div>

                  {/* Sparkline Visual */}
                  <div className="mt-4 flex items-end gap-1 h-8 border-b border-border/50 pb-1">
                    {item.trend.map((val, i) => {
                      const minVal = Math.min(...item.trend)
                      const maxVal = Math.max(...item.trend)
                      const height = maxVal === minVal ? 50 : ((val - minVal) / (maxVal - minVal)) * 80 + 20
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-t-sm transition-all',
                            isPositive ? 'bg-primary/40 group-hover:bg-primary' : 'bg-orange-400/40 group-hover:bg-orange-500'
                          )}
                          style={{ height: `${height}%` }}
                        />
                      )
                    })}
                  </div>

                  <Link
                    href={`/sabha/new?crop=${item.crop}`}
                    className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-border bg-background py-2 text-xs font-bold text-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
            <div>
              <span className="section-kicker">Audit Trail</span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                Recent Sabha Sessions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every negotiated trade, route calculation, and verified gain record
              </p>
            </div>
            <Link
              href="/history"
              className="button-secondary !min-h-[38px] !px-4 !text-xs font-bold"
            >
              <span>View Full History</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
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
                        <span className="font-bold text-foreground block">{session.crop}</span>
                        <span className="text-xs text-muted-foreground font-mono">{session.date}</span>
                      </div>
                    </td>
                    <td className="font-mono font-bold text-foreground">
                      {session.quantity} quintals
                      <small className="block text-[10px] text-muted-foreground font-normal">
                        ≈ {session.quantity * 100} kg
                      </small>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {session.mandi}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">
                      {session.distance}
                    </td>
                    <td className="font-mono font-bold text-foreground">
                      {formatINR(session.pricePerQ)}/q
                    </td>
                    <td>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        +{formatINR(session.gain)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                          session.status === 'Ready to Dispatch'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                        {session.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href="/sabha/demo-result"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        <span>View Slip</span>
                        <ArrowUpRight className="size-3.5" />
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
