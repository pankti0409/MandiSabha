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
import { useLocale } from '@/components/locale-provider'
import { getDashboardData, formatINR } from '@/lib/api/sabha'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export default function DashboardPage() {
  const { user } = useAuth()
  const { language, t, tData, formatCurrency, formatDate } = useLocale()
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
              <span className="section-kicker !mb-0">{t('dashboard.kicker')}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {tData('geo', user?.village || 'Nashik')}, {tData('geo', user?.state || user?.district || 'Maharashtra')}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {formatDate(new Date(), { dateStyle: 'full' })}
              </span>
            </div>

            <h1 className="page-title">
              {t('dashboard.greeting', { name: user?.name?.split(' ')[0] || 'Mitra' })}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <TrendingUp className="size-3.5" />
                {t('dashboard.pulse_badge')}
              </p>
              <div className="flex items-center gap-1">
                {userCrops.map((c) => (
                  <span key={c} className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                    {tData('crop', c)}
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
              <span>{t('dashboard.start_new_sabha')}</span>
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
                {t('dashboard.stats.vs_local')}
              </span>
            </div>
            <p className="stat-label-clean">
              {t('dashboard.stats.total_extra')}
            </p>
            <div className="mt-1 stat-number-clean">
              {formatCurrency(15800)}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('dashboard.stats.total_extra_sub')}
            </p>
          </div>

          {/* Stat 2: Active & Completed Sabhas */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="size-3.5" />
              </span>
              <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {t('dashboard.stats.sessions_count', { count: data.sessions.length })}
              </span>
            </div>
            <p className="stat-label-clean">
              {t('dashboard.stats.sabhas_convened')}
            </p>
            <div className="mt-1 stat-number-clean">
              {data.sessions.length}
            </div>
            <p className="mt-0.5 text-[11px] text-primary font-medium">
              {t('dashboard.stats.sabhas_cycle_sub')}
            </p>
          </div>

          {/* Stat 3: Best Winning Mandi */}
          <div className="card-luxury relative overflow-hidden group p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-7 place-items-center rounded-lg bg-sky/10 text-sky">
                <Truck className="size-3.5" />
              </span>
              <span className="rounded-md bg-sky/10 border border-sky/20 px-2 py-0.5 text-[10px] font-semibold text-sky">
                {t('dashboard.stats.win_rate')}
              </span>
            </div>
            <p className="stat-label-clean">
              {t('dashboard.stats.top_mandi')}
            </p>
            <div className="mt-1 stat-number-clean truncate">
              {tData('mandi', 'Surat APMC')}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('dashboard.stats.top_mandi_sub')}
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
                {t('dashboard.stats.live_feed')}
              </span>
            </div>
            <p className="stat-label-clean">
              {t('dashboard.stats.agmarknet_sync')}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="stat-number-clean">24</span>
              <span className="text-xs font-normal text-muted-foreground">{t('dashboard.stats.mandis_unit')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('dashboard.stats.sync_sub')}
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
                  <span className="section-kicker">{t('dashboard.chart.kicker')}</span>
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                    {t('dashboard.chart.title')}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('dashboard.chart.subtitle')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs font-semibold">
                    {(['3M', '6M', '1Y'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setActiveRange(range)
                          const nextLen = range === '3M' ? 3 : range === '6M' ? 6 : 12
                          setSelectedBar(nextLen - 1)
                        }}
                        className={cn(
                          'rounded-md px-2.5 py-1 transition-all cursor-pointer',
                          activeRange === range ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {range === '3M' ? t('dashboard.chart.range_3m') : range === '6M' ? t('dashboard.chart.range_6m') : t('dashboard.chart.range_1y')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Bar Visualization with Guidelines and Comparison Bars */}
              <div className="mt-4 relative pt-6 pb-2">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-border/60 border-dashed w-full flex justify-end">
                    <span className="text-[9px] font-mono text-muted-foreground/70 -mt-2.5 pr-1">₹16k</span>
                  </div>
                  <div className="border-b border-border/60 border-dashed w-full flex justify-end">
                    <span className="text-[9px] font-mono text-muted-foreground/70 -mt-2.5 pr-1">₹12k</span>
                  </div>
                  <div className="border-b border-border/60 border-dashed w-full flex justify-end">
                    <span className="text-[9px] font-mono text-muted-foreground/70 -mt-2.5 pr-1">₹8k</span>
                  </div>
                  <div className="border-b border-border/60 border-dashed w-full flex justify-end">
                    <span className="text-[9px] font-mono text-muted-foreground/70 -mt-2.5 pr-1">₹4k</span>
                  </div>
                  <div className="border-b border-border/80 w-full flex justify-end">
                    <span className="text-[9px] font-mono text-muted-foreground/70 -mt-2.5 pr-1">₹0</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className={cn(
                  'relative z-10 flex items-end justify-between h-48 px-1 sm:px-2',
                  activeRange === '1Y' ? 'gap-1 sm:gap-2' : activeRange === '6M' ? 'gap-2 sm:gap-4' : 'gap-4 sm:gap-8 max-w-lg mx-auto'
                )}>
                  {(activeRange === '3M'
                    ? data.monthlyData.slice(-3)
                    : activeRange === '6M'
                    ? data.monthlyData.slice(-6)
                    : data.monthlyData.slice(-12)
                  ).map((item, index, arr) => {
                    const isSelected = selectedBar === index || (selectedBar === null && index === arr.length - 1)
                    const earnedHeight = Math.max(14, Math.min(100, Math.round((item.earned / 16000) * 100)))
                    const baselineHeight = Math.max(10, Math.round((item.earned * 0.62 / 16000) * 100))

                    return (
                      <div
                        key={item.month}
                        onClick={() => setSelectedBar(index)}
                        className={cn(
                          'group flex-1 min-w-0 flex flex-col items-center justify-end h-full cursor-pointer relative py-1 rounded-md transition-all',
                          isSelected ? 'bg-muted/20' : 'hover:bg-muted/10'
                        )}
                      >
                        {/* Tooltip on Hover / Active - Sharp, clean financial chip */}
                        <div
                          className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card/95 backdrop-blur-sm px-2 py-1 text-[11px] shadow-md transition-all pointer-events-none z-20 flex items-center gap-1.5',
                            isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(item.earned)}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-muted-foreground text-[10px]">{item.sabhas} sabhas</span>
                        </div>

                        {/* Dual Bars: Local Baseline vs Net Realized Profit - Sharp, architectural precision */}
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-[142px] pb-0.5 border-b border-border/80">
                          {/* Local Baseline Bar - Crisp muted slate */}
                          <div
                            className={cn(
                              'rounded-t-[2px] bg-slate-200 dark:bg-slate-700/80 transition-all duration-200 group-hover:bg-slate-300 dark:group-hover:bg-slate-600',
                              activeRange === '1Y' ? 'w-2 sm:w-3' : activeRange === '6M' ? 'w-3 sm:w-4' : 'w-4 sm:w-6'
                            )}
                            style={{ height: `${baselineHeight}%` }}
                            title={`${t('dashboard.chart.local_baseline')}: ${formatCurrency(Math.round(item.earned * 0.62))}`}
                          />

                          {/* Net Realized Profit Bar - Crisp emerald with subtle top edge */}
                          <div
                            className={cn(
                              'rounded-t-[2px] transition-all duration-200',
                              activeRange === '1Y' ? 'w-2.5 sm:w-4' : activeRange === '6M' ? 'w-4 sm:w-5' : 'w-5 sm:w-8',
                              isSelected
                                ? 'bg-emerald-600 dark:bg-emerald-500 shadow-sm'
                                : 'bg-emerald-600/80 dark:bg-emerald-500/80 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500'
                            )}
                            style={{ height: `${earnedHeight}%` }}
                            title={`${t('dashboard.chart.net_profit')}: ${formatCurrency(item.earned)}`}
                          />
                        </div>

                        {/* Month Label */}
                        <div className="flex flex-col items-center pt-2">
                          <span className={cn(
                            'font-mono transition-colors block truncate',
                            activeRange === '1Y' ? 'text-[9.5px] sm:text-[10.5px]' : 'text-[11px]',
                            isSelected ? 'text-foreground font-bold' : 'text-muted-foreground font-medium group-hover:text-foreground'
                          )}>
                            {item.month}
                          </span>
                          {isSelected && <span className="w-2.5 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-500 mt-1" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground font-medium text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-emerald-600 dark:bg-emerald-500" /> {t('dashboard.chart.net_profit')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-slate-200 dark:bg-slate-700" /> {t('dashboard.chart.local_baseline')}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                  <Sparkles className="size-3 text-emerald-500" />
                  <span>{t('dashboard.chart.peak_month', { month: 'Sep 2026', amount: formatCurrency(15800) })}</span>
                </div>
              </div>
            </div>
          </article>

          {/* Mandi Winners & Frequency (4 cols) */}
          <article className="card-luxury lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-border/70">
                <span className="section-kicker">{t('dashboard.winners.kicker')}</span>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                  {t('dashboard.winners.title')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('dashboard.winners.subtitle')}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {data.winners.map((mandi, idx) => (
                  <div key={mandi.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {tData('mandi', mandi.name)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px] tabular-nums">{t('dashboard.winners.gain', { gain: mandi.avgGain })}</span>
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
                      {t('dashboard.winners.best_crop', { crop: tData('crop', mandi.crop) })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">{t('dashboard.winners.top_notice')}</span>
              <Link href="/explore" className="font-semibold text-primary hover:underline flex items-center gap-1 text-xs">
                <span>{t('dashboard.winners.explore')}</span> <ArrowRight className="size-3" />
              </Link>
            </div>
          </article>
        </section>

        {/* ── Market Pulse Ticker & Start Direct Sabha ─────────────────── */}
        <section className="flex flex-col gap-3.5">
          <div className="flex items-end justify-between">
            <div>
              <span className="section-kicker">{t('dashboard.radar.kicker')}</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                {t('dashboard.radar.title')}
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{t('dashboard.radar.view_all')}</span>
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
                    <span className="text-xs font-bold text-foreground">{tData('crop', item.crop)}</span>
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
                      {formatCurrency(item.price)}
                      <span className="ml-0.5 text-xs text-muted-foreground font-normal">{t('common.units.rate_per_q')}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {t('dashboard.radar.best_at', { mandi: tData('mandi', item.mandi) })}
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
                    <span>{t('dashboard.radar.analyze', { crop: tData('crop', item.crop) })}</span>
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
              <span className="section-kicker">{t('dashboard.sessions.kicker')}</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                {t('dashboard.sessions.title')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('dashboard.sessions.subtitle')}
              </p>
            </div>
            <Link
              href="/history"
              className="button-secondary !min-h-[34px] !px-3 !text-xs font-semibold"
            >
              <span>{t('dashboard.sessions.view_history')}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>{t('dashboard.sessions.col_session_crop')}</th>
                  <th>{t('dashboard.sessions.col_quantity')}</th>
                  <th>{t('dashboard.sessions.col_destination')}</th>
                  <th>{t('dashboard.sessions.col_distance')}</th>
                  <th>{t('dashboard.sessions.col_modal_price')}</th>
                  <th>{t('dashboard.sessions.col_extra')}</th>
                  <th>{t('dashboard.sessions.col_status')}</th>
                  <th className="text-right">{t('dashboard.sessions.col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id} className="group cursor-pointer">
                    <td>
                      <div>
                        <span className="font-semibold text-foreground block text-xs">{tData('crop', session.crop)}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{session.date.replace('Today', t('common.labels.today'))}</span>
                      </div>
                    </td>
                    <td className="font-mono font-semibold text-xs text-foreground">
                      {t('dashboard.sessions.quintals', { count: session.quantity })}
                      <small className="block text-[10px] text-muted-foreground font-normal">
                        {t('dashboard.sessions.approx_kg', { count: session.quantity * 100 })}
                      </small>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs text-foreground">
                        <MapPin className="size-3 text-primary" />
                        {tData('mandi', session.mandi)}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">
                      {session.distance.replace('km', t('common.units.km'))}
                    </td>
                    <td className="font-mono font-semibold text-xs text-foreground">
                      {formatCurrency(session.pricePerQ)}{t('common.units.rate_per_q')}
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        +{formatCurrency(session.gain)}
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
                        {session.status === 'Ready to Dispatch'
                          ? t('dashboard.sessions.ready_to_dispatch')
                          : t('dashboard.sessions.completed')}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href="/sabha/demo-result"
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        <span>{t('dashboard.sessions.view_slip')}</span>
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
