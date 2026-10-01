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
  basePrices: Record<Crop, number>
}[] = [
  // ── Gujarat ──
  {
    name: 'Gondal APMC',
    district: 'Rajkot',
    state: 'Gujarat',
    coords: [21.9620, 70.7960],
    color: '#0F6B47',
    highway: 'NH27 / Gondal Highway',
    tollPlaza: 'Bhojpara Toll Plaza',
    basePrices: { Onion: 2520, Tomato: 2600, Wheat: 2750, Cotton: 7450, Garlic: 9200, Potato: 1850, Soybean: 4820, Mustard: 5350, Maize: 2280 },
  },
  {
    name: 'Rajkot Market Yard',
    district: 'Rajkot',
    state: 'Gujarat',
    coords: [22.3039, 70.8022],
    color: '#8B5CF6',
    highway: 'NH27 Saurashtra Corridor',
    tollPlaza: 'Bedi Toll Plaza',
    basePrices: { Onion: 2120, Tomato: 2420, Wheat: 2640, Cotton: 7200, Garlic: 8900, Potato: 1760, Soybean: 4750, Mustard: 5280, Maize: 2220 },
  },
  {
    name: 'Morbi APMC',
    district: 'Morbi',
    state: 'Gujarat',
    coords: [22.8120, 70.8378],
    color: '#0284C7',
    highway: 'NH8A Morbi Highway',
    tollPlaza: 'Wankaner Toll Plaza',
    basePrices: { Onion: 2180, Tomato: 2380, Wheat: 2610, Cotton: 7150, Garlic: 8850, Potato: 1720, Soybean: 4700, Mustard: 5250, Maize: 2200 },
  },
  {
    name: 'Jamnagar APMC',
    district: 'Jamnagar',
    state: 'Gujarat',
    coords: [22.4707, 70.0577],
    color: '#D97706',
    highway: 'SH26 / Jamnagar Highway',
    tollPlaza: 'Theba Toll Plaza',
    basePrices: { Onion: 2140, Tomato: 2350, Wheat: 2600, Cotton: 7100, Garlic: 8800, Potato: 1700, Soybean: 4680, Mustard: 5220, Maize: 2190 },
  },
  {
    name: 'Ahmedabad APMC',
    district: 'Ahmedabad',
    state: 'Gujarat',
    coords: [23.0076, 72.5645],
    color: '#EAB308',
    highway: 'NE1 Express Highway',
    tollPlaza: 'Ahmedabad Ring Toll',
    basePrices: { Onion: 2380, Tomato: 2550, Wheat: 2700, Cotton: 7300, Garlic: 9100, Potato: 1820, Soybean: 4800, Mustard: 5320, Maize: 2250 },
  },
  {
    name: 'Surat APMC',
    district: 'Surat',
    state: 'Gujarat',
    coords: [21.1926, 72.8541],
    color: '#10B981',
    highway: 'NH48 Freight Corridor',
    tollPlaza: 'Surat National Toll Plaza',
    basePrices: { Onion: 2600, Tomato: 2700, Wheat: 2800, Cotton: 7500, Garlic: 9400, Potato: 1900, Soybean: 4900, Mustard: 5400, Maize: 2320 },
  },
  {
    name: 'Unjha APMC',
    district: 'Mehsana',
    state: 'Gujarat',
    coords: [23.8039, 72.3944],
    color: '#F59E0B',
    highway: 'SH41 Mehsana Expressway',
    tollPlaza: 'Unjha Toll Gate',
    basePrices: { Onion: 2250, Tomato: 2400, Wheat: 2680, Cotton: 7250, Garlic: 9050, Potato: 1750, Soybean: 4720, Mustard: 5450, Maize: 2240 },
  },

  // ── Punjab ──
  {
    name: 'Khanna Mandi',
    district: 'Ludhiana',
    state: 'Punjab',
    coords: [30.7067, 76.2205],
    color: '#D97706',
    highway: 'NH44 Grand Trunk Road',
    tollPlaza: 'Ladowal Toll Plaza',
    basePrices: { Onion: 2200, Tomato: 2450, Wheat: 2820, Cotton: 7350, Garlic: 8800, Potato: 1680, Soybean: 4650, Mustard: 5500, Maize: 2350 },
  },
  {
    name: 'Ludhiana APMC',
    district: 'Ludhiana',
    state: 'Punjab',
    coords: [30.9010, 75.8573],
    color: '#0284C7',
    highway: 'NH5 Ferozepur Road',
    tollPlaza: 'Sidhwan Toll Gate',
    basePrices: { Onion: 2250, Tomato: 2500, Wheat: 2790, Cotton: 7300, Garlic: 8850, Potato: 1700, Soybean: 4620, Mustard: 5480, Maize: 2320 },
  },
  {
    name: 'Bathinda APMC',
    district: 'Bathinda',
    state: 'Punjab',
    coords: [30.2110, 74.9455],
    color: '#10B981',
    highway: 'NH7 Malwa Corridor',
    tollPlaza: 'Bathinda Toll Plaza',
    basePrices: { Onion: 2180, Tomato: 2400, Wheat: 2780, Cotton: 7420, Garlic: 8750, Potato: 1650, Soybean: 4600, Mustard: 5520, Maize: 2280 },
  },

  // ── Haryana ──
  {
    name: 'Karnal Mandi',
    district: 'Karnal',
    state: 'Haryana',
    coords: [29.6857, 76.9905],
    color: '#8B5CF6',
    highway: 'NH44 GT Corridor',
    tollPlaza: 'Bastara Toll Plaza',
    basePrices: { Onion: 2300, Tomato: 2520, Wheat: 2810, Cotton: 7280, Garlic: 8900, Potato: 1720, Soybean: 4680, Mustard: 5540, Maize: 2340 },
  },
  {
    name: 'Sirsa Mandi',
    district: 'Sirsa',
    state: 'Haryana',
    coords: [29.5349, 75.0289],
    color: '#0F6B47',
    highway: 'NH9 Hisar Expressway',
    tollPlaza: 'Bhadra Toll Plaza',
    basePrices: { Onion: 2220, Tomato: 2420, Wheat: 2760, Cotton: 7480, Garlic: 8800, Potato: 1680, Soybean: 4650, Mustard: 5580, Maize: 2300 },
  },

  // ── Rajasthan ──
  {
    name: 'Kota Mandi',
    district: 'Kota',
    state: 'Rajasthan',
    coords: [25.1388, 75.8714],
    color: '#EA580C',
    highway: 'NH52 Chambal Expressway',
    tollPlaza: 'Dhaneshwar Toll Plaza',
    basePrices: { Onion: 2150, Tomato: 2380, Wheat: 2720, Cotton: 7200, Garlic: 9350, Potato: 1680, Soybean: 4880, Mustard: 5650, Maize: 2310 },
  },
  {
    name: 'Jaipur Mandi',
    district: 'Jaipur',
    state: 'Rajasthan',
    coords: [26.8048, 75.7612],
    color: '#EAB308',
    highway: 'NH48 Ring Corridor',
    tollPlaza: 'Manoharpur Toll Plaza',
    basePrices: { Onion: 2350, Tomato: 2550, Wheat: 2740, Cotton: 7150, Garlic: 9200, Potato: 1780, Soybean: 4790, Mustard: 5680, Maize: 2290 },
  },

  // ── Madhya Pradesh ──
  {
    name: 'Indore Mandi',
    district: 'Indore',
    state: 'Madhya Pradesh',
    coords: [22.7196, 75.8577],
    color: '#10B981',
    highway: 'NH52 Malwa Expressway',
    tollPlaza: 'Dhamnod Toll Plaza',
    basePrices: { Onion: 2280, Tomato: 2500, Wheat: 2850, Cotton: 7250, Garlic: 9150, Potato: 1800, Soybean: 4950, Mustard: 5380, Maize: 2300 },
  },
  {
    name: 'Mandsaur Mandi',
    district: 'Mandsaur',
    state: 'Madhya Pradesh',
    coords: [24.0722, 75.0689],
    color: '#D97706',
    highway: 'SH31 Malwa Highway',
    tollPlaza: 'Mandsaur Bypass Toll',
    basePrices: { Onion: 2180, Tomato: 2400, Wheat: 2780, Cotton: 7150, Garlic: 9550, Potato: 1720, Soybean: 4900, Mustard: 5420, Maize: 2260 },
  },
  {
    name: 'Ujjain Mandi',
    district: 'Ujjain',
    state: 'Madhya Pradesh',
    coords: [23.1828, 75.7772],
    color: '#8B5CF6',
    highway: 'SH27 Ujjain-Indore 4-Lane',
    tollPlaza: 'Nanakheda Toll Gate',
    basePrices: { Onion: 2220, Tomato: 2440, Wheat: 2820, Cotton: 7200, Garlic: 9100, Potato: 1760, Soybean: 4920, Mustard: 5350, Maize: 2280 },
  },

  // ── Maharashtra ──
  {
    name: 'Lasalgaon APMC',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [20.1472, 74.2268],
    color: '#EA580C',
    highway: 'NH848 Agri Expressway',
    tollPlaza: 'Pimpalgaon Toll Gate',
    basePrices: { Onion: 2250, Tomato: 2300, Wheat: 2500, Cotton: 6850, Garlic: 8600, Potato: 1650, Soybean: 4780, Mustard: 5200, Maize: 2220 },
  },
  {
    name: 'Pimpalgaon APMC',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [20.1706, 73.9856],
    color: '#EF4444',
    highway: 'NH60 Nashik-Dhule Corridor',
    tollPlaza: 'Chandwad Toll Plaza',
    basePrices: { Onion: 2280, Tomato: 2450, Wheat: 2520, Cotton: 6900, Garlic: 8650, Potato: 1680, Soybean: 4800, Mustard: 5220, Maize: 2240 },
  },
  {
    name: 'Pune Market Yard',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [18.4967, 73.8643],
    color: '#0284C7',
    highway: 'NH60 Pune Expressway',
    tollPlaza: 'Khed Shivapur Toll Plaza',
    basePrices: { Onion: 2350, Tomato: 2650, Wheat: 2720, Cotton: 7100, Garlic: 9000, Potato: 1800, Soybean: 4850, Mustard: 5300, Maize: 2300 },
  },
  {
    name: 'Mumbai APMC Vashi',
    district: 'Thane',
    state: 'Maharashtra',
    coords: [19.0771, 73.0036],
    color: '#0F6B47',
    highway: 'Sion-Panvel Expressway',
    tollPlaza: 'Vashi Toll Naka',
    basePrices: { Onion: 2550, Tomato: 2750, Wheat: 2850, Cotton: 7200, Garlic: 9450, Potato: 1950, Soybean: 4920, Mustard: 5450, Maize: 2380 },
  },
  {
    name: 'Nagpur APMC',
    district: 'Nagpur',
    state: 'Maharashtra',
    coords: [21.1712, 79.1322],
    color: '#F97316',
    highway: 'NH53 Wardha Highway',
    tollPlaza: 'Borkhedi Toll Plaza',
    basePrices: { Onion: 2280, Tomato: 2480, Wheat: 2680, Cotton: 7350, Garlic: 8950, Potato: 1750, Soybean: 4980, Mustard: 5280, Maize: 2270 },
  },

  // ── Uttar Pradesh ──
  {
    name: 'Kanpur Mandi',
    district: 'Kanpur',
    state: 'Uttar Pradesh',
    coords: [26.4499, 80.3319],
    color: '#D97706',
    highway: 'NH19 Kanpur Bypass',
    tollPlaza: 'Barajod Toll Plaza',
    basePrices: { Onion: 2320, Tomato: 2480, Wheat: 2720, Cotton: 7050, Garlic: 8900, Potato: 1750, Soybean: 4700, Mustard: 5480, Maize: 2290 },
  },
  {
    name: 'Agra Mandi',
    district: 'Agra',
    state: 'Uttar Pradesh',
    coords: [27.1767, 78.0081],
    color: '#0EA5E9',
    highway: 'Yamuna Expressway',
    tollPlaza: 'Jewar / Khandauli Toll',
    basePrices: { Onion: 2300, Tomato: 2520, Wheat: 2700, Cotton: 7000, Garlic: 8850, Potato: 1880, Soybean: 4680, Mustard: 5560, Maize: 2280 },
  },

  // ── Karnataka ──
  {
    name: 'Bengaluru APMC',
    district: 'Bengaluru',
    state: 'Karnataka',
    coords: [13.0189, 77.5456],
    color: '#10B981',
    highway: 'NH48 Tumkur Road',
    tollPlaza: 'Nelamangala Toll Plaza',
    basePrices: { Onion: 2480, Tomato: 2680, Wheat: 2780, Cotton: 7200, Garlic: 9300, Potato: 1920, Soybean: 4750, Mustard: 5350, Maize: 2360 },
  },
  {
    name: 'Kolar APMC',
    district: 'Kolar',
    state: 'Karnataka',
    coords: [13.1378, 78.1340],
    color: '#EF4444',
    highway: 'NH75 Bangalore-Tirupati Highway',
    tollPlaza: 'Hosakote Toll Plaza',
    basePrices: { Onion: 2380, Tomato: 2750, Wheat: 2720, Cotton: 7150, Garlic: 9150, Potato: 1850, Soybean: 4700, Mustard: 5300, Maize: 2320 },
  },

  // ── Delhi National Capital ──
  {
    name: 'Azadpur Mandi',
    district: 'North Delhi',
    state: 'Delhi',
    coords: [28.7159, 77.1783],
    color: '#0F6B47',
    highway: 'Outer Ring Road / NH44',
    tollPlaza: 'Kundli Border Toll',
    basePrices: { Onion: 2650, Tomato: 2720, Wheat: 2850, Cotton: 7300, Garlic: 9600, Potato: 1980, Soybean: 4850, Mustard: 5620, Maize: 2400 },
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
  // Normalize crop robustly
  const rawCrop = draft.crop ? String(draft.crop).trim() : 'Wheat'
  const matchedCropObj = allCrops.find((c) => c.name.toLowerCase() === rawCrop.toLowerCase())
  const crop: Crop = matchedCropObj ? matchedCropObj.name : 'Wheat'

  const qty = draft.quantity && draft.quantity > 0 ? draft.quantity : 20
  const vehicle = draft.vehicleType || 'pickup'

  // Resolve origin coords from GPS or text matching across all Indian agricultural states
  let origin: [number, number] = [22.3039, 70.8022] // Default to Rajkot
  const loc = (draft.location || '').toLowerCase()

  if (draft.originCoords && Array.isArray(draft.originCoords) && draft.originCoords.length === 2 && draft.originCoords[0] && draft.originCoords[1]) {
    origin = [Number(draft.originCoords[0]), Number(draft.originCoords[1])]
  } else if (loc.includes('ludhiana') || loc.includes('khanna') || loc.includes('punjab') || loc.includes('bathinda') || loc.includes('amritsar') || loc.includes('jalandhar')) {
    origin = [30.7067, 76.2205] // Punjab (Khanna / Ludhiana)
  } else if (loc.includes('karnal') || loc.includes('haryana') || loc.includes('sirsa') || loc.includes('hisar') || loc.includes('ambala') || loc.includes('panipat')) {
    origin = [29.6857, 76.9905] // Haryana (Karnal)
  } else if (loc.includes('delhi') || loc.includes('azadpur')) {
    origin = [28.7159, 77.1783] // Delhi
  } else if (loc.includes('kanpur') || loc.includes('agra') || loc.includes('uttar pradesh') || loc.includes('up') || loc.includes('meerut') || loc.includes('aligarh') || loc.includes('lucknow')) {
    origin = [26.4499, 80.3319] // UP (Kanpur)
  } else if (loc.includes('kota') || loc.includes('jaipur') || loc.includes('rajasthan') || loc.includes('bikaner') || loc.includes('alwar') || loc.includes('jodhpur')) {
    origin = [26.8048, 75.7612] // Rajasthan (Jaipur)
  } else if (loc.includes('indore') || loc.includes('ujjain') || loc.includes('mandsaur') || loc.includes('madhya pradesh') || loc.includes('bhopal') || loc.includes('neemuch') || loc.includes('mp')) {
    origin = [22.7196, 75.8577] // MP (Indore)
  } else if (loc.includes('nashik') || loc.includes('lasalgaon') || loc.includes('pimpalgaon')) {
    origin = [19.9975, 73.7898] // Maharashtra (Nashik)
  } else if (loc.includes('pune')) {
    origin = [18.5204, 73.8567] // Maharashtra (Pune)
  } else if (loc.includes('mumbai') || loc.includes('vashi') || loc.includes('thane')) {
    origin = [19.0771, 73.0036] // Mumbai Vashi
  } else if (loc.includes('nagpur')) {
    origin = [21.1712, 79.1322] // Nagpur
  } else if (loc.includes('bengaluru') || loc.includes('bangalore') || loc.includes('karnataka') || loc.includes('kolar') || loc.includes('hubli')) {
    origin = [13.0189, 77.5456] // Karnataka (Bengaluru)
  } else if (loc.includes('hyderabad') || loc.includes('telangana') || loc.includes('warangal') || loc.includes('andhra') || loc.includes('guntur')) {
    origin = [17.4727, 78.4844] // Hyderabad / Telangana
  } else if (loc.includes('bihar') || loc.includes('patna') || loc.includes('purnia') || loc.includes('gulabbagh')) {
    origin = [25.7771, 87.5147] // Bihar
  } else if (loc.includes('gondal')) {
    origin = [21.9620, 70.7960] // Gondal
  } else if (loc.includes('ahmedabad')) {
    origin = [23.0225, 72.5714] // Ahmedabad
  } else if (loc.includes('surat')) {
    origin = [21.1702, 72.8311] // Surat
  } else if (loc.includes('morbi')) {
    origin = [22.8120, 70.8378] // Morbi
  } else if (loc.includes('jamnagar')) {
    origin = [22.4707, 70.0577] // Jamnagar
  } else if (loc.includes('rajkot')) {
    origin = [22.3039, 70.8022] // Rajkot
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
    const baseDefaultPrice = cropPriceObj ? cropPriceObj.price : 2640
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

  // Filter within reasonable radius (up to specified radius, min 4 candidate mandis)
  const maxRadius = Math.max(draft.radius || 250, 150)
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
    originLocation: draft.location || 'Farm Gate',
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

  // Persist to SQLite Database via API
  try {
    await fetch('/api/sabha', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, draft }),
    })
  } catch (err) {
    console.warn('[SABHA] Database persistence deferred:', err)
  }

  return session
}

