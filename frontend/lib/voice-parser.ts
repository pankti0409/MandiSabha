// Multi-script numerals and phonetics dictionary for Indian Agricultural STT

const GUJARATI_NUMERALS: Record<string, string> = {
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
  '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
}

const DEVANAGARI_NUMERALS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
}

const WORD_NUMBERS: Record<string, number> = {
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, twentyfive: 25, 'twenty-five': 25, thirty: 30,
  thirtyfive: 35, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  // Gujarati
  એક: 1, બે: 2, ત્રણ: 3, ચાર: 4, પાંચ: 5, છ: 6, સાત: 7, આઠ: 8, નવ: 9, દસ: 10,
  અગિયાર: 11, બાર: 12, પંદર: 15, વીસ: 20, પચીસ: 25, ત્રીસ: 30, પાંત્રીસ: 35, ચાલીસ: 40,
  પચાસ: 50, સાઈઠ: 60, સિત્તેર: 70, એંસી: 80, નેવું: 90, સો: 100,
  vis: 20, vees: 20, pachis: 25, pachhees: 25, tris: 30, tees: 30, pantris: 35, chalis: 40, chalees: 40,
  pachas: 50, pachaas: 50, so: 100, sau: 100,
  // Hindi / Marathi
  एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
  ग्यारह: 11, बारह: 12, पंद्रह: 15, बीस: 20, पच्चीस: 25, तीस: 30, पैंतीस: 35, चालीस: 40, पचास: 50, सौ: 100,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  bees: 20,
}

export type ParsedHarvest = {
  crop: 'Onion' | 'Tomato' | 'Wheat' | 'Potato' | 'Soybean' | 'Cotton' | 'Garlic' | 'Mustard' | 'Maize'
  quantity: number
  location: string
  urgency: 'today' | 'soon' | 'week'
  confidence: number
  targetMandi?: string   // explicit destination mandi if user said "deliver to X"
}

// Known mandis/markets that user may explicitly specify as destination
// Keywords include common STT phonetic errors and split-word variants
const KNOWN_DESTINATION_MANDIS: { keywords: string[]; name: string }[] = [
  { keywords: ['gondal', 'gon dal', 'ગોંડલ', 'गोंडल', 'goundal', 'gondaal'], name: 'Gondal APMC' },
  { keywords: ['rajkot', 'raj kot', 'રાજકોટ', 'राजकोट', 'rajkot market', 'rajkot yard', 'raikot'], name: 'Rajkot Market Yard' },
  // Morbi: STT often transcribes as "mor bhi" / "मोर भी" / "मोर बी" — catch all variants
  { keywords: ['morbi', 'mor bi', 'mor bhi', 'morbi apmc', 'મોરબી', 'मोरबी', 'मोर भी', 'मोर बी', 'morabi', 'morabi apmc', 'mori', 'morvi'], name: 'Morbi APMC' },
  { keywords: ['jamnagar', 'jam nagar', 'જામનગર', 'जामनगर', 'jamnagr', 'jamnagar apmc'], name: 'Jamnagar APMC' },
  { keywords: ['ahmedabad', 'amdavad', 'ahmed abad', 'અમદાવાદ', 'अहमदाबाद', 'ahemdabad', 'amdabad'], name: 'Ahmedabad APMC' },
  { keywords: ['surat', 'su rat', 'સુરત', 'सूरत', 'surrat', 'surt'], name: 'Surat APMC' },
  { keywords: ['navsari', 'nav sari', 'નવસારી', 'नवसारी', 'navsaari'], name: 'Navsari APMC' },
  { keywords: ['nashik', 'nasik', 'na shik', 'નાશિક', 'नाशिक', 'नासिक', 'nashik apmc'], name: 'Nashik APMC' },
  { keywords: ['lasalgaon', 'lasalgao', 'laal gao', 'લાસલગાવ', 'लासलगांव'], name: 'Lasalgaon APMC' },
  { keywords: ['pune', 'poona', 'poon', 'પુણે', 'पुणे', 'puna'], name: 'Pune Market Yard' },
  { keywords: ['indore', 'in dore', 'ઇન્દોર', 'इंदौर', 'indaur', 'indor'], name: 'Indore APMC' },
  { keywords: ['ujjain', 'uj jain', 'ઉજ્જૈન', 'उज्जैन', 'ujain', 'ujjein'], name: 'Ujjain APMC' },
  { keywords: ['mandsaur', 'mandsour', 'मंदसौर', 'मनासोर', 'mand saur'], name: 'Mandsaur APMC' },
  { keywords: ['kota', 'कोटा', 'kota rajasthan'], name: 'Kota APMC' },
]

