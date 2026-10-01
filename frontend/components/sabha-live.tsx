'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { formatINR, formatNumber, evaluateSabhaCandidates, SabhaDraft, EvaluatedMandi, allCrops, Crop } from '@/lib/api/sabha'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { cn } from '@/lib/utils'
import { LiveRouteMap } from '@/components/live-route-map'
import { MandiReceiptModal, MandiReceiptDocument, MandiReceiptData } from '@/components/mandi-loading-receipt'

function resolveCropName(queryCrop?: string | null, draftCrop?: string | null, userCrops?: string[]): Crop {
  const candidate = (queryCrop && queryCrop.trim().toLowerCase() !== 'commodity' ? queryCrop.trim() : null)
    || (draftCrop && (draftCrop as string).trim().toLowerCase() !== 'commodity' ? (draftCrop as string).trim() : null)
    || userCrops?.[0]
    || 'Wheat'

  const matched = allCrops.find((c) => c.name.toLowerCase() === candidate.toLowerCase())
  return (matched ? matched.name : 'Wheat') as Crop
}

function resolveOriginName(queryLoc?: string | null, draftLoc?: string | null, userVillage?: string, userDistrict?: string, userState?: string): string {
  const candidate = (queryLoc && queryLoc.trim()) || (draftLoc && draftLoc.trim())
  if (candidate && !candidate.toLowerCase().includes('your farm')) {
    return candidate
  }
  if (userVillage) {
    return `${userVillage}, ${userDistrict || userState || 'Gujarat'}`
  }
  if (userDistrict) {
    return `${userDistrict}, ${userState || 'Gujarat'}`
  }
  return 'Rajkot, Gujarat'
}

function buildReceiptData({
  id,
  user,
  originName,
  winner,
  quantity,
  cropName,
  cropLocalName,
  localBaseline,
  draft,
  vehicleType,
}: {
  id: string
  user: any
  originName: string
  winner: EvaluatedMandi
  quantity: number
  cropName: Crop
  cropLocalName: string
  localBaseline?: EvaluatedMandi
  draft?: SabhaDraft | null
  vehicleType: string
}): MandiReceiptData {
  const rawDigits = id.replace(/[^0-9]/g, '')
  const passNumber = `APMC/GJ/2026/${rawDigits.slice(-5) || '84920'}`
  const farmerName = user?.name || 'Yash'
  const farmerMobile = user?.mobile || '+91 98765 43210'
  const farmerLocation = originName || `${user?.village || 'Rajkot West'}, ${user?.district || 'Rajkot'}, Gujarat`
  const grossVal = winner.gross || (winner.price * quantity)
  const freightVal = winner.freight || 538
  const netVal = winner.net || (grossVal - freightVal)
  const tollVal = 80

  return {
    passNumber,
    farmerName,
    farmerKID: `KID-GJ-${rawDigits.slice(-4) || '8492'}`,
    farmerMobile,
    farmerLocation,
    bankAccountMasked: 'SBI A/C ······4921',
    bankIfsc: 'SBIN0001824',
    mandiName: winner.name,
    mandiYardCode: winner.name.toLowerCase().includes('gondal') ? 'GJ-APMC-042' : 'APMC-REG-A',
    mandiLocation: `${winner.name}, ${winner.state}`,
    mandiHighway: winner.highway,
    transitDistance: winner.distance,
    transitHours: '45 mins',
    cropName: cropName,
    cropLocalName,
    quantityQuintals: quantity,
    qualityGrade: 'Grade A (FAQ Standard)',
    moistureContent: '10.8%',
    modalRatePerQtl: winner.price,
    grossProduceValue: grossVal,
    freightCost: freightVal,
    tollCost: tollVal,
    netPayable: netVal,
    localBenchmarkMandi: localBaseline?.name || 'Local Mandi',
    localBenchmarkRate: localBaseline?.price,
    surplusVsLocal: winner.advantage,
    vehicleType: draft?.vehicleType || vehicleType || 'Pickup (1.5T LCV)',
    weighbridgeLane: 'Gate #1 · Electronic Lane 2',
  }
}

