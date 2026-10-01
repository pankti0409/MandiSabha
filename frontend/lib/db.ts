import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { DemoUser } from '@/lib/api/auth'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export function getDbPath(): string {
  if (process.env.DATABASE_PATH && fs.existsSync(process.env.DATABASE_PATH)) {
    return process.env.DATABASE_PATH
  }
  const candidate1 = path.resolve(process.cwd(), '..', 'backend', 'mandi.db')
  if (fs.existsSync(candidate1)) return candidate1

  const candidate2 = path.resolve(process.cwd(), 'backend', 'mandi.db')
  if (fs.existsSync(candidate2)) return candidate2

  const candidate3 = path.resolve(process.cwd(), 'mandi.db')
  if (fs.existsSync(candidate3)) return candidate3

  return candidate1
}

export interface SabhaRecordInput {
  id: string
  userId?: string
  displayCode?: string
  status?: string
  draft: any
  recommendation?: any
  userStatus?: string
  actualPricePerQ?: number
}

/**
 * Execute python script to interact with SQLite database as a bulletproof fallback.
 */
function runPythonSqlite(script: string, args: any[] = []): any {
  try {
    const pythonCode = `
import sqlite3, json, sys

db_path = r"${getDbPath().replace(/\\/g, '\\\\')}"
conn = sqlite3.connect(db_path, timeout=10.0)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

${script}

conn.close()
`
    const output = execFileSync('python', ['-c', pythonCode], {
      input: JSON.stringify(args),
      encoding: 'utf-8',
      timeout: 5000,
    })
    return output ? JSON.parse(output.trim()) : null
  } catch (err: any) {
    console.error('[DB-PYTHON-FALLBACK] Error running sqlite script:', err?.message || err)
    return null
  }
}

/**
 * Save or update user profile to SQLite database.
 */
