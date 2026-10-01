'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  ArrowRight, 
  RefreshCw,
  ArrowRightLeft,
  Loader2,
  Store
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { formatINR } from '@/lib/api/sabha'
import { useLocale } from '@/components/locale-provider'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MandiRow {
  mandi_id?: number | null
  mandi: string
  district: string
  state: string
  crop: string
  variety?: string
  modal_price: number | null
  min_price: number | null
  max_price: number | null
  change_pct: number | null
  arrivals_qty: number | null
  distance_km: number | null
  freight_est_per_quintal: number | null
  price_date?: string | null
}

export default function ExplorePage() {
  const { t, tData, formatCurrency } = useLocale()
  const [rows, setRows] = useState<MandiRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState<string>('Onion')
  const [selectedState, setSelectedState] = useState<string>('Maharashtra')
  const [sortBy, setSortBy] = useState<'modal' | 'change' | 'volume'>('modal')

  // Head-to-Head Comparison State
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [compareQty, setCompareQty] = useState(20)

  useEffect(() => {
    let isCancelled = false

    async function loadPrices() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('crop', selectedCrop === 'All' ? 'Onion' : selectedCrop)
        if (selectedState && selectedState !== 'All') {
          params.set('state', selectedState)
        }

        const res = await fetch(`/api/markets/prices?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch mandi prices (${res.status})`)
        }
        const data = await res.json()
        if (!isCancelled) {
          const fetchedRows: MandiRow[] = (data.rows || []).map((r: any) => ({
            mandi_id: r.mandiId ?? r.mandi_id ?? null,
            mandi: r.mandi,
            district: r.district,
            state: r.state,
            crop: r.crop,
            variety: r.variety,
            modal_price: r.modalPrice ?? r.modal_price ?? null,
            min_price: r.minPrice ?? r.min_price ?? null,
            max_price: r.maxPrice ?? r.max_price ?? null,
            change_pct: r.changePct ?? r.change_pct ?? null,
            arrivals_qty: r.arrivalsQty ?? r.arrivals_qty ?? null,
            distance_km: r.distanceKm ?? r.distance_km ?? null,
            freight_est_per_quintal: r.freightEstPerQuintal ?? r.freight_est_per_quintal ?? null,
            price_date: r.priceDate ?? r.price_date ?? null,
          }))
          setRows(fetchedRows)
          if (fetchedRows.length > 0) {
            setCompareA(fetchedRows[0].mandi)
            setCompareB(fetchedRows[1]?.mandi || fetchedRows[0].mandi)
          } else {
            setCompareA('')
            setCompareB('')
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Unable to connect to market prices.')
          setRows([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadPrices()
    return () => {
      isCancelled = true
    }
  }, [selectedCrop, selectedState])

  const filtered = rows.filter((row) => {
    const matchesCrop = selectedCrop === 'All' || row.crop.toLowerCase() === selectedCrop.toLowerCase()
    const matchesState = selectedState === 'All' || row.state.toLowerCase() === selectedState.toLowerCase()
    const matchesSearch =
      row.mandi.toLowerCase().includes(search.toLowerCase()) ||
      row.district.toLowerCase().includes(search.toLowerCase()) ||
      row.state.toLowerCase().includes(search.toLowerCase())
    return matchesCrop && matchesState && matchesSearch
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'modal') return (b.modal_price || 0) - (a.modal_price || 0)
    if (sortBy === 'change') return (b.change_pct || 0) - (a.change_pct || 0)
    if (sortBy === 'volume') return (b.arrivals_qty || 0) - (a.arrivals_qty || 0)
    return 0
  })

  const highestRow = sorted.length > 0 ? sorted[0] : null
  const lowestRow = sorted.length > 1 ? sorted[sorted.length - 1] : null
  const avgModal = sorted.length > 0
    ? Math.round(sorted.reduce((acc, r) => acc + (r.modal_price || 0), 0) / sorted.length)
    : 0

  // Comparison Calculations
  const mandiAData = rows.find((m) => m.mandi === compareA) || rows[0]
  const mandiBData = rows.find((m) => m.mandi === compareB) || rows[1] || rows[0]

  const modalA = mandiAData?.modal_price || 0
  const freightA = mandiAData?.freight_est_per_quintal || 0
  const netRealizedA = modalA * compareQty - freightA * compareQty

  const modalB = mandiBData?.modal_price || 0
  const freightB = mandiBData?.freight_est_per_quintal || 0
  const netRealizedB = modalB * compareQty - freightB * compareQty

  const arbitrageSpread = netRealizedA - netRealizedB

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <span className="section-kicker">{t('explore.kicker')}</span>
            <h1 className="page-title">
              {t('explore.title')}
            </h1>
            <p className="page-subtitle">
              {t('explore.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sabha/new"
              className="button-primary !min-h-[36px] !px-4 text-xs font-semibold"
            >
              <span>{t('explore.convene_cta')}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </header>

        {/* ── 3 Summary Highlight Cards ───────────────────────────────── */}
        <section className="grid gap-3.5 sm:grid-cols-3">
          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                {t('explore.highlights.highest_rate')}
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {highestRow ? tData('mandi', highestRow.mandi) : '—'}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean">
              {highestRow?.modal_price ? formatCurrency(highestRow.modal_price) : '—'}
              <span className="text-xs font-normal text-muted-foreground">{t('common.units.rate_per_q')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-primary font-medium">
              {highestRow?.change_pct ? `${highestRow.change_pct > 0 ? '+' : ''}${highestRow.change_pct}% ${t('explore.highlights.daily_surge')}` : t('explore.highlights.daily_surge')}
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                {t('explore.highlights.regional_average')}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {t('explore.highlights.mandis_count', { count: sorted.length })}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean">
              {avgModal > 0 ? formatCurrency(avgModal) : '—'}
              <span className="text-xs font-normal text-muted-foreground">{t('common.units.rate_per_q')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('explore.highlights.weighted_sub')}
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="stat-label-clean">
                {t('explore.highlights.peak_spread')}
              </span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {highestRow && lowestRow ? `${tData('mandi', highestRow.mandi)} vs ${tData('mandi', lowestRow.mandi)}` : t('explore.highlights.peak_spread')}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 stat-number-clean text-emerald-600 dark:text-emerald-400">
              {highestRow && lowestRow && highestRow.modal_price && lowestRow.modal_price
                ? `+${formatCurrency(Math.round(highestRow.modal_price - lowestRow.modal_price))}`
                : '—'}
              <span className="text-xs font-normal text-muted-foreground">{t('common.units.rate_per_q')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('explore.highlights.net_spread_sub')}
            </p>
          </div>
        </section>

        {/* ── Interactive Head-to-Head Mandi Comparison Tool ───────────── */}
        {rows.length > 0 && (
          <section className="card-luxury bg-gradient-to-r from-card via-card to-primary/5 flex flex-col gap-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
              <div>
                <span className="section-kicker">{t('explore.duel.kicker')}</span>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                  {t('explore.duel.title')}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-muted-foreground">{t('explore.duel.volume_label')}</span>
                <span className="text-primary font-bold">{compareQty} {t('common.units.quintals')}</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 items-center">
              {/* Mandi A Selection */}
              <div className="lg:col-span-5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">{t('explore.duel.destination_a')}</span>
                  <select
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer"
                  >
                    {rows.map((m) => (
                      <option key={`${m.mandi}-${m.district}-A`} value={m.mandi}>
                        {tData('mandi', m.mandi)} ({tData('geo', m.state)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-base font-bold text-foreground tabular-nums block">
                    {mandiAData?.modal_price ? `${formatCurrency(mandiAData.modal_price)}/q` : '—'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('explore.duel.distance_freight', { distance: mandiAData?.distance_km ?? 0, freight: mandiAData?.freight_est_per_quintal ?? 0 })}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('explore.duel.net_payoff', { qty: compareQty })}</span>
                  <span className="font-bold text-primary text-sm tabular-nums">
                    {formatCurrency(netRealizedA)}
                  </span>
                </div>
              </div>

              {/* VS Badge */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center gap-1 text-center">
                <div className="grid size-8 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-xs">
                  <ArrowRightLeft className="size-3.5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('explore.duel.net_spread')}
                </span>
                <span className={cn('text-xs font-bold tabular-nums', arbitrageSpread >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600')}>
                  {arbitrageSpread >= 0 ? `+${formatCurrency(arbitrageSpread)}` : `-${formatCurrency(Math.abs(arbitrageSpread))}`}
                </span>
              </div>

              {/* Mandi B Selection */}
              <div className="lg:col-span-5 rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{t('explore.duel.destination_b')}</span>
                  <select
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer"
                  >
                    {rows.map((m) => (
                      <option key={`${m.mandi}-${m.district}-B`} value={m.mandi}>
                        {tData('mandi', m.mandi)} ({tData('geo', m.state)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-base font-bold text-foreground tabular-nums block">
                    {mandiBData?.modal_price ? `${formatCurrency(mandiBData.modal_price)}/q` : '—'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('explore.duel.distance_freight', { distance: mandiBData?.distance_km ?? 0, freight: mandiBData?.freight_est_per_quintal ?? 0 })}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('explore.duel.net_payoff', { qty: compareQty })}</span>
                  <span className="font-bold text-foreground text-sm tabular-nums">
                    {formatCurrency(netRealizedB)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Filters & Search Control Bar ─────────────────────────────── */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          {/* Search Box */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 h-9 flex-1 min-w-[220px]">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('explore.filters.search_placeholder')}
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          {/* Crop Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {['Onion', 'Wheat', 'Soybean', 'Tomato', 'Garlic'].map((crop) => (
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
                {crop === 'All' ? t('explore.filters.all_crops') : tData('crop', crop)}
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
              <option value="All">{t('explore.filters.all_states')}</option>
              <option value="Gujarat">{tData('geo', 'Gujarat')}</option>
              <option value="Maharashtra">{tData('geo', 'Maharashtra')}</option>
              <option value="Madhya Pradesh">{tData('geo', 'Madhya Pradesh')}</option>
              <option value="Rajasthan">{tData('geo', 'Rajasthan')}</option>
            </select>
          </div>
        </section>

        {/* ── Full-Width Interactive Mandi Price Table ─────────────────── */}
        <section className="card-luxury flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <span className="section-kicker">{t('explore.table.kicker')}</span>
              <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                {t('explore.table.title', { count: sorted.length })}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-semibold">{t('explore.filters.sort_by')}</span>
              <button
                onClick={() => setSortBy('modal')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'modal' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                {t('explore.filters.sort_modal')}
              </button>
              <button
                onClick={() => setSortBy('change')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'change' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                {t('explore.filters.sort_change')}
              </button>
              <button
                onClick={() => setSortBy('volume')}
                className={cn('font-bold px-2 py-1 rounded-lg', sortBy === 'volume' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                {t('explore.filters.sort_volume')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Fetching real-time prices from APMCs...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-destructive font-medium mb-3">{error}</p>
              <button
                onClick={() => setSelectedCrop(selectedCrop)}
                className="button-outline text-xs px-3 py-1.5"
              >
                <RefreshCw className="size-3 mr-1" /> Retry Query
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                <Store className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No mandi records found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                No active arrivals reported for {selectedCrop} in {selectedState}. Try selecting a different crop or state filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>{t('explore.table.col_mandi')}</th>
                    <th>{t('explore.table.col_crop')}</th>
                    <th>{t('explore.table.col_modal')}</th>
                    <th>{t('explore.table.col_range')}</th>
                    <th>{t('explore.table.col_trend')}</th>
                    <th>{t('explore.table.col_volume')}</th>
                    <th>{t('explore.table.col_freight')}</th>
                    <th className="text-right">{t('explore.table.col_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => {
                    const isPositive = (row.change_pct || 0) > 0
                    return (
                      <tr key={`${row.mandi}-${row.district}`} className="group hover:bg-muted/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                              <MapPin className="size-4" />
                            </span>
                            <div>
                              <span className="font-bold text-foreground block">{tData('mandi', row.mandi)}</span>
                              <span className="text-xs text-muted-foreground">
                                {tData('geo', row.district)}, {tData('geo', row.state)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground">
                            {tData('crop', row.crop)} {row.variety ? `(${row.variety})` : ''}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-sm text-foreground tabular-nums">
                            {row.modal_price ? formatCurrency(row.modal_price) : '—'}
                            <span className="ml-0.5 text-xs text-muted-foreground font-normal">/q</span>
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {row.min_price && row.max_price ? `${formatCurrency(row.min_price)} – ${formatCurrency(row.max_price)}` : '—'}
                          </span>
                        </td>
                        <td>
                          {row.change_pct !== null ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                                isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600'
                              )}
                            >
                              {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                              {isPositive ? '+' : ''}{row.change_pct}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-xs font-medium text-foreground tabular-nums">
                          {row.arrivals_qty ? `${row.arrivals_qty} MT` : '—'}
                        </td>
                        <td>
                          <div className="text-xs text-muted-foreground">
                            <span>{row.distance_km ? `${row.distance_km} km` : 'Local APMC'}</span>
                            {row.freight_est_per_quintal ? (
                              <span className="block text-[10.5px] text-muted-foreground">
                                {t('explore.table.freight_sub', { freight: row.freight_est_per_quintal })}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/sabha/new?crop=${row.crop}&targetMandi=${encodeURIComponent(row.mandi)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-primary-hover transition-all"
                          >
                            <span>{t('explore.table.action_convene')}</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
