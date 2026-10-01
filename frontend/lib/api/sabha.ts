'use client'

export type Crop = 'Onion' | 'Tomato' | 'Wheat' | 'Potato' | 'Soybean' | 'Cotton' | 'Garlic' | 'Mustard' | 'Maize'
export type SabhaDraft = {
  crop: Crop
  quantity: number
  location: string
  urgency: 'today' | 'soon' | 'week'
  targetDate?: string
  radius: number
  vehicleType?: 'pickup' | 'truck' | 'heavy'
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

export async function createSabha(draft: SabhaDraft) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { id: `sabha-${Date.now()}`, ...draft }
}

export async function getDashboardData() {
  await new Promise((resolve) => setTimeout(resolve, 150))
  return {
    sessions: [
      { id: 'sb-001', date: 'Today, 09:30 AM', crop: 'Onion', quantity: 20, mandi: 'Surat Mandi', gain: 8200, status: 'Ready to Dispatch', distance: '142 km', pricePerQ: 2140 },
      { id: 'sb-002', date: '18 Sep 2026', crop: 'Wheat', quantity: 35, mandi: 'Pune Market Yard', gain: 5600, status: 'Completed', distance: '188 km', pricePerQ: 2640 },
      { id: 'sb-003', date: '09 Sep 2026', crop: 'Tomato', quantity: 15, mandi: 'Ahmedabad APMC', gain: 4120, status: 'Completed', distance: '260 km', pricePerQ: 2480 },
      { id: 'sb-004', date: '28 Aug 2026', crop: 'Soybean', quantity: 25, mandi: 'Indore APMC', gain: 6750, status: 'Completed', distance: '310 km', pricePerQ: 4750 },
    ],
    earnings: [1800, 3900, 7400, 11200, 14100, 15800],
    monthlyData: [
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
    ],
    winners: [
      { name: 'Surat APMC', value: 6, percent: 50, avgGain: '₹8,200', crop: 'Onion / Tomato' },
      { name: 'Pune Yard', value: 3, percent: 25, avgGain: '₹5,600', crop: 'Wheat' },
      { name: 'Ahmedabad APMC', value: 2, percent: 17, avgGain: '₹4,120', crop: 'Soybean / Onion' },
      { name: 'Lasalgaon', value: 1, percent: 8, avgGain: '₹1,900', crop: 'Onion' },
    ],
    pulse: [
      { crop: 'Onion', price: 2140, change: 4.2, mandi: 'Surat', high: 2280, low: 1980, trend: [2010, 2040, 2080, 2110, 2140] },
      { crop: 'Wheat', price: 2640, change: 1.8, mandi: 'Pune', high: 2720, low: 2580, trend: [2590, 2600, 2610, 2630, 2640] },
      { crop: 'Tomato', price: 2480, change: -1.5, mandi: 'Ahmedabad', high: 2600, low: 2350, trend: [2550, 2520, 2500, 2490, 2480] },
      { crop: 'Soybean', price: 4750, change: 3.8, mandi: 'Indore', high: 4890, low: 4620, trend: [4580, 4620, 4680, 4710, 4750] },
      { crop: 'Cotton', price: 7200, change: 2.1, mandi: 'Rajkot', high: 7350, low: 7050, trend: [7050, 7100, 7120, 7180, 7200] },
      { crop: 'Garlic', price: 8900, change: 5.4, mandi: 'Mandsaur', high: 9200, low: 8400, trend: [8400, 8550, 8700, 8820, 8900] },
    ],
  }
}

export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}