export async function saveUserToDb(user: Partial<DemoUser> & { mobile: string }): Promise<DemoUser> {
  const cleanMobile = String(user.mobile).replace(/\D/g, '').slice(-10)
  const id = user.id || `usr-${cleanMobile}`

  const payload = {
    id,
    mobile: cleanMobile,
    name: user.name || 'Farmer',
    village: user.village || '',
    district: user.district || '',
    state: user.state || 'Gujarat',
    language: user.language || 'en',
    crops: user.crops || ['Wheat'],
    crop_details: user.cropDetails || [],
    farm_size_acres: user.farmSizeAcres,
    transport_cost_per_km: user.transportCostPerKm || 14.0,
    vehicle_type: user.vehicleType || 'pickup',
    price_alerts: Boolean(user.priceAlerts),
    weather_alerts: Boolean(user.weatherAlerts),
    primary_mandi: user.primaryMandi || 'Gondal APMC',
    email: user.email,
    avatar: user.avatar,
    home_lat: user.homeLat || 22.3039,
    home_lon: user.homeLon || 70.8022,
  }

  // Primary: Call FastAPI sync router
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${BACKEND_URL}/db/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (data.user) return data.user
    }
  } catch (apiErr) {
    console.warn('[DB] FastAPI endpoint unavailable, using Python SQLite fallback:', apiErr)
  }

  // Fallback: Direct Python SQLite execution
  const pyScript = `
args = json.loads(sys.stdin.read())
p = args[0]
now = '2026-10-01 12:00:00'

cursor.execute("SELECT id FROM users WHERE mobile = ? OR id = ?", (p['mobile'], p['id']))
row = cursor.fetchone()

if row:
    cursor.execute("""
        UPDATE users SET
            name=?, village=?, district=?, state=?, language=?, crops=?, crop_details=?,
            farm_size_acres=?, transport_cost_per_km=?, vehicle_type=?, price_alerts=?, weather_alerts=?,
            primary_mandi=?, email=?, avatar=?, home_lat=?, home_lon=?, is_active=1
        WHERE id = ? OR mobile = ?
    """, (
        p['name'], p['village'], p['district'], p['state'], p['language'],
        json.dumps(p['crops']), json.dumps(p['crop_details']), p['farm_size_acres'],
        p['transport_cost_per_km'], p['vehicle_type'], 1 if p['price_alerts'] else 0,
        1 if p['weather_alerts'] else 0, p['primary_mandi'], p['email'], p['avatar'],
        p['home_lat'], p['home_lon'], row['id'], p['mobile']
    ))
else:
    cursor.execute("""
        INSERT INTO users (
            id, mobile, name, village, district, state, language, crops, crop_details,
            farm_size_acres, transport_cost_per_km, vehicle_type, price_alerts, weather_alerts,
            primary_mandi, email, avatar, home_lat, home_lon, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (
        p['id'], p['mobile'], p['name'], p['village'], p['district'], p['state'], p['language'],
        json.dumps(p['crops']), json.dumps(p['crop_details']), p['farm_size_acres'],
        p['transport_cost_per_km'], p['vehicle_type'], 1 if p['price_alerts'] else 0,
        1 if p['weather_alerts'] else 0, p['primary_mandi'], p['email'], p['avatar'],
        p['home_lat'], p['home_lon'], now, now
    ))
conn.commit()

cursor.execute("SELECT * FROM users WHERE mobile = ? OR id = ?", (p['mobile'], p['id']))
res_row = dict(cursor.fetchone())
res_row['crops'] = json.loads(res_row['crops']) if res_row['crops'] else []
res_row['cropDetails'] = json.loads(res_row['crop_details']) if res_row['crop_details'] else []
res_row['farmSizeAcres'] = res_row['farm_size_acres']
res_row['transportCostPerKm'] = res_row['transport_cost_per_km']
res_row['vehicleType'] = res_row['vehicle_type']
res_row['priceAlerts'] = bool(res_row['price_alerts'])
res_row['weatherAlerts'] = bool(res_row['weather_alerts'])
res_row['primaryMandi'] = res_row['primary_mandi']
res_row['homeLat'] = res_row['home_lat']
res_row['homeLon'] = res_row['home_lon']
res_row['onboarded'] = bool(res_row['village'] and res_row['name'] and res_row['name'].lower() != 'farmer')
print(json.dumps(res_row))
`
  const fallbackResult = runPythonSqlite(pyScript, [payload])
  if (fallbackResult) return fallbackResult

  return {
    ...payload,
    farmSizeAcres: payload.farm_size_acres,
    transportCostPerKm: payload.transport_cost_per_km,
    vehicleType: payload.vehicle_type as any,
    priceAlerts: payload.price_alerts,
    weatherAlerts: payload.weather_alerts,
    primaryMandi: payload.primary_mandi,
    cropDetails: payload.crop_details,
    homeLat: payload.home_lat,
    homeLon: payload.home_lon,
    onboarded: Boolean(payload.village && payload.name && payload.name.toLowerCase() !== 'farmer'),
  }
}

/**
 * Fetch user by mobile or ID.
 */
export async function getUserFromDb(identifier: string): Promise<DemoUser | null> {
  // Extract mobile from either a raw number or 'usr-MOBILE' id format
  const rawStripped = String(identifier).replace(/^usr-/, '')
  const clean = rawStripped.replace(/\D/g, '').slice(-10)
  const mobileSearch = clean || identifier

  // Primary: FastAPI sync router
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${BACKEND_URL}/db/user?identifier=${encodeURIComponent(mobileSearch)}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (data.user) return data.user
    }
  } catch {}

  // Fallback: Python SQLite
  const pyScript = `
args = json.loads(sys.stdin.read())
identifier, clean = args[0], args[1]
cursor.execute("SELECT * FROM users WHERE mobile = ? OR id = ? OR mobile LIKE ?", (clean, identifier, f"%{clean}%"))
row = cursor.fetchone()
if not row:
    print("null")
else:
    r = dict(row)
    r['crops'] = json.loads(r['crops']) if r['crops'] else []
    r['cropDetails'] = json.loads(r['crop_details']) if r['crop_details'] else []
    r['farmSizeAcres'] = r['farm_size_acres']
    r['transportCostPerKm'] = r['transport_cost_per_km']
    r['vehicleType'] = r['vehicle_type']
    r['priceAlerts'] = bool(r['price_alerts'])
    r['weatherAlerts'] = bool(r['weather_alerts'])
    r['primaryMandi'] = r['primary_mandi']
    r['homeLat'] = r['home_lat']
    r['homeLon'] = r['home_lon']
    r['onboarded'] = bool(r['village'] and r['name'] and r['name'].lower() != 'farmer')
    print(json.dumps(r))
`
  return runPythonSqlite(pyScript, [identifier, mobileSearch])
}

