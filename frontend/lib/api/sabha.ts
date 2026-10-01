'use client'

export type Crop = 'Onion' | 'Tomato' | 'Wheat' | 'Potato' | 'Soybean' | 'Cotton' | 'Garlic' | 'Mustard' | 'Maize'

export type SabhaDraft = {
  id?: string
  crop: Crop
  quantity: number
  location: string
  urgency: 'today' | 'soon' | 'week'
  targetDate?: string
  radius: number
  vehicleType?: 'pickup' | 'truck' | 'heavy'
  originCoords?: [number, number]
  targetMandi?: string
}

export type PersonalizedCrop = {
  name: Crop
  local: string
  price: number
  color: string
  iconType: string
  acres?: number
  harvestMonth?: string
  isPrimary?: boolean
  variety?: string
}

export const allCrops: PersonalizedCrop[] = [
  { name: 'Onion', local: 'Pyaz / કાંદા', price: 2140, color: '#EA580C', iconType: 'onion', variety: 'Nashik Red' },
  { name: 'Wheat', local: 'Gehu / ઘઉં', price: 2640, color: '#D97706', iconType: 'wheat', variety: 'Sharbati / Lokwan' },
  { name: 'Tomato', local: 'Tamatar / ટામેટા', price: 2480, color: '#EF4444', iconType: 'tomato', variety: 'Hybrid Grade-A' },
  { name: 'Soybean', local: 'Soyabean / સોયાબીન', price: 4750, color: '#10B981', iconType: 'soybean', variety: 'JS 335' },
  { name: 'Cotton', local: 'Kapas / કપાસ', price: 7200, color: '#8B5CF6', iconType: 'cotton', variety: 'Shankar-6' },
  { name: 'Potato', local: 'Aloo / બટાકા', price: 1760, color: '#0EA5E9', iconType: 'potato', variety: 'Pukhraj / Jyoti' },
  { name: 'Garlic', local: 'Lahsun / લસણ', price: 8900, color: '#F59E0B', iconType: 'garlic', variety: 'Desi White' },
  { name: 'Mustard', local: 'Sarson / રાયડો', price: 5400, color: '#EAB308', iconType: 'mustard', variety: 'Pusa Bold' },
  { name: 'Maize', local: 'Makka / મકાઈ', price: 2250, color: '#F97316', iconType: 'maize', variety: 'Yellow Dent' },
]

export const crops = allCrops

export type EvaluatedMandi = {
  name: string
  district: string
  state: string
  price: number
  gross: number
  freight: number
  net: number
  distanceKm: number
  distance: string
  color: string
  advantage: number
  isLocal: boolean
  coords: [number, number]
  highway: string
  tollPlaza: string
}