export async function saveSabhaResult(id: string, draft: any, recommendation: any) {
  try {
    await fetch('/api/sabha', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, draft, recommendation, status: 'completed' }),
    })
  } catch (err) {
    console.warn('[SABHA] Failed to save result to DB:', err)
  }
}

export async function fetchUserSabhas(): Promise<any[]> {
  try {
    const res = await fetch('/api/sabha', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.sabhas)) {
        return data.sabhas
      }
    }
  } catch (err) {
    console.warn('[SABHA] Failed to fetch sabhas from DB:', err)
  }
  return []
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
  let dbStats: any = null
  try {
    const res = await fetch('/api/dashboard', { cache: 'no-store' })
    if (res.ok) {
      dbStats = await res.json()
    }
  } catch {}

  const defaultPulse = [
    { crop: 'Onion', price: 2140, change: 4.2, mandi: 'Surat', high: 2280, low: 1980, trend: [2010, 2040, 2080, 2110, 2140] },
    { crop: 'Wheat', price: 2640, change: 1.8, mandi: 'Pune', high: 2720, low: 2580, trend: [2590, 2600, 2610, 2630, 2640] },
    { crop: 'Tomato', price: 2480, change: -1.5, mandi: 'Ahmedabad', high: 2600, low: 2350, trend: [2550, 2520, 2500, 2490, 2480] },
    { crop: 'Soybean', price: 4750, change: 3.8, mandi: 'Indore', high: 4890, low: 4620, trend: [4580, 4620, 4680, 4710, 4750] },
    { crop: 'Cotton', price: 7200, change: 2.1, mandi: 'Rajkot', high: 7350, low: 7050, trend: [7050, 7100, 7120, 7180, 7200] },
    { crop: 'Garlic', price: 8900, change: 5.4, mandi: 'Mandsaur', high: 9200, low: 8400, trend: [8400, 8550, 8700, 8820, 8900] },
  ]

  const defaultMonthly = [
    { month: 'Oct', earned: 1200, sabhas: 1 },
    { month: 'Nov', earned: 1800, sabhas: 1 },
    { month: 'Dec', earned: 2100, sabhas: 2 },
    { month: 'Jan', earned: 2400, sabhas: 2 },
    { month: 'Feb', earned: 2700, sabhas: 2 },
    { month: 'Mar', earned: 2900, sabhas: 2 },
    { month: 'Apr', earned: 3200, sabhas: 2 },
    { month: 'May', earned: 5400, sabhas: 3 },
    { month: 'Jun', earned: 7800, sabhas: 4 },
    { month: 'Jul', earned: 10500, sabhas: 5 },
    { month: 'Aug', earned: 13200, sabhas: 6 },
    { month: 'Sep', earned: 15800, sabhas: 8 },
  ]

  if (dbStats && dbStats.sessions && dbStats.sessions.length > 0) {
    const totalG = dbStats.totalGain || 6150
    return {
      sessions: dbStats.sessions,
      earnings: [
        Math.round(totalG * 0.15),
        Math.round(totalG * 0.32),
        Math.round(totalG * 0.52),
        Math.round(totalG * 0.74),
        Math.round(totalG * 0.88),
        totalG,
      ],
      monthlyData: defaultMonthly,
      winners: dbStats.winners?.length > 0 ? dbStats.winners : [
        { name: 'Gondal APMC', value: 1, percent: 100, avgGain: `₹${totalG.toLocaleString('en-IN')}`, crop: 'Wheat / Onion' },
      ],
      pulse: defaultPulse,
    }
  }

  return {
    sessions: [
      { id: 'sb-001', date: 'Today, 09:30 AM', crop: 'Wheat', quantity: 20, mandi: 'Gondal APMC', gain: 2012, status: 'Ready to Dispatch', distance: '48 km', pricePerQ: 2750 },
      { id: 'sb-002', date: '18 Sep 2026', crop: 'Wheat', quantity: 35, mandi: 'Rajkot Market Yard', gain: 1400, status: 'Completed', distance: '15 km', pricePerQ: 2640 },
      { id: 'sb-003', date: '09 Sep 2026', crop: 'Tomato', quantity: 15, mandi: 'Morbi APMC', gain: 4120, status: 'Completed', distance: '71 km', pricePerQ: 2480 },
    ],
    earnings: [1800, 3900, 7400, 11200, 14100, 15800],
    monthlyData: defaultMonthly,
    winners: [
      { name: 'Gondal APMC', value: 6, percent: 50, avgGain: '₹2,012', crop: 'Wheat' },
      { name: 'Rajkot Yard', value: 3, percent: 25, avgGain: '₹1,400', crop: 'Wheat' },
      { name: 'Morbi APMC', value: 2, percent: 17, avgGain: '₹4,120', crop: 'Soybean / Onion' },
    ],
    pulse: defaultPulse,
  }
}


export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}
