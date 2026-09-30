'use client'

import { useState } from 'react'
import { 
  Check, 
  Save, 
  Leaf, 
  MapPin, 
  Truck, 
  Bell, 
  ShieldCheck, 
  Plus, 
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  Edit3,
  Trash2
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { allCrops, Crop, formatINR } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'

interface CropDetails {
  acres: number
  variety: string
  harvest: string
  targetMandi?: string
}

const varietyPresets: Record<string, string[]> = {
  Onion: ['Nashik Red (Garwa)', 'Bhima Super', 'White Onion', 'N-53 (Kharif)'],
  Wheat: ['Sharbati / Lokwan', 'GW 496', 'MPO 1215', 'Tukdi Special'],
  Soybean: ['JS 335', 'JS 9560', 'NRC 37', 'RVS 2001-4'],
  Tomato: ['Abhinav Hybrid', 'Arka Rakshak', 'US 440', 'Desi Local'],
  Cotton: ['BT Cotton (Shankar-6)', 'Bunny BT', 'RCH 2', 'Ajeet 155'],
  Potato: ['Kufri Jyoti', 'Kufri Pukhraj', 'Chipsona', 'Lauvkar'],
  Garlic: ['Desi G2 White', 'Yamuna Safed', 'G-282', 'Ooty Local'],
  Mustard: ['Pusa Bold', 'RH 30', 'Varuna (T-59)', 'Kranti'],
  Maize: ['Pioneer Yellow', 'DKC 9108', 'African Tall', 'Sweet Corn Sugar-75'],
}

const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

const SEASON_PRESETS = [
  { label: 'Kharif', range: 'September – November', desc: 'Monsoon Harvest' },
  { label: 'Rabi', range: 'February – April', desc: 'Winter Harvest' },
  { label: 'Zaid', range: 'May – June', desc: 'Summer Harvest' },
  { label: 'Year-round', range: 'January – December', desc: 'Continuous Supply' },
]

function parseHarvestRange(val?: string): { start: string; end: string } {
  if (!val || val === 'Year-round') {
    return { start: 'January', end: 'December' }
  }
  if (val.includes(' – ')) {
    const parts = val.split(' – ')
    return { start: parts[0]?.trim() || 'January', end: parts[1]?.trim() || parts[0]?.trim() || 'December' }
  }
  if (val.includes(' - ')) {
    const parts = val.split(' - ')
    return { start: parts[0]?.trim() || 'January', end: parts[1]?.trim() || parts[0]?.trim() || 'December' }
  }
  if (val.includes(' / ')) {
    const parts = val.split(' / ')
    return { start: parts[0]?.trim() || 'January', end: parts[1]?.trim() || parts[0]?.trim() || 'December' }
  }
  if (val.includes(' to ')) {
    const parts = val.split(' to ')
    return { start: parts[0]?.trim() || 'January', end: parts[1]?.trim() || parts[0]?.trim() || 'December' }
  }
  return { start: val.trim(), end: val.trim() }
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { language, setLanguage } = useLocale()

  const [activeTab, setActiveTab] = useState<'crops' | 'profile'>('crops')
  const [savedToast, setSavedToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [name, setName] = useState(user?.name || 'Ramesh Patel')
  const [village, setVillage] = useState(user?.village || 'Niphad')
  const [district, setDistrict] = useState(user?.district || 'Nashik')
  const [state, setState] = useState(user?.state || 'Maharashtra')
  const [farmSize, setFarmSize] = useState(user?.farmSizeAcres || 5)
  const [transportRate, setTransportRate] = useState(user?.transportCostPerKm || 7)
  const [vehicle, setVehicle] = useState(user?.vehicleType || 'pickup')
  const [priceAlerts, setPriceAlerts] = useState(user?.priceAlerts ?? true)
  const [weatherAlerts, setWeatherAlerts] = useState(user?.weatherAlerts ?? true)
  const [auctionAlerts, setAuctionAlerts] = useState(true)

  // Crops Personalization State
  const [selectedCrops, setSelectedCrops] = useState<string[]>(
    user?.crops && user.crops.length > 0 ? user.crops : ['Onion', 'Wheat', 'Soybean']
  )

  const [editingCrop, setEditingCrop] = useState<string>('Onion')

  const [cropVarieties, setCropVarieties] = useState<Record<string, CropDetails>>({
    Onion: { acres: 3, variety: 'Nashik Red (Garwa)', harvest: 'April / May', targetMandi: 'Surat APMC' },
    Wheat: { acres: 2, variety: 'Sharbati / Lokwan', harvest: 'March', targetMandi: 'Pune Market Yard' },
    Soybean: { acres: 2, variety: 'JS 335', harvest: 'October', targetMandi: 'Indore Mandi' },
    Tomato: { acres: 1, variety: 'Abhinav Hybrid', harvest: 'January', targetMandi: 'Ahmedabad APMC' },
    Cotton: { acres: 4, variety: 'BT Cotton (Shankar-6)', harvest: 'November', targetMandi: 'Rajkot Market Yard' },
    Potato: { acres: 1.5, variety: 'Kufri Jyoti', harvest: 'February', targetMandi: 'Surat APMC' },
    Garlic: { acres: 1, variety: 'Desi G2 White', harvest: 'December', targetMandi: 'Mandsaur Mandi' },
    Mustard: { acres: 2, variety: 'Pusa Bold', harvest: 'January', targetMandi: 'Kota Mandi' },
    Maize: { acres: 2, variety: 'Pioneer Yellow', harvest: 'September', targetMandi: 'Pune Market Yard' },
  })

  function toggleCrop(cropName: string) {
    if (selectedCrops.includes(cropName)) {
      if (selectedCrops.length <= 1) return // Keep at least one
      const updated = selectedCrops.filter((c) => c !== cropName)
      setSelectedCrops(updated)
      if (editingCrop === cropName && updated.length > 0) {
        setEditingCrop(updated[0])
      }
    } else {
      setSelectedCrops([...selectedCrops, cropName])
      setEditingCrop(cropName)
    }
  }

  const currentCropObj = allCrops.find((c) => c.name === editingCrop) || allCrops[0]
  const currentSpecs = cropVarieties[editingCrop] || {
    acres: 2,
    variety: currentCropObj.variety || 'Standard',
    harvest: 'April / May',
    targetMandi: 'Surat APMC',
  }

  function updateCurrentSpec(field: keyof CropDetails, value: any) {
    setCropVarieties((prev) => ({
      ...prev,
      [editingCrop]: {
        ...currentSpecs,
        [field]: value,
      },
    }))
  }

  const currentRange = parseHarvestRange(currentSpecs.harvest)

  function handleStartMonthChange(newStart: string) {
    const range = parseHarvestRange(currentSpecs.harvest)
    const formatted = newStart === range.end ? newStart : `${newStart} – ${range.end}`
    updateCurrentSpec('harvest', formatted)
  }

  function handleEndMonthChange(newEnd: string) {
    const range = parseHarvestRange(currentSpecs.harvest)
    const formatted = range.start === newEnd ? newEnd : `${range.start} – ${newEnd}`
    updateCurrentSpec('harvest', formatted)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateUser({
        name,
        village,
        district,
        state,
        farmSizeAcres: Number(farmSize),
        transportCostPerKm: Number(transportRate),
        vehicleType: vehicle as any,
        priceAlerts,
        weatherAlerts,
        crops: selectedCrops,
      })
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3500)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* ── Settings Header ─────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <span className="section-kicker">Preferences & Crop Configuration</span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Farm & Account Settings
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Configure your crops, planted varieties, harvest timelines, transport freight, and live alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedToast && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
                <CheckCircle2 className="size-4" /> Changes Saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="button-primary button-large disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              <Save className="size-4" />
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* ── Main Settings Tabs ───────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Tab Switcher (Minimal, Sharp & Organised) */}
          <aside className="lg:col-span-3 flex flex-col gap-2 shrink-0">
            <div className="hidden lg:flex items-center justify-between px-1 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              <span>Settings Navigation</span>
            </div>

            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0 p-1 rounded-xl bg-card border border-border/80">
              <button
                type="button"
                onClick={() => setActiveTab('crops')}
                className={cn(
                  'flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all shrink-0 w-full border',
                  activeTab === 'crops'
                    ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Leaf className={cn('size-3.5 shrink-0', activeTab === 'crops' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="truncate">My Crops & Harvest</span>
                </div>
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0', activeTab === 'crops' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  {selectedCrops.length} Active
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all shrink-0 w-full border',
                  activeTab === 'profile'
                    ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className={cn('size-3.5 shrink-0', activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="truncate">Profile, Freight & Alerts</span>
                </div>
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-mono font-medium shrink-0', activeTab === 'profile' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  3 Sections
                </span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Pane (9 cols) */}
          <main className="lg:col-span-9 flex flex-col gap-6">
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB 1: CROPS PERSONALIZATION & UNIFIED SPECIFICATION         */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'crops' && (
              <div className="flex flex-col gap-6">
                {/* 1. Crop Selection Grid - GUARANTEED EQUAL HEIGHT (Fix for Image 8) */}
                <section className="card-luxury">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-border">
                    <div>
                      <span className="section-kicker">Harvest Catalog</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                        Select What You Cultivate
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose crops to monitor. Click any crop to edit its planted acres, variety, and harvest window below.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">
                      {selectedCrops.length} of {allCrops.length} Selected
                    </span>
                  </div>

                  {/* Uniform Equal-Height Cards (No layout shifts or expansion) */}
                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                    {allCrops.map((crop) => {
                      const isSelected = selectedCrops.includes(crop.name)
                      const isBeingEdited = editingCrop === crop.name

                      return (
                        <div
                          key={crop.name}
                          onClick={() => {
                            if (!isSelected) toggleCrop(crop.name)
                            setEditingCrop(crop.name)
                          }}
                          className={cn(
                            'relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between select-none h-[116px] group',
                            isSelected
                              ? isBeingEdited
                                ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-md shadow-primary/15'
                                : 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                              : 'border-border bg-card hover:border-primary/40 opacity-75 hover:opacity-100'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {crop.name}
                              </h3>
                              <p className="text-[11px] text-muted-foreground truncate">{crop.local}</p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCrop(crop.name)
                              }}
                              className={cn(
                                'grid size-5 place-items-center rounded-full border transition-all shrink-0 mt-0.5',
                                isSelected ? 'border-primary bg-primary text-white' : 'border-border bg-background'
                              )}
                              title={isSelected ? 'Deselect crop' : 'Select crop'}
                            >
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                            <span className="font-mono font-bold text-primary">
                              {formatINR(crop.price)}/q
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                <Edit3 className="size-3 text-primary" />
                                {isBeingEdited ? 'Configuring' : 'Active'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* 2. Unified Crop Specification Configuration Panel (Fix for Image 10) */}
                <section className="card-luxury relative overflow-hidden bg-gradient-to-b from-card to-primary/5 border border-primary/30 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid size-12 place-items-center rounded-2xl font-bold font-display text-xl text-white shadow-md"
                        style={{ backgroundColor: currentCropObj.color }}
                      >
                        {editingCrop.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="section-kicker">Unified Crop Configuration</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                            Modal: {formatINR(currentCropObj.price)}/q
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                          {editingCrop} Specifications
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Select another crop to configure:</span>
                      <select
                        value={editingCrop}
                        onChange={(e) => setEditingCrop(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer"
                      >
                        {allCrops.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.local})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Unified Information Form for Clicked Crop */}
                  <div className="grid gap-6 sm:grid-cols-2 mt-6">
                    {/* Variety & Seed Selection */}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Cultivated Variety</span>
                        <span className="text-[11px] font-normal text-muted-foreground">Common regional seeds</span>
                      </label>

                      {/* Variety Quick Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {(varietyPresets[editingCrop] || ['Standard', 'Desi', 'Hybrid']).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateCurrentSpec('variety', preset)}
                            className={cn(
                              'rounded-xl px-2.5 py-1 text-xs font-semibold transition-all',
                              currentSpecs.variety === preset
                                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={currentSpecs.variety}
                        onChange={(e) => updateCurrentSpec('variety', e.target.value)}
                        placeholder="Or enter custom variety name..."
                        className="field-input mt-1 !h-10 !text-xs font-medium"
                      />
                    </div>

                    {/* Planted Acreage */}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Planted Acreage</span>
                        <span className="text-[11px] font-mono font-bold text-primary">
                          Est. Yield: ~{Math.round(currentSpecs.acres * (editingCrop === 'Onion' ? 60 : editingCrop === 'Wheat' ? 22 : 35))}q
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.5"
                          max="100"
                          step="0.5"
                          value={currentSpecs.acres}
                          onChange={(e) => updateCurrentSpec('acres', Math.max(0.5, Number(e.target.value) || 1))}
                          className="field-input flex-1 !h-10 !text-sm font-mono font-bold"
                        />
                        <span className="font-bold text-xs text-muted-foreground">Acres</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 5, 8].map((presetAcres) => (
                          <button
                            key={presetAcres}
                            type="button"
                            onClick={() => updateCurrentSpec('acres', presetAcres)}
                            className={cn(
                              'rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all',
                              currentSpecs.acres === presetAcres
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {presetAcres} Ac
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Typical Harvest Window (Start & End Month Selection) */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" />
                          <span>Harvest Season (Start & End Month)</span>
                        </label>
                        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {currentSpecs.harvest}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Start Month */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Start Month</span>
                          <select
                            value={currentRange.start}
                            onChange={(e) => handleStartMonthChange(e.target.value)}
                            className="field-input !h-9 !text-xs font-semibold cursor-pointer"
                          >
                            {ALL_MONTHS.map((m) => (
                              <option key={`start-${m}`} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        {/* End Month */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">End Month</span>
                          <select
                            value={currentRange.end}
                            onChange={(e) => handleEndMonthChange(e.target.value)}
                            className="field-input !h-9 !text-xs font-semibold cursor-pointer"
                          >
                            {ALL_MONTHS.map((m) => (
                              <option key={`end-${m}`} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Season Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Quick Presets:</span>
                        {SEASON_PRESETS.map((preset) => {
                          const isSelected = currentSpecs.harvest === preset.range || 
                            (preset.label === 'Year-round' && (currentSpecs.harvest === 'Year-round' || currentSpecs.harvest === 'January – December'))
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => updateCurrentSpec('harvest', preset.range)}
                              className={cn(
                                'rounded-md border px-2 py-0.5 text-[10px] font-mono font-semibold transition-all',
                                isSelected
                                  ? 'border-primary bg-primary text-white shadow-2xs'
                                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                              title={`${preset.label} (${preset.range}) - ${preset.desc}`}
                            >
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Preferred Target Mandi */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary" />
                        <span>Default Target Mandi Partner</span>
                      </label>
                      <select
                        value={currentSpecs.targetMandi || 'Surat APMC'}
                        onChange={(e) => updateCurrentSpec('targetMandi', e.target.value)}
                        className="field-input !h-10 !text-xs font-semibold cursor-pointer"
                      >
                        <option value="Surat APMC">Surat APMC (142 km · NH48)</option>
                        <option value="Pune Market Yard">Pune Market Yard (188 km · NH60)</option>
                        <option value="Ahmedabad APMC">Ahmedabad APMC (260 km · NE1)</option>
                        <option value="Indore Mandi">Indore APMC (310 km · NH52)</option>
                        <option value="Lasalgaon APMC">Lasalgaon APMC (35 km · Local)</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* 3. Neat Configured Summary Cards (Fix for Image 9) */}
                <section className="card-luxury">
                  <div className="pb-4 border-b border-border flex items-center justify-between">
                    <div>
                      <span className="section-kicker">Summary Roster</span>
                      <h2 className="text-xl font-extrabold font-display">
                        Configured Active Produce
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {selectedCrops.length} Active Records
                    </span>
                  </div>

                  {/* Neatly Aligned, Structured Cards */}
                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                    {selectedCrops.map((cropName) => {
                      const crop = allCrops.find((c) => c.name === cropName) || allCrops[0]
                      const details = cropVarieties[cropName] || {
                        acres: 2,
                        variety: crop.variety || 'Standard',
                        harvest: 'April / May',
                        targetMandi: 'Surat APMC',
                      }

                      return (
                        <div
                          key={cropName}
                          className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-foreground truncate">{cropName}</h4>
                              <p className="text-[10px] text-muted-foreground truncate">{crop.local}</p>
                            </div>

                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-mono font-bold text-primary shrink-0">
                              {details.acres} Acres
                            </span>
                          </div>

                          <div className="rounded-xl bg-background p-2.5 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Variety:</span>
                              <strong className="text-foreground font-semibold truncate max-w-[130px]">
                                {details.variety}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Harvest Window:</span>
                              <strong className="text-primary font-semibold">
                                {details.harvest}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCrop(cropName)
                                window.scrollTo({ top: 380, behavior: 'smooth' })
                              }}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Edit3 className="size-3" /> Edit Specs
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCrop(cropName)}
                              className="text-xs text-muted-foreground hover:text-risk transition-colors"
                              title="Remove crop"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB 2: UNIFIED FARMER PROFILE, FREIGHT & ALERTS (Fix for 11)*/}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6">
                {/* 1. Farmer & Land Identity */}
                <section className="card-luxury flex flex-col gap-6">
                  <div className="pb-4 border-b border-border flex items-center justify-between">
                    <div>
                      <span className="section-kicker">Farmer Identity & Origin</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                        Land & Contact Details
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your origin village and district are used for precise road logistics calculations.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="field-label">
                      Full Name
                      <input
                        className="field-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                      />
                    </label>

                    <label className="field-label">
                      Verified Mobile Number
                      <div className="relative flex items-center">
                        <input
                          className="field-input w-full bg-muted text-muted-foreground cursor-not-allowed"
                          value={user?.mobile ? `+91 ${user.mobile}` : '+91 98123 45678'}
                          readOnly
                        />
                        <span className="absolute right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-3" /> Verified
                        </span>
                      </div>
                    </label>

                    <label className="field-label">
                      Village / Taluka
                      <input
                        className="field-input"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Niphad / Nashik"
                      />
                    </label>

                    <label className="field-label">
                      District
                      <input
                        className="field-input"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Nashik"
                      />
                    </label>

                    <label className="field-label">
                      State
                      <select
                        className="field-input cursor-pointer"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Rajasthan">Rajasthan</option>
                      </select>
                    </label>

                    <label className="field-label">
                      Total Cultivated Land (Acres)
                      <input
                        className="field-input"
                        type="number"
                        value={farmSize}
                        onChange={(e) => setFarmSize(Number(e.target.value) || 1)}
                      />
                    </label>
                  </div>
                </section>

                {/* 2. Transport & Logistics */}
                <section className="card-luxury flex flex-col gap-6">
                  <div className="pb-4 border-b border-border">
                    <span className="section-kicker">Transport Logistics</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                      Vehicle & Freight Economics
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Accurate freight per km is deducted in real-time to compute true net arbitrage.
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground">Default Transport Vehicle</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { id: 'pickup', label: 'Pickup (1.5T)', rate: '₹7/km' },
                          { id: 'truck', label: 'Medium (5T)', rate: '₹12/km' },
                          { id: 'heavy', label: 'Heavy (10T+)', rate: '₹18/km' },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVehicle(v.id as any)}
                            className={cn(
                              'rounded-xl border p-2.5 text-xs font-bold transition-all text-center',
                              vehicle === v.id
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span className="block">{v.label}</span>
                            <span className="text-[10px] font-mono opacity-80">{v.rate}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground">Estimated Freight Cost per Km</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          className="field-input flex-1 font-mono font-bold"
                          type="number"
                          value={transportRate}
                          onChange={(e) => setTransportRate(Number(e.target.value) || 1)}
                        />
                        <span className="font-bold text-sm text-muted-foreground">₹ / km</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Standard diesel + driver allowance rate is ₹6.50 – ₹8.00/km.
                      </span>
                    </div>
                  </div>
                </section>

                {/* 3. Smart Market Alerts & Interface Preferences */}
                <section className="card-luxury flex flex-col gap-6">
                  <div className="pb-4 border-b border-border">
                    <span className="section-kicker">Intelligence Feeds</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                      Alerts & System Preferences
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive early-morning mandi auction rates and transport weather advisories.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Alert 1 */}
                    <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-background">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Smartphone className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">WhatsApp Price Jump Alerts</p>
                          <p className="text-xs text-muted-foreground">Instant WhatsApp alert when any partner mandi surges &gt;5%</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={priceAlerts}
                        onChange={(e) => setPriceAlerts(e.target.checked)}
                        className="size-5 accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Alert 2 */}
                    <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-background">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-sky/10 text-sky">
                          <Radio className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Severe Weather & Highway Monsoon Radar</p>
                          <p className="text-xs text-muted-foreground">Real-time warning if unseasonal rain affects transport corridors</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={weatherAlerts}
                        onChange={(e) => setWeatherAlerts(e.target.checked)}
                        className="size-5 accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Alert 3 */}
                    <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-background">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-accent">
                          <Bell className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Morning Auction Digest</p>
                          <p className="text-xs text-muted-foreground">Daily SMS summary at 08:00 AM before auctions open</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={auctionAlerts}
                        onChange={(e) => setAuctionAlerts(e.target.checked)}
                        className="size-5 accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Language Switcher */}
                    <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">Application Language</p>
                        <p className="text-xs text-muted-foreground">Switch UI language across all pages</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { code: 'en', label: 'English (India)' },
                          { code: 'hi', label: 'हिन्दी (Hindi)' },
                          { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
                        ].map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setLanguage(l.code as any)}
                            className={cn(
                              'rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                              language === l.code
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
