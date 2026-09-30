const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, '..', 'locales')
const baseLang = 'en'
const targetLangs = ['hi', 'gu']

function getKeys(obj, prefix = '') {
  let keys = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function runCheck() {
  const baseDir = path.join(localesDir, baseLang)
  if (!fs.existsSync(baseDir)) {
    console.error(`Base locale directory not found: ${baseDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(baseDir).filter((f) => f.endsWith('.json'))
  let hasErrors = false
  let totalKeys = 0

  console.log(`Checking i18n parity against base language: [${baseLang.toUpperCase()}] across ${files.length} namespaces...\n`)

  for (const file of files) {
    const baseContent = JSON.parse(fs.readFileSync(path.join(baseDir, file), 'utf8'))
    const baseKeys = getKeys(baseContent)
    totalKeys += baseKeys.length

    for (const lang of targetLangs) {
      const targetFilePath = path.join(localesDir, lang, file)
      if (!fs.existsSync(targetFilePath)) {
        console.error(`❌ [${lang.toUpperCase()}] Missing namespace file: ${file}`)
        hasErrors = true
        continue
      }

      const targetContent = JSON.parse(fs.readFileSync(targetFilePath, 'utf8'))
      const targetKeys = new Set(getKeys(targetContent))

      const missing = baseKeys.filter((k) => !targetKeys.has(k))
      if (missing.length > 0) {
        console.error(`❌ [${lang.toUpperCase()}][${file}] Missing ${missing.length} keys:`)
        missing.forEach((k) => console.error(`   - ${k}`))
        hasErrors = true
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ i18n parity check FAILED. Please resolve missing keys.')
    process.exit(1)
  } else {
    console.log(`✅ 100% key parity verified across all languages! (${totalKeys} total keys checked)`)
    process.exit(0)
  }
}

runCheck()