// Keywords that indicate explicit delivery intent to a specific mandi
const DELIVERY_INTENT_KEYWORDS = [
  // English
  'deliver to', 'send to', 'take to', 'go to', 'want to go to', 'sell at', 'sell in',
  'want to send', 'want to deliver', 'need to send', 'ship to',
  // Hindi — common spoken variants including STT errors
  'pahunchana hai', 'pahunchaana hai', 'pohchana hai', 'pouchaana', 'pohnchana',
  'bhejna hai', 'bhejana hai', 'bhej dena', 'bhej do',
  'lejana hai', 'le jaana', 'leja', 'beja', 'pahuncha', 'dena hai',
  'pouchane hain', 'pochaane hain', 'pohuchana', 'pohuchana hai',
  // Hindi script variants
  'पहुंचाना', 'पोचाना', 'पोचाने', 'पहुँचाना', 'भेजना', 'भेजना है', 'ले जाना', 'भिजवाना',
  'yahan bechna', 'wahan bechna', 'vahan bechna', 'wahan le jana', 'vahan pohuchna',
  // Gujarati
  'moklu che', 'moklavanu che', 'lavanu che', 'le javanu che', 'mane che',
  'pavhuchavanu', 'apavu che', 'apavanu', 'moklave', 'moklavani',
  // Marathi
  'pathvayche', 'nyayche', 'gheun jayche', 'pathvaycha', 'pathaavaycha',
]

/**
 * Detect if user explicitly said they want to deliver/send to a specific mandi.
 * Returns the mandi name if an explicit delivery intent + known mandi is found.
 */
function detectExplicitDestination(lower: string, original: string): string | undefined {
  // Check for delivery intent keywords
  const hasDeliveryIntent = DELIVERY_INTENT_KEYWORDS.some(kw => lower.includes(kw))

  // Find which mandi is mentioned
  for (const mandi of KNOWN_DESTINATION_MANDIS) {
    for (const kw of mandi.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (hasDeliveryIntent) {
          // Explicit: "I want to deliver to Gondal"
          return mandi.name
        }
        // Also check: if "mandi" / "APMC" / "market" word appears near the mandi name, treat as explicit destination
        const mandiCtxPattern = new RegExp(
          `(mandi|apmc|market|yard|બજાર|ma|mai|men|में|मार्केट|mar|bazaar|bazaari).{0,20}${kw}|${kw}.{0,20}(mandi|apmc|market|yard|bazaar|bazaari|ma |mai |men |में|मार्केट)`,
          'i'
        )
        if (mandiCtxPattern.test(original)) {
          return mandi.name
        }
      }
    }
  }

  return undefined
}