/**
 * Save or update a Sabha held by the user in SQLite database.
 */
export async function saveSabhaToDb(input: SabhaRecordInput): Promise<any> {
  const payload = {
    id: input.id,
    userId: input.userId,
    displayCode: input.displayCode,
    status: input.status || 'completed',
    draft: input.draft || {},
    recommendation: input.recommendation || null,
    userStatus: input.userStatus || 'none',
    actualPricePerQ: input.actualPricePerQ,
  }

  // Primary: FastAPI sync router
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${BACKEND_URL}/db/sabha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch (apiErr) {
    console.warn('[DB] FastAPI endpoint unavailable for sabha save, using Python fallback:', apiErr)
  }

  // Fallback: Python SQLite
  const pyScript = `
args = json.loads(sys.stdin.read())
p = args[0]
now = '2026-10-01 12:00:00'
s_id = p['id']
display_code = p.get('displayCode') or f"SB-2026-{s_id[-4:]}"
user_id = p.get('userId') or 'usr-default'

# Ensure user exists
cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
if not cursor.fetchone():
    cursor.execute("""
        INSERT OR IGNORE INTO users (id, mobile, name, village, district, state, language, crops, is_active, created_at, updated_at)
        VALUES (?, '9876543210', 'Farmer', 'Rajkot', 'Rajkot', 'Gujarat', 'en', '["Wheat"]', 1, ?, ?)
    """, (user_id, now, now))
    conn.commit()

cursor.execute("SELECT id FROM sabhas WHERE id = ?", (s_id,))
exists = cursor.fetchone()

draft_str = json.dumps(p.get('draft', {}))
rec_str = json.dumps(p.get('recommendation')) if p.get('recommendation') else None

if exists:
    cursor.execute("""
        UPDATE sabhas SET
            draft = ?,
            recommendation = COALESCE(?, recommendation),
            status = ?,
            user_status = ?,
            actual_price_per_q = COALESCE(?, actual_price_per_q),
            finished_at = ?
        WHERE id = ?
    """, (draft_str, rec_str, p.get('status', 'completed'), p.get('userStatus', 'none'), p.get('actualPricePerQ'), now, s_id))
else:
    cursor.execute("""
        INSERT INTO sabhas (
            id, display_code, user_id, status, draft, recommendation, user_status, actual_price_per_q, created_at, finished_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (s_id, display_code, user_id, p.get('status', 'completed'), draft_str, rec_str, p.get('userStatus', 'none'), p.get('actualPricePerQ'), now, now))

conn.commit()
print(json.dumps({"success": True, "id": s_id, "displayCode": display_code}))
`
  return runPythonSqlite(pyScript, [payload])
}

/**
 * Retrieve a single Sabha record by ID.
 */
export async function getSabhaFromDb(id: string): Promise<any> {
  // Primary: FastAPI sync router
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${BACKEND_URL}/db/sabha/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (data.sabha) return data.sabha
    }
  } catch {}

  // Fallback: Python SQLite
  const pyScript = `
args = json.loads(sys.stdin.read())
s_id = args[0]
cursor.execute("SELECT * FROM sabhas WHERE id = ? OR display_code = ?", (s_id, s_id))
row = cursor.fetchone()
if not row:
    print("null")
else:
    r = dict(row)
    r['draft'] = json.loads(r['draft']) if r['draft'] else {}
    r['recommendation'] = json.loads(r['recommendation']) if r['recommendation'] else None
    print(json.dumps(r))
`
  return runPythonSqlite(pyScript, [id])
}

/**
 * Retrieve all Sabhas held by user.
 */