export function SabhaLive({ id }: { id: string }) {
  const { user } = useAuth()
  const { t, tData, formatCurrency } = useLocale()
  const searchParams = useSearchParams()

  const queryCrop = searchParams?.get('crop')
  const queryQty = searchParams?.get('qty') ? Number(searchParams.get('qty')) : (searchParams?.get('quantity') ? Number(searchParams.get('quantity')) : null)
  const queryLoc = searchParams?.get('loc') || searchParams?.get('location')
  const queryRadius = searchParams?.get('rad') ? Number(searchParams.get('rad')) : null
  const queryVeh = (searchParams?.get('veh') as 'pickup' | 'truck' | 'heavy') || null

  // Load draft parameters from localStorage or user profile
  const [draft, setDraft] = useState<SabhaDraft | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const decodedId = decodeURIComponent(id)
      const stored = localStorage.getItem(`sabha_draft_${decodedId}`) || localStorage.getItem(`sabha_draft_${id}`) || localStorage.getItem('sabha_latest_draft') || localStorage.getItem('latest_sabha')
      if (stored) {
        setDraft(JSON.parse(stored))
      }
    } catch {}
  }, [id])

  const originName = resolveOriginName(queryLoc, draft?.location, user?.village, user?.district, user?.state)
  const cropName = resolveCropName(queryCrop, draft?.crop, user?.crops)
  const quantity = queryQty || draft?.quantity || 20
  const vehicleType = queryVeh || draft?.vehicleType || 'pickup'
  const radius = queryRadius || draft?.radius || 200

  const evaluation = useMemo(() => {
    return evaluateSabhaCandidates({
      crop: cropName as any,
      quantity,
      location: originName,
      originCoords: draft?.originCoords,
      vehicleType,
      radius,
    })
  }, [cropName, quantity, originName, draft, vehicleType, radius])

  const { winner, localBaseline, ranked, originCoords } = evaluation

  const agents = useMemo(() => [
    { name: t('sabha.agents.price_scout.name') || 'Price Scout', role: t('sabha.agents.price_scout.role') || 'Mandi Arbitrage', desc: `Scanning ${ranked.slice(0, 3).map((m) => tData('mandi', m.name)).join(', ')} live books` },
    { name: t('sabha.agents.route_planner.name') || 'Route Planner', role: t('sabha.agents.route_planner.role') || 'Logistics & Fuel', desc: `Calculating ${winner.highway} freight from ${originName}` },
    { name: t('sabha.agents.weather_watch.name') || 'Weather Watch', role: t('sabha.agents.weather_watch.role') || 'Risk & Moisture', desc: 'Monitoring humidity & rainfall across transport corridor' },
    { name: t('sabha.agents.buyer_network.name') || 'Buyer Network', role: t('sabha.agents.buyer_network.role') || 'APMC Clearing', desc: `Verifying ${tData('mandi', winner.name)} commission agent cash settlements` },
    { name: t('sabha.agents.advisor_chair.name') || 'Advisor Chair', role: t('sabha.agents.advisor_chair.role') || 'Consensus Engine', desc: `Synthesizing net payoff vs ${tData('mandi', localBaseline?.name || 'local')} benchmark` },
  ], [ranked, winner, originName, localBaseline, t, tData])

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

  const maxNet = useMemo(() => {
    return Math.max(...ranked.map((m) => m.net), 1)
  }, [ranked])

  const defaultMessages = useMemo(() => [
    { sender: 'Price Scout', text: `${winner.name} ${tData('crop', cropName)} modal surged to ₹${winner.price.toLocaleString('en-IN')}/q on high wholesale demand.` },
    { sender: 'Route Planner', text: `${originName} to ${winner.name} freight estimated at ₹${winner.freight.toLocaleString('en-IN')} via ${draft?.vehicleType || '1.5T pickup'} (${winner.distance}).` },
    { sender: 'Weather Watch', text: `Clear weather along ${winner.highway}. Zero transit spoilage or rainfall risk.` },
    { sender: 'Advisor Chair', text: `${winner.name} net payout of ₹${winner.net.toLocaleString('en-IN')} delivers +₹${winner.advantage.toLocaleString('en-IN')} pure surplus over ${localBaseline?.name || 'local mandi'} benchmark.` },
  ], [winner, cropName, originName, draft, localBaseline, tData])

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Live Sabha Header ────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="section-kicker">{t('sabha.live.kicker')}</span>
              <span>·</span>
              <span className="font-mono">#{id.replace('demo-', '').slice(0, 8)}</span>
            </div>
            <h1 className="page-title">
              {t('sabha.live.title')}
            </h1>
            <p className="page-subtitle">
              {t('sabha.live.subtitle', { qty: quantity, crop: tData('crop', cropName), origin: originName, progress }) || `Analyzing ${cropName} trade corridors from ${originName} · ${progress}% computed`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="status-pulse !size-2" /> {t('sabha.live.agents_active_badge')}
            </span>

            <button
              onClick={() => setPaused(!paused)}
              className="button-secondary !min-h-[42px] !px-4 text-xs font-bold"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              <span>{paused ? t('sabha.live.resume') : t('sabha.live.pause')}</span>
            </button>
          </div>
        </header>

        {/* ── 3-Column Cockpit Grid ───────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-12 items-start">
          {/* Column 1: Multi-Agent Quorum (3 cols) */}
          <section className="card-luxury lg:col-span-3 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-bold text-sm text-foreground">{t('sabha.live.quorum_title')}</span>
                <Users className="size-4 text-primary" />
              </div>

              <div className="space-y-2">
                {agents.map((agent, i) => {
                  const isActive = i === activeAgentIndex && !done
                  const isFinished = i < activeAgentIndex || done

                  return (
                    <div
                      key={agent.name}
                      className={cn(
                        'rounded-xl border p-2.5 transition-all text-xs',
                        isActive
                          ? 'border-primary bg-primary/5 shadow-2xs'
                          : isFinished
                          ? 'border-border/60 bg-muted/20 opacity-80'
                          : 'border-border/40 opacity-40'
                      )}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-foreground">{agent.name}</span>
                        {isActive && <span className="status-pulse !size-1.5" />}
                        {isFinished && <Check className="size-3 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-primary font-mono block mt-0.5">{agent.role}</span>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2">{agent.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('sabha.live.consensus_progress')}</span>
              <span className="font-mono font-bold text-foreground">
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
                    {tab === 'Race' ? t('sabha.live.race_title') : t('sabha.live.corridor_title')}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {tab === 'Race' ? t('sabha.live.race_subtitle') : t('sabha.live.corridor_subtitle')}
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
                    {t('sabha.live.tab_race')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('Routes')}
                    className={cn(
                      'rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5',
                      tab === 'Routes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{t('sabha.live.tab_corridor')}</span>
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                </div>
              </div>

              {tab === 'Race' ? (
                <div className="mt-6 flex flex-col gap-5">
                  {ranked.map((mandi, idx) => {
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
                            {tData('mandi', mandi.name)} ({mandi.distance})
                            {mandi.isLocal && (
                              <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                                Nearest Local
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {formatCurrency(mandi.price)}/q
                            </span>
                            <span className="font-mono font-extrabold text-foreground">
                              {formatCurrency(mandi.net)}
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
                          <span>Freight: {formatCurrency(mandi.freight)}</span>
                          {mandi.advantage > 0 ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(mandi.advantage)} vs Local
                            </span>
                          ) : mandi.isLocal ? (
                            <span className="font-medium text-muted-foreground">Local Baseline</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatCurrency(mandi.advantage)} vs Local
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <LiveRouteMap 
                    originLocation={originName} 
                    targetMandi={winner.name} 
                    originCoords={originCoords}
                    initialHeight="h-[480px] lg:h-[520px]" 
                    className="border-0 shadow-none p-0" 
                  />
                </div>
              )}
            </div>

            <div className="mt-6 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2.5 text-xs text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" />
              <span>{`Direct highway routes from ${originName} → ${winner.highway} verified clear of transit delays.`}</span>
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
                {[...defaultMessages, ...chatMessages]
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
                    { q: `Transit risk on ${winner.highway}?`, a: `Route Planner: Route from ${originName} to ${winner.name} is clear. Average speed 60 km/h.` },
                    { q: 'Hold till Friday?', a: 'Price Scout: Arrivals expected to increase by 25% Friday. Capitalize on peak spread today.' },
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
                  href={`/sabha/${id}/result?crop=${encodeURIComponent(cropName)}&qty=${quantity}&loc=${encodeURIComponent(originName)}&rad=${radius}&veh=${vehicleType}`}
                  className="button-primary !min-h-[44px] w-full text-xs font-bold shadow-lg shadow-primary/25 hover:scale-105"
                >
                  <span>{t('sabha.live.decision_title')}</span>
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
  const { user } = useAuth()
  const { t, tData, formatCurrency } = useLocale()

  // Load draft parameters from localStorage or user profile
  const [draft, setDraft] = useState<SabhaDraft | null>(null)

  const searchParams = useSearchParams()
  const queryCrop = searchParams?.get('crop')
  const queryQty = searchParams?.get('qty') ? Number(searchParams.get('qty')) : (searchParams?.get('quantity') ? Number(searchParams.get('quantity')) : null)
  const queryLoc = searchParams?.get('loc') || searchParams?.get('location')
  const queryRadius = searchParams?.get('rad') ? Number(searchParams.get('rad')) : null
  const queryVeh = (searchParams?.get('veh') as 'pickup' | 'truck' | 'heavy') || null

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const decodedId = decodeURIComponent(id)
      const stored = localStorage.getItem(`sabha_draft_${decodedId}`) || localStorage.getItem(`sabha_draft_${id}`) || localStorage.getItem('sabha_latest_draft') || localStorage.getItem('latest_sabha')
      if (stored) {
        setDraft(JSON.parse(stored))
      }
    } catch {}
  }, [id])

  const originName = resolveOriginName(queryLoc, draft?.location, user?.village, user?.district, user?.state)
  const cropName = resolveCropName(queryCrop, draft?.crop, user?.crops)
  const quantity = queryQty || draft?.quantity || 20
  const vehicleType = queryVeh || draft?.vehicleType || 'pickup'
  const radius = queryRadius || draft?.radius || 200

  const evaluation = useMemo(() => {
    return evaluateSabhaCandidates({
      crop: cropName as any,
      quantity,
      location: originName,
      originCoords: draft?.originCoords,
      vehicleType,
      radius,
    })
  }, [cropName, quantity, originName, draft, vehicleType, radius])

  const { winner, localBaseline, ranked, originCoords } = evaluation

  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const receiptData: MandiReceiptData = useMemo(() => {
    return buildReceiptData({
      id,
      user,
      originName,
      winner,
      quantity,
      cropName,
      cropLocalName: tData('crop', cropName),
      localBaseline,
      draft,
      vehicleType,
    })
  }, [id, user, originName, winner, quantity, cropName, tData, localBaseline, draft, vehicleType])

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Result Header ───────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="section-kicker !mb-0">{t('sabha.live.kicker')}</span>
              <span>·</span>
              <span className="font-mono">#{id.replace('demo-', '').slice(0, 8)}</span>
            </div>
            <h1 className="page-title">
              {t('sabha.live.decision_winner', { mandi: tData('mandi', winner.name) }) || `${winner.name} is Your Winning Move.`}
            </h1>
            <p className="page-subtitle">
              Delivers maximum in-hand return with lowest transit degradation risk from {originName}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="button-primary !min-h-[36px] !px-3.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="View & Print Official APMC Loading Pass & Receipt"
            >
              <FileText className="size-3.5" />
              <span>{t('sabha.live.btn_print')}</span>
            </button>
            <Link
              href="/sabha/new"
              className="button-primary !min-h-[36px] !px-4 text-xs font-semibold"
            >
              <RotateCcw className="size-3.5" />
              <span>{t('dashboard.start_new_sabha')}</span>
            </Link>
          </div>
        </header>

        {/* ── Key Decision Banner ─────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Main Recommendation Hero (8 cols) */}
          <div className="card-luxury lg:col-span-8 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="section-kicker">{t('sabha.live.decision_title')}</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" /> {t('sabha.live.status_consensus_valid')}
                </span>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-normal text-foreground">
                    {tData('mandi', winner.name)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {quantity} {t('common.units.quintals')} {tData('crop', cropName)} · {formatCurrency(winner.price)}/q · {winner.distance} via {winner.highway}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="block text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(winner.net)}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {winner.advantage > 0 
                      ? `+${formatCurrency(winner.advantage)} surplus vs ${tData('mandi', localBaseline?.name || 'local benchmark')}`
                      : 'Local baseline market yard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 grid gap-3 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Gross Revenue</span>
                <strong className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(winner.gross)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Transport & Tolls</span>
                <strong className="text-sm font-semibold text-orange-600 tabular-nums">- {formatCurrency(winner.freight)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Net In-Hand Payout</span>
                <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(winner.net)}</strong>
              </div>
            </div>
          </div>

          {/* Confidence & Verification (4 cols) */}
          <div className="card-luxury lg:col-span-4 flex flex-col justify-between p-4">
            <div>
              <span className="section-kicker">Sabha Confidence Gauge</span>
              <h3 className="mt-1 font-display text-base font-bold text-foreground">96% Confidence</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluated against road transit, toll checkpoints, and historical price volatility.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Price Arbitrage Spread</span>
                  <span className="text-primary tabular-nums">
                    {winner.advantage > 0 ? `+${Math.round((winner.advantage / (localBaseline?.net || 1)) * 100)}%` : 'Baseline'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[96%]" />
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
              Verified route from {originName} farm hub to {tData('mandi', winner.name)} via {winner.highway}
            </p>
          </div>
          <LiveRouteMap 
            originLocation={originName} 
            targetMandi={winner.name} 
            originCoords={originCoords}
            initialHeight="h-[480px] lg:h-[540px]" 
          />
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
                {ranked.map((m, idx) => (
                  <tr key={m.name} className={cn(idx === 0 && 'bg-primary/5 font-bold')}>
                    <td>
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] text-white uppercase font-mono font-bold">Best</span>}
                        <span className="text-foreground">{tData('mandi', m.name)}</span>
                        {m.isLocal && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">Local</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{tData('geo', m.state)} ({m.distance})</td>
                    <td className="font-mono text-foreground">{formatCurrency(m.price)}/q</td>
                    <td className="font-mono text-foreground">{formatCurrency(m.gross)}</td>
                    <td className="font-mono text-orange-600">- {formatCurrency(m.freight)}</td>
                    <td className="font-mono font-extrabold text-foreground">{formatCurrency(m.net)}</td>
                    <td>
                      <span className={cn('font-mono font-bold', m.advantage > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                        {m.advantage > 0 ? `+${formatCurrency(m.advantage)}` : m.isLocal ? 'Baseline' : `${formatCurrency(m.advantage)}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Hidden Dedicated Print Container (rendered exclusively in window.print) ── */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <MandiReceiptDocument data={receiptData} />
      </div>

      {/* ── Interactive Official Loading Pass & Receipt Modal ───────────────── */}
      <MandiReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
      />
    </AppShell>
  )
}
