'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, X, Sparkles, Check, Volume2, ArrowRight, Radio, MicOff, Globe2, AlertCircle, Loader2, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseHarvestDetails, ParsedHarvest } from '@/lib/voice-parser'
import { useLocale } from '@/components/locale-provider'

interface VoiceAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (data: { crop: string; quantity: number; location: string; urgency: 'today' | 'soon' | 'week' }) => void
}

type SupportedLang = {
  code: string
  label: string
  flag: string
  hint: string
}

const SUPPORTED_LANGUAGES: SupportedLang[] = [
  { code: 'gu-IN', label: 'ગુજરાતી', flag: '🇬🇯', hint: 'દા.ત. રાજકોટ ૨૦ ક્વિન્ટલ ડુંગળી' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳', hint: 'उदा. राजकोट से २० क्विंटल प्याज आज' },
  { code: 'en-IN', label: 'English', flag: '🌐', hint: 'e.g. 20 quintals of onion from Rajkot' },
  { code: 'mr-IN', label: 'मराठी', flag: '🚩', hint: 'उदा. नाशिकहून २० क्विंटल कांदा' },
]

const samplePhrases = [
  { text: 'રાજકોટ થી ૨૦ ક્વિન્ટલ ડુંગળી ગોંડલ વેચવી છે આજે', crop: 'Onion', quantity: 20, location: 'Rajkot, Gujarat', urgency: 'today' as const, lang: 'ગુજરાતી (Rajkot)' },
  { text: 'Rajkot thi 20 quintal dungri Gondal APMC ma vechvi che aaj', crop: 'Onion', quantity: 20, location: 'Rajkot, Gujarat', urgency: 'today' as const, lang: 'Gujlish (Rajkot)' },
  { text: 'नासिक से 35 क्विंटल प्याज आज बेचना है', crop: 'Onion', quantity: 35, location: 'Nashik, Maharashtra', urgency: 'today' as const, lang: 'हिन्दी (Nashik)' },
  { text: 'સુરત માર્કેટમાં 50 ક્વિન્ટલ ઘઉં કાલે વેચવા છે', crop: 'Wheat', quantity: 50, location: 'Surat, Gujarat', urgency: 'soon' as const, lang: 'ગુજરાતી (Surat)' },
  { text: 'Send 15 quintals of tomato to Ahmedabad tomorrow', crop: 'Tomato', quantity: 15, location: 'Ahmedabad, Gujarat', urgency: 'soon' as const, lang: 'English' },
]

export function VoiceAssistantModal({ isOpen, onClose, onApply }: VoiceAssistantModalProps) {
  const { language, t, tData } = useLocale()
  const initialLang = language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
  const initialPreset = language === 'gu' ? 0 : language === 'hi' ? 2 : 4
  const [selectedLang, setSelectedLang] = useState<string>(initialLang)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingSTT, setIsProcessingSTT] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(initialPreset)
  const [transcribedText, setTranscribedText] = useState('')
  const [micError, setMicError] = useState<string | null>(null)
  const [sttProvider, setSttProvider] = useState<string>('Sarvam AI / Groq Whisper')
  const [audioVolume, setAudioVolume] = useState<number>(0)

  const [extractedData, setExtractedData] = useState<ParsedHarvest>({
    crop: 'Onion',
    quantity: 20,
    location: 'Rajkot, Gujarat',
    urgency: 'today',
    confidence: 100,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)

  // Live text parser trigger
  function handleTextUpdate(text: string) {
    setTranscribedText(text)
    if (!text || !text.trim()) return

    // 1. Instant local parsing (multi-script numerals & regional crop names)
    const localParsed = parseHarvestDetails(text)
    setExtractedData(localParsed)

    // 2. Async server verification
    try {
      fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success) {
            setExtractedData({
              crop: data.crop,
              quantity: data.quantity,
              location: data.location,
              urgency: data.urgency,
              confidence: 98,
            })
          }
        })
        .catch(() => {})
    } catch {}
  }

  // Handle preset simulation
  useEffect(() => {
    if (!isOpen || isRecording || selectedPreset === null) return
    const phrase = samplePhrases[selectedPreset]
    setTranscribedText('')

    let current = ''
    let idx = 0
    const interval = setInterval(() => {
      if (idx < phrase.text.length) {
        current += phrase.text.charAt(idx)
        setTranscribedText(current)
        idx++
      } else {
        clearInterval(interval)
        handleTextUpdate(phrase.text)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [isOpen, selectedPreset, isRecording])

  // Cleanup on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopRecording()
    }
  }, [isOpen])

  // Stop recording and cleanup audio resources
  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    setIsRecording(false)
    setAudioVolume(0)
  }

  // Start real audio recording with Sarvam AI / Groq Whisper STT pipeline
  async function startRecording() {
    setMicError(null)
    setSelectedPreset(null)
    audioChunksRef.current = []

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 2. Set up AudioContext volume meter for live reactive visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass()
        audioContextRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateMeter = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)))
          animFrameRef.current = requestAnimationFrame(updateMeter)
        }
        updateMeter()
      } catch (e) {
        console.warn('AudioContext visualization setup failed:', e)
      }

      // 3. Set up MediaRecorder
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (audioBlob.size > 200) {
          await processAudioWithProperSTT(audioBlob)
        }
      }

      recorder.start(250) // collect chunks every 250ms
      setIsRecording(true)

      // 4. In parallel, trigger Web Speech API for immediate interim preview
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.lang = selectedLang
          recognition.interimResults = true
          recognition.continuous = true

          recognition.onresult = (event: any) => {
            let interim = ''
            let finalStr = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript
              } else {
                interim += event.results[i][0].transcript
              }
            }
            const liveText = (finalStr || interim || '').trim()
            if (liveText) {
              handleTextUpdate(liveText)
            }
          }

          recognitionRef.current = recognition
          recognition.start()
        }
      } catch (err) {
        console.warn('Web Speech API preview not available, using pure server STT:', err)
      }
    } catch (err: any) {
      console.error('Microphone error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied. Please allow microphone access in your browser.')
      } else {
        setMicError(err.message || 'Could not access microphone.')
      }
      setIsRecording(false)
    }
  }

  // Send recorded audio to high-precision Sarvam AI & Groq Whisper STT endpoint
  async function processAudioWithProperSTT(blob: Blob) {
    setIsProcessingSTT(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, 'user_voice.webm')
      formData.append('language', selectedLang)

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.success && data.transcript) {
          setTranscribedText(data.transcript)
          setSttProvider(data.provider || 'Sarvam AI')
          setExtractedData({
            crop: data.crop || extractedData.crop,
            quantity: data.quantity || extractedData.quantity,
            location: data.location || extractedData.location,
            urgency: data.urgency || extractedData.urgency,
            confidence: 99,
          })
        }
      }
    } catch (err) {
      console.warn('STT transcription error:', err)
    } finally {
      setIsProcessingSTT(false)
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Switch recognition language
  function handleLangSwitch(code: string) {
    setSelectedLang(code)
    if (isRecording) {
      stopRecording()
      setTimeout(() => {
        startRecording()
      }, 200)
    }
  }

  if (!isOpen) return null

  function handleConfirm() {
    onApply(extractedData)
    onClose()
  }

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 grid size-9 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              'grid size-12 place-items-center rounded-2xl transition-all shadow-md cursor-pointer shrink-0',
              isRecording
                ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-500/20'
                : 'bg-primary/15 text-primary hover:bg-primary/25 hover:scale-105'
            )}
            title={isRecording ? 'Stop recording & transcribe' : 'Tap to speak live'}
          >
            {isRecording ? <MicOff className="size-6" /> : <Mic className="size-6 animate-pulse" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="section-kicker">{t('voice.kicker')}</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                isRecording
                  ? 'bg-rose-500/10 text-rose-600 animate-pulse'
                  : isProcessingSTT
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-emerald-500/10 text-emerald-600'
              )}>
                {isProcessingSTT ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Transcribing with Sarvam/Groq…
                  </>
                ) : isRecording ? (
                  <>
                    <Radio className="size-3" /> Recording Audio…
                  </>
                ) : (
                  <>
                    <Cpu className="size-3" /> {t('voice.badge')}
                  </>
                )}
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {t('voice.title')}
            </h3>
          </div>
        </div>

        {/* STT Language Selector Strip */}
        <div className="flex flex-col gap-1.5 bg-muted/30 p-2.5 rounded-2xl border border-border/70">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe2 className="size-3 text-primary" /> Speech Recognition Language:
            </span>
            <span className="text-primary font-mono">{activeLangObj.label} ({activeLangObj.code})</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLangSwitch(lang.code)}
                className={cn(
                  'rounded-xl py-1.5 px-2 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer',
                  selectedLang === lang.code
                    ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                    : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                )}
              >
                <span>{lang.flag}</span>
                <span className="truncate">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Microphone Soundwave & Visualizer Box */}
        <div className="rounded-2xl border border-border bg-background/80 p-4 sm:p-5 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
          {/* Animated soundwave bars that react to voice volume */}
          <div className="flex items-center gap-1.5 h-8 text-primary">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
              const dynHeight = isRecording
                ? Math.min(30, 6 + Math.round((audioVolume / 100) * 24 * (0.6 + ((i * 3) % 5) * 0.1)))
                : 4
              return (
                <span
                  key={i}
                  className={cn(
                    'wave-bar !w-1 transition-all rounded-full',
                    isRecording ? '!bg-rose-500' : '!bg-primary'
                  )}
                  style={{
                    animationDuration: `${0.7 + (i % 5) * 0.15}s`,
                    opacity: isRecording ? 1 : 0.25,
                    height: `${dynHeight}px`,
                  }}
                />
              )
            })}
          </div>

          {/* Real-time Transcription Stream */}
          <div className="text-center min-h-[46px] flex flex-col items-center justify-center px-2 w-full gap-1">
            <p className="font-display text-sm sm:text-base font-semibold text-foreground italic break-words max-w-full">
              &ldquo;{transcribedText || `Tap speak and say e.g. "${activeLangObj.hint}"`}&rdquo;
            </p>
            {isProcessingSTT && (
              <span className="text-[11px] text-primary flex items-center gap-1 animate-pulse">
                <Loader2 className="size-3 animate-spin" /> Verifying transcription via Sarvam AI & Groq STT…
              </span>
            )}
          </div>

          {/* Big Live Mic Trigger Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              'rounded-full px-5 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm',
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-primary text-white hover:bg-primary/90 hover:scale-105'
            )}
          >
            {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            <span>{isRecording ? 'Listening… Tap to Finish & Transcribe' : `Tap to Speak in ${activeLangObj.label}`}</span>
          </button>

          {micError && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 text-center mt-1">
              <AlertCircle className="size-3.5 shrink-0" /> {micError}
            </p>
          )}
        </div>

        {/* ALWAYS-VISIBLE Extracted Parameters Card */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent" /> AI Understood Parameters
            </span>
            <span className="font-mono text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-primary">
              ⚡ Multi-Script Live Synced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-card p-2.5 flex flex-col justify-between">
              <span className="text-muted-foreground block text-[10px] font-semibold">{t('voice.commodity')}</span>
              <strong className="font-bold text-foreground text-sm text-primary">{tData('crop', extractedData.crop)}</strong>
            </div>

            <div className="rounded-xl border border-border bg-card p-2.5 flex flex-col justify-between">
              <span className="text-muted-foreground block text-[10px] font-semibold">{t('voice.volume')}</span>
              <strong className="font-bold text-foreground text-sm font-mono">{extractedData.quantity} {t('common.units.quintals')}</strong>
            </div>

            <div className="rounded-xl border border-border bg-card p-2.5 flex flex-col justify-between">
              <span className="text-muted-foreground block text-[10px] font-semibold">{t('voice.origin_farm')}</span>
              <strong className="font-bold text-foreground truncate block text-xs">{extractedData.location}</strong>
            </div>

            <div className="rounded-xl border border-border bg-card p-2.5 flex flex-col justify-between">
              <span className="text-muted-foreground block text-[10px] font-semibold">{t('voice.urgency')}</span>
              <strong className="font-bold text-emerald-600 dark:text-emerald-400 capitalize text-xs">
                {extractedData.urgency === 'today' ? t('voice.urgency_today') : extractedData.urgency === 'soon' ? t('voice.urgency_soon') : t('voice.urgency_week')}
              </strong>
            </div>
          </div>
        </div>

        {/* Sample Voice Prompts Switcher */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground">{t('voice.prompt_switcher_label')}</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePhrases.map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  stopRecording()
                  setSelectedPreset(i)
                }}
                className={cn(
                  'rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer',
                  selectedPreset === i
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{phrase.lang}</span>: {tData('crop', phrase.crop)} ({phrase.quantity}q)
              </button>
            ))}
          </div>
        </div>

        {/* Actions CTA */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="button-primary !min-h-[46px] flex-1 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] cursor-pointer"
          >
            <span>{t('voice.apply_cta')} ({extractedData.quantity}q {tData('crop', extractedData.crop)})</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