const MANDI_DIRECTORY: {
  name: string
  district: string
  state: string
  coords: [number, number]
  color: string
  highway: string
  tollPlaza: string
  basePrices: Partial<Record<Crop, number>>
}[] = [
  {
    name: 'Gondal APMC',
    district: 'Rajkot',
    state: 'Gujarat',
    coords: [21.9620, 70.7960],
    color: '#0F6B47',
    highway: 'NH27 / Gondal Highway',
    tollPlaza: 'Bhojpara Toll Plaza',
    basePrices: { Onion: 2520, Tomato: 2600, Wheat: 2750, Cotton: 7450, Garlic: 9200, Potato: 1850 },
  },
  {
    name: 'Rajkot Market Yard',
    district: 'Rajkot',
    state: 'Gujarat',
    coords: [22.3039, 70.8022],
    color: '#8B5CF6',
    highway: 'NH27 Saurashtra Corridor',
    tollPlaza: 'Bedi Toll Plaza',
    basePrices: { Onion: 2120, Tomato: 2420, Wheat: 2640, Cotton: 7200, Garlic: 8900, Potato: 1760 },
  },
  {
    name: 'Morbi APMC',
    district: 'Morbi',
    state: 'Gujarat',
    coords: [22.8120, 70.8378],
    color: '#0284C7',
    highway: 'NH8A Morbi Highway',
    tollPlaza: 'Wankaner Toll Plaza',
    basePrices: { Onion: 2180, Tomato: 2380, Wheat: 2610, Cotton: 7150, Garlic: 8850, Potato: 1720 },
  },
  {
    name: 'Jamnagar APMC',
    district: 'Jamnagar',
    state: 'Gujarat',
    coords: [22.4707, 70.0577],
    color: '#D97706',
    highway: 'SH26 / Jamnagar Highway',
    tollPlaza: 'Theba Toll Plaza',
    basePrices: { Onion: 2140, Tomato: 2350, Wheat: 2600, Cotton: 7100, Garlic: 8800, Potato: 1700 },
  },
  {
    name: 'Ahmedabad APMC',
    district: 'Ahmedabad',
    state: 'Gujarat',
    coords: [23.0076, 72.5645],
    color: '#EAB308',
    highway: 'NE1 Express Highway',
    tollPlaza: 'Ahmedabad Ring Toll',
    basePrices: { Onion: 2380, Tomato: 2550, Wheat: 2700, Cotton: 7300, Garlic: 9100, Potato: 1820 },
  },
  {
    name: 'Surat APMC',
    district: 'Surat',
    state: 'Gujarat',
    coords: [21.1926, 72.8541],
    color: '#10B981',
    highway: 'NH48 Freight Corridor',
    tollPlaza: 'Surat National Toll Plaza',
    basePrices: { Onion: 2600, Tomato: 2700, Wheat: 2800, Cotton: 7500, Garlic: 9400, Potato: 1900 },
  },
  {
    name: 'Indore Mandi',
    district: 'Indore',
    state: 'Madhya Pradesh',
    coords: [22.7196, 75.8577],
    color: '#10B981',
    highway: 'NH52 Malwa Expressway',
    tollPlaza: 'Dhamnod Toll Plaza',
    basePrices: { Onion: 2280, Tomato: 2500, Wheat: 2680, Cotton: 7250, Garlic: 9150, Potato: 1800 },
  },
  {
    name: 'Lasalgaon APMC',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [20.1472, 74.2268],
    color: '#EA580C',
    highway: 'NH848 Agri Expressway',
    tollPlaza: 'Pimpalgaon Toll Gate',
    basePrices: { Onion: 1850, Tomato: 2300, Wheat: 2500, Cotton: 6850, Garlic: 8600, Potato: 1650 },
  },
  {
    name: 'Pune Market Yard',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [18.4967, 73.8643],
    color: '#0284C7',
    highway: 'NH60 Pune Expressway',
    tollPlaza: 'Khed Shivapur Toll Plaza',
    basePrices: { Onion: 2200, Tomato: 2650, Wheat: 2720, Cotton: 7100, Garlic: 9000, Potato: 1800 },
  },
]

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function evaluateSabhaCandidates(draft: Partial<SabhaDraft>) {
  const crop = draft.crop || 'Onion'
  const qty = draft.quantity || 20
  const vehicle = draft.vehicleType || 'pickup'

  // Resolve origin coords
  let origin: [number, number] = [22.3039, 70.8022] // Default to Rajkot
  const loc = (draft.location || '').toLowerCase()

  if (draft.originCoords && draft.originCoords.length === 2) {
    origin = draft.originCoords
  } else if (loc.includes('rajkot')) {
    origin = [22.3039, 70.8022]
  } else if (loc.includes('gondal')) {
    origin = [21.9620, 70.7960]
  } else if (loc.includes('ahmedabad')) {
    origin = [23.0225, 72.5714]
  } else if (loc.includes('surat')) {
    origin = [21.1702, 72.8311]
  } else if (loc.includes('nashik') || loc.includes('lasalgaon')) {
    origin = [19.9975, 73.7898]
  } else if (loc.includes('pune')) {
    origin = [18.5204, 73.8567]
  }

  // Calculate distances to all mandis
  const evaluated = MANDI_DIRECTORY.map((m) => {
    const straight = haversineDist(origin[0], origin[1], m.coords[0], m.coords[1])
    
    // Check if route goes across Gulf of Khambhat (e.g. Saurashtra <-> South Gujarat)
    const isSaurashtraToSouth = origin[1] < 71.9 && m.coords[1] > 72.6 && m.coords[0] < 21.8
    const roadFactor = isSaurashtraToSouth ? 1.45 : 1.25
    const distanceKm = Math.max(6, Math.round(straight * roadFactor))

    // Freight rate
    const perKm = vehicle === 'truck' ? 19.2 : vehicle === 'heavy' ? 28.8 : 11.2
    const freight = Math.max(350, Math.round(distanceKm * perKm))

    const cropPriceObj = allCrops.find((c) => c.name === crop)
    const baseDefaultPrice = cropPriceObj ? cropPriceObj.price : 2140
    const price = m.basePrices[crop] || baseDefaultPrice

    const gross = price * qty
    const net = Math.max(0, gross - freight)

    return {
      name: m.name,
      district: m.district,
      state: m.state,
      price,
      gross,
      freight,
      net,
      distanceKm,
      distance: `${distanceKm} km`,
      color: m.color,
      highway: m.highway,
      tollPlaza: m.tollPlaza,
      coords: m.coords,
      isLocal: false,
      advantage: 0,
    }
  })

  // Filter within reasonable radius (e.g. up to 450 km)
  const maxRadius = Math.max(draft.radius || 250, 200)
  let candidates = evaluated.filter((m) => m.distanceKm <= maxRadius)
  if (candidates.length < 3) {
    candidates = [...evaluated].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5)
  }

  // The local baseline is strictly the physically closest mandi to the farm
  candidates.sort((a, b) => a.distanceKm - b.distanceKm)
  const localBaseline = candidates[0]
  localBaseline.isLocal = true

  // Compute pure advantage vs the nearest local baseline
  candidates.forEach((m) => {
    m.advantage = Math.round(m.net - localBaseline.net)
  })

  // Sort candidates by net realization descending: #1 is the Consensus Winner
  const ranked = [...candidates].sort((a, b) => b.net - a.net)
  const winner = ranked[0]

  return {
    winner,
    localBaseline,
    ranked,
    originCoords: origin,
    originLocation: draft.location || (loc.includes('rajkot') ? 'Rajkot, Gujarat' : 'Farm Gate'),
  }
}

export async function createSabha(draft: SabhaDraft) {
  const id = `sabha-${Date.now()}`
  const session = { id, ...draft }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`sabha_draft_${id}`, JSON.stringify(session))
      localStorage.setItem('sabha_latest_draft', JSON.stringify(session))
    } catch {}
  }

  return session
}

export type DashboardSession = {
  id: string
  date: string
  crop: Crop
  quantity: number
  mandi: string
  gain: number
  status: string
  distance: string
  pricePerQ: number
}

export type DashboardData = {
  sessions: DashboardSession[]
  earnings: number[]
  monthlyData: { month: string; earned: number; sabhas: number }[]
  winners: { name: string; value: number; percent: number; avgGain: string; crop: string }[]
  pulse: { crop: string; price: number; change: number; mandi: string; high: number; low: number; trend: number[] }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  return {
    sessions: [],
    earnings: [],
    monthlyData: [],
    winners: [],
    pulse: [],
  }
}

export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}