export function parseHarvestDetails(rawText: string): ParsedHarvest {
  if (!rawText || !rawText.trim()) {
    return {
      crop: 'Wheat',        // neutral default — not Onion
      quantity: 20,
      location: 'Rajkot, Gujarat',
      urgency: 'today',
      confidence: 0,
    }
  }

  // 1. Convert regional Indian numerals to standard ASCII digits
  let normalized = rawText
  for (const [g, a] of Object.entries(GUJARATI_NUMERALS)) {
    normalized = normalized.replaceAll(g, a)
  }
  for (const [d, a] of Object.entries(DEVANAGARI_NUMERALS)) {
    normalized = normalized.replaceAll(d, a)
  }

  const lower = normalized.toLowerCase()
  let matchedPoints = 0

  // 2. Explicit destination detection (BEFORE crop/location parsing)
  const targetMandi = detectExplicitDestination(lower, normalized)

  // 3. Crop Detection across Gujarati, Hindi, Marathi, English + phonetic variants
  // Note: crop is ONLY defaulted if truly nothing matches — avoid defaulting to Onion
  let crop: ParsedHarvest['crop'] | null = null

  if (
    lower.includes('onion') || lower.includes('pyaaz') || lower.includes('pyaz') ||
    lower.includes('piyaaj') || lower.includes('piyaz') ||
    lower.includes('kanda') || lower.includes('kaanda') || lower.includes('dungri') ||
    lower.includes('dungari') || lower.includes('dungali') || lower.includes('dungali') ||
    lower.includes('ڈنگری') ||
    lower.includes('ડુંગળી') || lower.includes('ડુંગળ') || lower.includes('ડૂંગળ') ||
    lower.includes('કાંદ') || lower.includes('कांद') || lower.includes('प्याज') ||
    lower.includes('प्याजा') || lower.includes('कांदा') || lower.includes('कांदे') ||
    // Gujarati spoken phonetics that STT often returns
    lower.includes('dungri') || lower.includes('dungli') || lower.includes('dungali')
  ) {
    crop = 'Onion'
    matchedPoints += 2
  } else if (
    lower.includes('wheat') || lower.includes('gehu') || lower.includes('gehun') ||
    lower.includes('ghau') || lower.includes('gahu') || lower.includes('gheu') ||
    lower.includes('ઘઉં') || lower.includes('ઘઉ') || lower.includes('ghav') ||
    lower.includes('गेहूं') || lower.includes('गेंहू') || lower.includes('गहू') ||
    lower.includes('गेहू') || lower.includes('गेहु')
  ) {
    crop = 'Wheat'
    matchedPoints += 2
  } else if (
    lower.includes('tomato') || lower.includes('tamatar') || lower.includes('tameta') ||
    lower.includes('tameeta') || lower.includes('tameta') || lower.includes('tometa') ||
    lower.includes('ટામેટ') || lower.includes('ટમેટ') || lower.includes('tameto') ||
    lower.includes('टमाटर') || lower.includes('टोमॅटो') || lower.includes('tamatar')
  ) {
    crop = 'Tomato'
    matchedPoints += 2
  } else if (
    lower.includes('soybean') || lower.includes('soyabean') || lower.includes('soya') ||
    lower.includes('soybeen') || lower.includes('soyabeen') || lower.includes('soy') ||
    lower.includes('સોયાબ') || lower.includes('सोयाब')
  ) {
    crop = 'Soybean'
    matchedPoints += 2
  } else if (
    lower.includes('cotton') || lower.includes('kapas') || lower.includes('kapaas') ||
    lower.includes('kapas') || lower.includes('rui') || lower.includes('ruee') ||
    lower.includes('કપાસ') || lower.includes('कपास') || lower.includes('रुई')
  ) {
    crop = 'Cotton'
    matchedPoints += 2
  } else if (
    lower.includes('potato') || lower.includes('aloo') || lower.includes('alu') ||
    lower.includes('allu') || lower.includes('bataka') || lower.includes('batata') ||
    lower.includes('bateto') || lower.includes('batako') ||
    lower.includes('બટાક') || lower.includes('બટાટ') || lower.includes('आलू') ||
    lower.includes('बटाट')
  ) {
    crop = 'Potato'
    matchedPoints += 2
  } else if (
    lower.includes('garlic') || lower.includes('lahsun') || lower.includes('lasun') ||
    lower.includes('lasan') || lower.includes('lashan') || lower.includes('lassan') ||
    lower.includes('લસણ') || lower.includes('लहसुन') || lower.includes('लसूण')
  ) {
    crop = 'Garlic'
    matchedPoints += 2
  } else if (
    lower.includes('mustard') || lower.includes('sarson') || lower.includes('raydo') ||
    lower.includes('raido') || lower.includes('sarso') ||
    lower.includes('રાઈ') || lower.includes('રાયડ') || lower.includes('સરસ') ||
    lower.includes('सरसों') || lower.includes('सरसो')
  ) {
    crop = 'Mustard'
    matchedPoints += 2
  } else if (
    lower.includes('maize') || lower.includes('makka') || lower.includes('makkai') ||
    lower.includes('makai') || lower.includes('makka') || lower.includes('corn') ||
    lower.includes('મકાઈ') || lower.includes('मक्का') || lower.includes('मकाई')
  ) {
    crop = 'Maize'
    matchedPoints += 2
  }

  // If no crop matched, leave as null — we'll use a neutral fallback NOT Onion
  const finalCrop: ParsedHarvest['crop'] = crop ?? 'Wheat'

  // 4. Quantity Detection (Handles Digits, Bori/Bags, and Spoken Words)
  let quantity = 20
  const digitMatch = normalized.match(/(\d+)\s*(?:quintal|qtl|q|bori|bag|gunny|કટા|ક્વિન્ટલ|બોરી|ક્વિ|क्विंटल|बोरी|टन|ton)?/i)
  if (digitMatch && digitMatch[1]) {
    const parsed = parseInt(digitMatch[1], 10)
    if (parsed > 0 && parsed <= 5000) {
      quantity = parsed
      matchedPoints += 1
    }
  } else {
    // Check word-based numbers
    const words = lower.split(/[\s,]+/)
    for (const w of words) {
      if (WORD_NUMBERS[w]) {
        quantity = WORD_NUMBERS[w]
        matchedPoints += 1
        break
      }
    }
  }

  // 5. Origin Location Detection (where the farmer IS, not where they want to go)
  // Skip locations that match the explicit target mandi to avoid confusion
  let location = 'Rajkot, Gujarat'
  const targetMandiLower = (targetMandi || '').toLowerCase()

  // Build list of location candidates, but exclude the destination mandi city
  const locationCandidates: { keywords: string[]; loc: string }[] = [
    { keywords: ['rajkot', 'રાજકોટ', 'राजकोट'], loc: 'Rajkot, Gujarat' },
    { keywords: ['gondal', 'ગોંડલ', 'गोंडल'], loc: 'Gondal, Gujarat' },
    { keywords: ['morbi', 'મોરબી', 'मोरबी'], loc: 'Morbi, Gujarat' },
    { keywords: ['jamnagar', 'જામનગર', 'जामनगर'], loc: 'Jamnagar, Gujarat' },
    { keywords: ['ahmedabad', 'amdavad', 'અમદાવ', 'अहमदाबाद'], loc: 'Ahmedabad, Gujarat' },
    { keywords: ['surat', 'સુરત', 'सूरत'], loc: 'Surat, Gujarat' },
    { keywords: ['navsari', 'નવસારી', 'नवसारी'], loc: 'Navsari, Gujarat' },
    { keywords: ['nashik', 'nasik', 'નાશિ', 'नाशिक', 'नासिक', 'niphad', 'निफाड'], loc: 'Nashik, Maharashtra' },
    { keywords: ['lasalgaon', 'lasalgao', 'લાસ', 'लासल'], loc: 'Lasalgaon, Maharashtra' },
    { keywords: ['pune', 'poona', 'પુણ', 'पुण'], loc: 'Pune, Maharashtra' },
    { keywords: ['indore', 'ઇન્દો', 'इंदौर', 'indaur'], loc: 'Indore, Madhya Pradesh' },
    { keywords: ['ujjain', 'ઉજ્જ', 'उज्जैन'], loc: 'Ujjain, Madhya Pradesh' },
    { keywords: ['kota', 'कोटा'], loc: 'Kota, Rajasthan' },
    { keywords: ['mandsaur', 'मंदसौर'], loc: 'Mandsaur, Madhya Pradesh' },
  ]

  for (const candidate of locationCandidates) {
    const matchedKw = candidate.keywords.find(kw => lower.includes(kw.toLowerCase()))
    if (matchedKw) {
      // If this location matches the targeted mandi, it's the destination — skip as origin
      // unless it's the only location mentioned (user may be at the mandi)
      if (targetMandi && targetMandiLower.includes(matchedKw.toLowerCase())) {
        continue
      }
      location = candidate.loc
      matchedPoints += 1
      break
    }
  }

  // 6. Urgency Detection
  let urgency: ParsedHarvest['urgency'] = 'today'
  if (
    lower.includes('tomorrow') || lower.includes('kal') || lower.includes('kaale') ||
    lower.includes('soon') || lower.includes('કાલ') || lower.includes('આવતીક') ||
    lower.includes('kall ') || lower.includes(' kal ') ||
    lower.includes('कल ') || lower.includes(' कल') || lower.includes('जल्दी') ||
    lower.includes('ugta') || lower.includes('ugta kal')
  ) {
    urgency = 'soon'
    matchedPoints += 1
  } else if (
    lower.includes('week') || lower.includes('hafte') || lower.includes('athvadiyu') ||
    lower.includes('અઠવ') || lower.includes('हफ्ते') || lower.includes('hafte mein')
  ) {
    urgency = 'week'
    matchedPoints += 1
  } else if (
    lower.includes('today') || lower.includes('aaj') || lower.includes('aaje') ||
    lower.includes('now') || lower.includes('આજ') || lower.includes('आज') ||
    lower.includes('अभी') || lower.includes('abhi') || lower.includes('hemen')
  ) {
    urgency = 'today'
    matchedPoints += 1
  }

  const confidence = Math.min(100, Math.max(60, matchedPoints * 20))

  return { crop: finalCrop, quantity, location, urgency, confidence, targetMandi }
}
