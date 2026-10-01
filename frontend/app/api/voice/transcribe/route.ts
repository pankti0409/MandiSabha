import { NextRequest, NextResponse } from 'next/server'
import { parseHarvestDetails } from '@/lib/voice-parser'

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_aqr3xu7p_EX6gyxh845PqQXNffWNJ2ifz'
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('file') as Blob | null
    const lang = (formData.get('language') as string) || 'gu-IN'

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided in request' },
        { status: 400 }
      )
    }

    let transcript = ''
    let provider = ''

    // 1. First Attempt: Sarvam AI STT (Saaras:v3 - State-of-the-art for Indian Languages)
    if (SARVAM_API_KEY) {
      try {
        const sarvamForm = new FormData()
        sarvamForm.append('file', audioFile, 'recording.wav')
        sarvamForm.append('model', 'saaras:v3')
        sarvamForm.append('mode', 'transcribe')
        sarvamForm.append('language_code', lang)

        const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: {
            'api-subscription-key': SARVAM_API_KEY,
          },
          body: sarvamForm,
        })

        if (sarvamRes.ok) {
          const sarvamData = await sarvamRes.json()
          if (sarvamData && sarvamData.transcript) {
            transcript = sarvamData.transcript.trim()
            provider = 'sarvam-saaras:v3'
          }
        } else {
          const errText = await sarvamRes.text()
          console.warn('Sarvam STT non-200:', sarvamRes.status, errText)
        }
      } catch (err) {
        console.warn('Sarvam STT failed, falling back to Groq Whisper:', err)
      }
    }

    // 2. Fallback Attempt: Groq Whisper (whisper-large-v3-turbo - Ultra fast Whisper)
    if (!transcript && GROQ_API_KEY) {
      try {
        const groqForm = new FormData()
        groqForm.append('file', audioFile, 'recording.wav')
        groqForm.append('model', 'whisper-large-v3-turbo')
        const shortLang = lang.split('-')[0] // 'gu', 'hi', 'en', 'mr'
        if (shortLang) {
          groqForm.append('language', shortLang)
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: groqForm,
        })

        if (groqRes.ok) {
          const groqData = await groqRes.json()
          if (groqData && groqData.text) {
            transcript = groqData.text.trim()
            provider = 'groq-whisper-large-v3-turbo'
          }
        } else {
          const errText = await groqRes.text()
          console.warn('Groq Whisper non-200:', groqRes.status, errText)
        }
      } catch (err) {
        console.warn('Groq Whisper failed:', err)
      }
    }

    // Parse the transcript into harvest parameters using our multi-script parser
    const parsed = parseHarvestDetails(transcript || '')

    return NextResponse.json({
      success: true,
      transcript: transcript || '',
      provider: provider || 'none',
      language: lang,
      ...parsed,
    })
  } catch (error: any) {
    console.error('STT API Route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error processing speech' },
      { status: 500 }
    )
  }
}
