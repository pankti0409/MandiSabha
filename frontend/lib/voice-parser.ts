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
}

export function parseHarvestDetails(rawText: string): ParsedHarvest {
  if (!rawText || !rawText.trim()) {
    return {
      crop: 'Onion',
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

  // 2. Crop Detection across Gujarati, Hindi, Marathi, English
  let crop: ParsedHarvest['crop'] = 'Onion'
  if (
    lower.includes('onion') || lower.includes('pyaaz') || lower.includes('pyaz') ||
    lower.includes('kanda') || lower.includes('kaanda') || lower.includes('dungri') ||
    lower.includes('dungari') || lower.includes('ડુંગળી') || lower.includes('કાંદા') ||
    lower.includes('કાંદો') || lower.includes('प्याज') || lower.includes('कांदा') || lower.includes('कांदे')
  ) {
    crop = 'Onion'
    matchedPoints += 1
  } else if (
    lower.includes('wheat') || lower.includes('gehu') || lower.includes('gehun') ||
    lower.includes('ghau') || lower.includes('gahu') || lower.includes('ઘઉં') ||
    lower.includes('गेहूं') || lower.includes('गेंहू') || lower.includes('गहू')
  ) {
    crop = 'Wheat'
    matchedPoints += 1
  } else if (
    lower.includes('tomato') || lower.includes('tamatar') || lower.includes('tameta') ||
    lower.includes('tameeta') || lower.includes('ટામેટા') || lower.includes('ટમેટા') ||
    lower.includes('ટામેટું') || lower.includes('टमाटर') || lower.includes('टोमॅटो')
  ) {
    crop = 'Tomato'
    matchedPoints += 1
  } else if (
    lower.includes('soybean') || lower.includes('soyabean') || lower.includes('soya') ||
    lower.includes('સોયાબીન') || lower.includes('सोयाबीन')
  ) {
    crop = 'Soybean'
    matchedPoints += 1
  } else if (
    lower.includes('cotton') || lower.includes('kapas') || lower.includes('kapaas') ||
    lower.includes('rui') || lower.includes('કપાસ') || lower.includes('કપાસીયા') ||
    lower.includes('कपास') || lower.includes('रुई')
  ) {
    crop = 'Cotton'
    matchedPoints += 1
  } else if (
    lower.includes('potato') || lower.includes('aloo') || lower.includes('alu') ||
    lower.includes('bataka') || lower.includes('batata') || lower.includes('bateto') ||
    lower.includes('બટાકા') || lower.includes('બટાટા') || lower.includes('બટેટા') ||
    lower.includes('आलू') || lower.includes('बटाटा')
  ) {
    crop = 'Potato'
    matchedPoints += 1
  } else if (
    lower.includes('garlic') || lower.includes('lahsun') || lower.includes('lasun') ||
    lower.includes('lasan') || lower.includes('લસણ') || lower.includes('लहसुन') || lower.includes('लसूण')
  ) {
    crop = 'Garlic'
    matchedPoints += 1
  } else if (
    lower.includes('mustard') || lower.includes('sarson') || lower.includes('raydo') ||
    lower.includes('રાઈ') || lower.includes('રાયડો') || lower.includes('સરસવ') || lower.includes('सरसों')
  ) {
    crop = 'Mustard'
    matchedPoints += 1
  } else if (
    lower.includes('maize') || lower.includes('makka') || lower.includes('makkai') ||
    lower.includes('makai') || lower.includes('મકાઈ') || lower.includes('मक्का')
  ) {
    crop = 'Maize'
    matchedPoints += 1
  }

  // 3. Quantity Detection (Handles Digits, Bori/Bags, and Spoken Words)
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

  // 4. Location Detection across Gujarat, Maharashtra, MP, Rajasthan
  let location = 'Rajkot, Gujarat'
  if (lower.includes('rajkot') || lower.includes('રાજકોટ') || lower.includes('राजकोट')) {
    location = 'Rajkot, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('gondal') || lower.includes('ગોંડલ') || lower.includes('गोंडल')) {
    location = 'Gondal, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('morbi') || lower.includes('મોરબી') || lower.includes('मोरबी')) {
    location = 'Morbi, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('jamnagar') || lower.includes('જામનગર') || lower.includes('जामनगर')) {
    location = 'Jamnagar, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('ahmedabad') || lower.includes('amdavad') || lower.includes('અમદાવાદ') || lower.includes('अहमदाबाद')) {
    location = 'Ahmedabad, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('surat') || lower.includes('સુરત') || lower.includes('सूरत')) {
    location = 'Surat, Gujarat'
    matchedPoints += 1
  } else if (lower.includes('navsari') || lower.includes('નવસારી') || lower.includes('नवसारी')) {
    location = 'Navsari, Gujarat'
    matchedPoints += 1
  } else if (
    lower.includes('nashik') || lower.includes('nasik') || lower.includes('નાશિક') ||
    lower.includes('नाशिक') || lower.includes('नासिक') || lower.includes('niphad') || lower.includes('निफाड')
  ) {
    location = 'Nashik, Maharashtra'
    matchedPoints += 1
  } else if (lower.includes('lasalgaon') || lower.includes('lasalgao') || lower.includes('લાસલગાવ') || lower.includes('लासलगांव')) {
    location = 'Lasalgaon, Maharashtra'
    matchedPoints += 1
  } else if (lower.includes('pune') || lower.includes('poona') || lower.includes('પુણે') || lower.includes('पुणे') || lower.includes('पूना')) {
    location = 'Pune, Maharashtra'
    matchedPoints += 1
  } else if (lower.includes('indore') || lower.includes('ઇન્દોર') || lower.includes('इंदौर') || lower.includes('इन्दौर')) {
    location = 'Indore, Madhya Pradesh'
    matchedPoints += 1
  } else if (lower.includes('ujjain') || lower.includes('ઉજ્જૈન') || lower.includes('उज्जैन')) {
    location = 'Ujjain, Madhya Pradesh'
    matchedPoints += 1
  }

  // 5. Urgency Detection
  let urgency: ParsedHarvest['urgency'] = 'today'
  if (
    lower.includes('tomorrow') || lower.includes('kal') || lower.includes('kaale') ||
    lower.includes('soon') || lower.includes('કાલે') || lower.includes('આવતીકાલે') ||
    lower.includes('कल') || lower.includes('जल्दी')
  ) {
    urgency = 'soon'
    matchedPoints += 1
  } else if (
    lower.includes('week') || lower.includes('hafte') || lower.includes('athvadiyu') ||
    lower.includes('અઠવાડિયું') || lower.includes('हफ्ते')
  ) {
    urgency = 'week'
    matchedPoints += 1
  } else if (
    lower.includes('today') || lower.includes('aaj') || lower.includes('aaje') ||
    lower.includes('now') || lower.includes('આજે') || lower.includes('आज') || lower.includes('अभी')
  ) {
    urgency = 'today'
    matchedPoints += 1
  }

  const confidence = Math.min(100, Math.max(60, matchedPoints * 25))

  return { crop, quantity, location, urgency, confidence }
}