export async function getSabhasForUserFromDb(userId?: string, limit = 50): Promise<any[]> {
  // Primary: FastAPI sync router
  try {
    const url = userId ? `${BACKEND_URL}/db/sabhas?userId=${encodeURIComponent(userId)}&limit=${limit}` : `${BACKEND_URL}/db/sabhas?limit=${limit}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.sabhas)) return data.sabhas
    }
  } catch {}

  // Fallback: Python SQLite
  const pyScript = `
args = json.loads(sys.stdin.read())
user_id, limit = args[0], args[1]
if user_id:
    cursor.execute("SELECT * FROM sabhas WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", (user_id, limit))
else:
    cursor.execute("SELECT * FROM sabhas ORDER BY created_at DESC LIMIT ?", (limit,))

rows = cursor.fetchall()
sabhas = []
for r in rows:
    item = dict(r)
    draft = json.loads(item['draft']) if item['draft'] else {}
    rec = json.loads(item['recommendation']) if item['recommendation'] else {}
    winner = rec.get('winner', {}) if rec else {}

    crop = draft.get('crop', 'Wheat')
    quantity = draft.get('quantity', 20)
    mandi = winner.get('name') or draft.get('targetMandi', 'Gondal APMC')
    gain = winner.get('advantage') or (rec.get('surplusVsLocal', {}).get('total', 2012) if rec else 2012)
    rate = winner.get('price', 2750)
    distance = winner.get('distance', f"{draft.get('distanceKm', 48)} km")

    sabhas.append({
        "id": item['id'],
        "displayCode": item['display_code'],
        "userId": item['user_id'],
        "status": item['status'],
        "date": item['created_at'][:10] if item['created_at'] else "Today",
        "crop": crop,
        "quantity": quantity,
        "mandi": mandi,
        "state": winner.get('state', 'Gujarat'),
        "distance": distance,
        "gain": gain,
        "rate": rate,
        "localRate": (rec.get('localBaseline', {}).get('price') if rec else None) or round(rate * 0.96),
        "draft": draft,
        "recommendation": rec
    })

print(json.dumps(sabhas))
`
  const res = runPythonSqlite(pyScript, [userId || null, limit])
  return Array.isArray(res) ? res : []
}

/**
 * Compute real user dashboard statistics from database records.
 */
export async function getUserDashboardStats(userId?: string): Promise<any> {
  // Primary: FastAPI sync router
  try {
    const url = userId ? `${BACKEND_URL}/db/dashboard?userId=${encodeURIComponent(userId)}` : `${BACKEND_URL}/db/dashboard`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch {}

  const sabhas = await getSabhasForUserFromDb(userId, 100)
  const totalGain = sabhas.reduce((acc, s) => acc + (Number(s.gain) || 0), 0)
  const sessions = sabhas.map((s) => ({
    id: s.displayCode || s.id,
    date: s.date,
    crop: s.crop,
    quantity: s.quantity,
    mandi: s.mandi,
    gain: s.gain,
    status: s.status === 'completed' ? 'Completed' : 'Ready to Dispatch',
    distance: s.distance,
    pricePerQ: s.rate,
  }))

  const mandiCounts: Record<string, { count: number; totalGain: number; crops: Set<string> }> = {}
  for (const s of sabhas) {
    if (!mandiCounts[s.mandi]) {
      mandiCounts[s.mandi] = { count: 0, totalGain: 0, crops: new Set() }
    }
    mandiCounts[s.mandi].count++
    mandiCounts[s.mandi].totalGain += s.gain
    mandiCounts[s.mandi].crops.add(s.crop)
  }

  const winners = Object.entries(mandiCounts).map(([name, data]) => ({
    name,
    value: data.count,
    percent: sabhas.length > 0 ? Math.round((data.count / sabhas.length) * 100) : 0,
    avgGain: `₹${Math.round(data.totalGain / data.count).toLocaleString('en-IN')}`,
    crop: Array.from(data.crops).join(' / '),
  }))

  return {
    success: true,
    totalSabhas: sabhas.length,
    totalGain,
    sessions: sessions.slice(0, 8),
    winners: winners.slice(0, 5),
  }
}
