'use client'

import { useState } from 'react'
import { 
  Check, 
  Save, 
  Sun, 
  Moon, 
  Leaf, 
  MapPin, 
  Truck, 
  Bell, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  Sliders,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/components/auth-provider'
import { useLocale } from '@/components/locale-provider'
import { allCrops, Crop } from '@/lib/api/sabha'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { language, setLanguage } = useLocale()

  const [activeTab, setActiveTab] = useState<'profile' | 'crops' | 'logistics' | 'alerts'>('crops')
  const [savedToast, setSavedToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [name, setName] = useState(user?.name || 'Ramesh Patel')
  const [village, setVillage] = useState(user?.village || 'Nashik')
  const [district, setDistrict] = useState(user?.district || 'Nashik')
  const [state, setState] = useState(user?.state || 'Maharashtra')
  const [farmSize, setFarmSize] = useState(user?.farmSizeAcres || 5)
  const [transportRate, setTransportRate] = useState(user?.transportCostPerKm || 7)
  const [vehicle, setVehicle] = useState(user?.vehicleType || 'pickup')
  const [priceAlerts, setPriceAlerts] = useState(user?.priceAlerts ?? true)
  const [weatherAlerts, setWeatherAlerts] = useState(user?.weatherAlerts ?? true)

  // Crops Personalization State
  const [selectedCrops, setSelectedCrops] = useState<string[]>(
    user?.crops && user.crops.length > 0 ? user.crops : ['Onion', 'Wheat', 'Soybean']
  )

  const [cropVarieties, setCropVarieties] = useState<Record<string, { acres: number; variety: string; harvest: string }>>({
    Onion: { acres: 3, variety: 'Nashik Red (Garwa)', harvest: 'April / May' },
    Wheat: { acres: 2, variety: 'Sharbati / Lokwan', harvest: 'March' },
    Soybean: { acres: 2, variety: 'JS 335', harvest: 'October' },
    Tomato: { acres: 1, variety: 'Abhinav Hybrid', harvest: 'January' },
    Cotton: { acres: 4, variety: 'BT Cotton (Shankar-6)', harvest: 'November' },
    Potato: { acres: 1.5, variety: 'Kufri Jyoti', harvest: 'February' },
    Garlic: { acres: 1, variety: 'Desi G2 White', harvest: 'December' },
    Mustard: { acres: 2, variety: 'Pusa Bold', harvest: 'January' },
    Maize: { acres: 2, variety: 'Pioneer Yellow', harvest: 'September' },
  })

  function toggleCrop(cropName: string) {
    if (selectedCrops.includes(cropName)) {
      if (selectedCrops.length <= 1) return // Keep at least one
      setSelectedCrops(selectedCrops.filter((c) => c !== cropName))
    } else {
      setSelectedCrops([...selectedCrops, cropName])
    }
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
            <span className="section-kicker">Account & Crop Personalization</span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Farm Settings
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Personalize what you grow, your transport radius, and real-time mandi alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedToast && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary animate-in fade-in duration-300">
                <CheckCircle2 className="size-4" /> Saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="button-primary button-large disabled:opacity-60"
            >
              <Save className="size-4" />
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* ── Main Settings Workbench (Tabbed / 2-Column) ──────────────── */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Navigation Tabs (3 cols) */}
          <aside className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab('crops')}
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-left transition-all shrink-0 w-full',
                activeTab === 'crops'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-3">
                <Leaf className="size-4.5" />
                <span>My Crops & Harvest</span>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-mono font-bold', activeTab === 'crops' ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary')}>
                {selectedCrops.length} Active
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-left transition-all shrink-0 w-full',
                activeTab === 'profile'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <MapPin className="size-4.5" />
              <span>Farm & Profile Info</span>
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-left transition-all shrink-0 w-full',
                activeTab === 'logistics'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Truck className="size-4.5" />
              <span>Logistics & Freight</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-left transition-all shrink-0 w-full',
                activeTab === 'alerts'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Bell className="size-4.5" />
              <span>Alerts & Notifications</span>
            </button>
          </aside>

          {/* Right Content Pane (9 cols) */}
          <main className="lg:col-span-9 flex flex-col gap-6">
            {/* ── TAB 1: CROPS PERSONALIZATION ──────────────────────────── */}
            {activeTab === 'crops' && (
              <div className="flex flex-col gap-6">
                <section className="card-luxury">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-border">
                    <div>
                      <span className="section-kicker">Personalized Harvesting</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                        What crops do you grow and sell?
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select the crops you actively cultivate. Mandi Sabha will automatically track price jumps, mandi arbitrage, and dispatch windows for these crops.
                      </p>
                    </div>
                  </div>

                  {/* Crop Selection Grid */}
                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                    {allCrops.map((crop) => {
                      const isSelected = selectedCrops.includes(crop.name)
                      const details = cropVarieties[crop.name] || { acres: 2, variety: crop.variety, harvest: 'April' }

                      return (
                        <div
                          key={crop.name}
                          onClick={() => toggleCrop(crop.name)}
                          className={cn(
                            'relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between select-none',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
                              : 'border-border bg-card hover:border-primary/50 opacity-70 hover:opacity-100'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="grid size-11 place-items-center rounded-xl font-bold font-display text-lg"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${crop.color} 15%, transparent)`,
                                  color: crop.color,
                                }}
                              >
                                {crop.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-foreground">{crop.name}</h3>
                                <p className="text-[11px] text-muted-foreground">{crop.local}</p>
                              </div>
                            </div>

                            <div
                              className={cn(
                                'grid size-6 place-items-center rounded-full border transition-all',
                                isSelected ? 'border-primary bg-primary text-white' : 'border-border bg-background'
                              )}
                            >
                              {isSelected && <Check className="size-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-4 pt-3 border-t border-border/70 flex flex-col gap-2 text-xs">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Variety:</span>
                                <span className="font-semibold text-foreground truncate max-w-[140px]">
                                  {details.variety || 'Standard'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Typical Harvest:</span>
                                <span className="font-semibold text-primary">{details.harvest}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Crop Fine-Tuning Acreage & Varieties */}
                <section className="card-luxury">
                  <div className="pb-4 border-b border-border">
                    <span className="section-kicker">Harvest Specifications</span>
                    <h2 className="text-xl font-extrabold font-display">
                      Acreage & Variety Details
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fine-tune your acreage to improve volume calculation accuracy in Sabha negotiations.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                    {selectedCrops.map((cropName) => {
                      const crop = allCrops.find((c) => c.name === cropName)
                      const details = cropVarieties[cropName] || { acres: 2, variety: crop?.variety || '', harvest: 'April' }

                      return (
                        <div key={cropName} className="rounded-2xl border border-border bg-background/80 p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-primary" />
                              {cropName}
                            </span>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {details.acres} Acres
                            </span>
                          </div>

                          <label className="text-xs font-bold text-muted-foreground">
                            Planted Acres
                            <input
                              type="number"
                              min="0.5"
                              max="100"
                              step="0.5"
                              value={details.acres}
                              onChange={(e) => {
                                setCropVarieties({
                                  ...cropVarieties,
                                  [cropName]: { ...details, acres: Number(e.target.value) || 1 },
                                })
                              }}
                              className="field-input mt-1 !h-10 !text-xs"
                            />
                          </label>

                          <label className="text-xs font-bold text-muted-foreground">
                            Variety
                            <input
                              type="text"
                              value={details.variety}
                              onChange={(e) => {
                                setCropVarieties({
                                  ...cropVarieties,
                                  [cropName]: { ...details, variety: e.target.value },
                                })
                              }}
                              className="field-input mt-1 !h-10 !text-xs"
                            />
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ── TAB 2: FARM PROFILE ───────────────────────────────────── */}
            {activeTab === 'profile' && (
              <section className="card-luxury flex flex-col gap-6">
                <div className="pb-4 border-b border-border">
                  <span className="section-kicker">Identity & Origin</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                    Farmer & Land Details
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your location is used to calculate precise road distances and freight tolls to all mandis.
                  </p>
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
                      <span className="absolute right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
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
                      className="field-input"
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
                      onChange={(e) => setFarmSize(Number(e.target.value))}
                    />
                  </label>
                </div>
              </section>
            )}

            {/* ── TAB 3: LOGISTICS & FREIGHT ────────────────────────────── */}
            {activeTab === 'logistics' && (
              <section className="card-luxury flex flex-col gap-6">
                <div className="pb-4 border-b border-border">
                  <span className="section-kicker">Transport Economics</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                    Freight & Vehicle Settings
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mandi Sabha automatically deducts accurate diesel & freight costs per km to compute your true net profit.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <label className="field-label">
                      Estimated Freight Cost per Km
                      <div className="flex items-center gap-2">
                        <input
                          className="field-input flex-1 font-mono font-bold"
                          type="number"
                          value={transportRate}
                          onChange={(e) => setTransportRate(Number(e.target.value))}
                        />
                        <span className="font-bold text-sm text-muted-foreground">₹ / km</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Standard diesel + driver allowance rate across Western India is ₹6.50 – ₹8.00/km.
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="field-label">
                      Default Transport Vehicle
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { id: 'pickup', label: 'Pickup (1.5T)' },
                          { id: 'truck', label: 'Medium (5T)' },
                          { id: 'heavy', label: 'Heavy (10T+)' },
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
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {/* ── TAB 4: ALERTS & PREFERENCES ───────────────────────────── */}
            {activeTab === 'alerts' && (
              <section className="card-luxury flex flex-col gap-6">
                <div className="pb-4 border-b border-border">
                  <span className="section-kicker">Intelligence Feeds</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                    Alerts & Interface Preferences
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive timely WhatsApp & SMS market alerts before morning auctions open.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Alert 1 */}
                  <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Smartphone className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">WhatsApp Price Jump Alerts</p>
                        <p className="text-xs text-muted-foreground">Notify when any mandi within 250km surges &gt;5%</p>
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
                  <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-sky/10 text-sky">
                        <Radio className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Severe Weather & Monsoon Alerts</p>
                        <p className="text-xs text-muted-foreground">Instant warning if unseasonal rain affects transport highways</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={weatherAlerts}
                      onChange={(e) => setWeatherAlerts(e.target.checked)}
                      className="size-5 accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Language Selection */}
                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    <label className="text-sm font-bold text-foreground">System Language</label>
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
                            'tab-button',
                            language === l.code && 'active'
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
