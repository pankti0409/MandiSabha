'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowUpRight, 
  FileSpreadsheet,
  ArrowRight,
  History
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useLocale } from '@/components/locale-provider'
import { cn } from '@/lib/utils'

export interface HistorySession {
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
]

export default function HistoryPage() {
  const { t, tData, formatCurrency } = useLocale()
  const [sessions, setSessions] = useState<HistorySession[]>(historyData)
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('All')

  const filtered = sessions.filter((s) => {
    const matchesCrop = selectedCrop === 'All' || s.crop.toLowerCase() === selectedCrop.toLowerCase()
    const matchesSearch =
      s.crop.toLowerCase().includes(search.toLowerCase()) ||
      s.mandi.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    return matchesCrop && matchesSearch
  })

  const totalGain = sessions.reduce((acc, s) => acc + s.gain, 0)

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <span className="section-kicker">{t('history.kicker')}</span>
            <h1 className="page-title">
              {t('history.title')}
            </h1>
            <p className="page-subtitle">
              {t('history.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={sessions.length === 0}
              onClick={() => alert(t('history.export_alert'))}
              className={cn(
                'button-secondary !min-h-[34px] !px-3 text-xs font-semibold',
                sessions.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <FileSpreadsheet className="size-3.5" />
              <span>{t('history.export_csv')}</span>
            </button>
            <Link
              href="/sabha/new"
              className="button-primary !min-h-[34px] !px-3.5 text-xs font-semibold"
            >
              <span>New Sabha</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </header>

        {/* ── Summary Stats ────────────────────────────────────────────── */}
        <section className="grid gap-3.5 sm:grid-cols-3">
          <div className="card-luxury p-4 flex flex-col justify-between">
            <span className="stat-label-clean">
              {t('history.stats.total_gain')}
            </span>
            <div className="mt-1 stat-number-clean text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalGain)}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('history.stats.total_gain_sub')}
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <span className="stat-label-clean">
              {t('history.stats.sessions_held')}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="stat-number-clean">
                {sessions.length}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {t('common.units.sessions')}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-primary font-medium">
              {sessions.length > 0
                ? `Average surplus: +${formatCurrency(Math.round(totalGain / sessions.length))} / sabha`
                : 'No historical sessions recorded'}
            </p>
          </div>

          <div className="card-luxury p-4 flex flex-col justify-between">
            <span className="stat-label-clean">
              {t('history.stats.top_mandi')}
            </span>
            <div className="mt-1 stat-number-clean">
              {sessions.length > 0 ? '100%' : '—'}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t('history.stats.top_mandi_sub')}
            </p>
          </div>
        </section>

        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 h-9 flex-1 w-full sm:w-auto">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('history.search_placeholder')}
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['All', 'Onion', 'Wheat', 'Tomato', 'Soybean'].map((crop) => (
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
                {crop === 'All' ? t('history.all_crops') : tData('crop', crop)}
              </button>
            ))}
          </div>
        </section>

        {/* ── Session List ────────────────────────────────────────────── */}
        <section className="card-luxury flex flex-col gap-3.5">
          <div className="pb-3 border-b border-border/70 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground">
              Past Sabha Records ({filtered.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">Audit logs & settlement receipts</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                <History className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Sabha records found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                {sessions.length === 0
                  ? "You haven't convened any Mandi Sabhas yet. Convene your first Sabha to get real-time price arbitration across regional mandis."
                  : "No sessions match your search filters."}
              </p>
              {sessions.length === 0 && (
                <Link
                  href="/sabha/new"
                  className="button-primary !min-h-[36px] !px-4 text-xs font-semibold"
                >
                  <span>Convene Your First Sabha</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-border/80 bg-card hover:border-primary/40 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all shadow-2xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-foreground">{tData('crop', session.crop)}</h3>
                        <span className="text-xs font-mono font-medium text-muted-foreground">· {session.quantity} {t('common.units.quintals')}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] font-mono text-muted-foreground">
                          {session.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <MapPin className="size-3 text-primary" />
                          {tData('mandi', session.mandi)}, {tData('geo', session.state)} ({session.distance.replace('km', t('common.units.km'))})
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {session.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/70">
                    <div className="text-left lg:text-right">
                      <span className="block font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{formatCurrency(session.gain)}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">
                        {formatCurrency(session.rate)}{t('common.units.rate_per_q')} vs {formatCurrency(session.localRate)}{t('common.units.rate_per_q')}
                      </span>
                    </div>

                    <Link
                      href={`/sabha/${session.id}`}
                      className="button-secondary !min-h-[32px] !px-3 text-xs font-semibold hover:border-primary shrink-0"
                    >
                      <span>{t('dashboard.sessions.view_slip')}</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
