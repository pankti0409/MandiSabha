'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, X, MicOff, AlertCircle, Loader2, MapPin, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseHarvestDetails, ParsedHarvest } from '@/lib/voice-parser'
import { useLocale } from '@/components/locale-provider'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface VoiceAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (data: { crop: string; quantity: number; location: string; urgency: 'today' | 'soon' | 'week'; targetMandi?: string }) => void
}

type SupportedLang = { code: string; label: string; flag: string; hint: string }

/* ─── Constants (unchanged) ─────────────────────────────────────────────── */
const SUPPORTED_LANGUAGES: SupportedLang[] = [
  { code: 'gu-IN', label: 'ગુજરાતી', flag: '🇬🇯', hint: 'દા.ત. રાજકોટ ૨૦ ક્વિન્ટલ ડુંગળી' },
  { code: 'hi-IN', label: 'हिन्दी',  flag: '🇮🇳', hint: 'उदा. राजकोट से २० क्विंटल प्याज आज' },
  { code: 'en-IN', label: 'English',  flag: '🌐', hint: 'e.g. 20 quintals of onion from Rajkot' },
  { code: 'mr-IN', label: 'मराठी',   flag: '🚩', hint: 'उदा. नाशिकहून २० क्विंटल कांदा' },
]

const samplePhrases = [
  { text: 'રાજકોટ થી ૨૦ ક્વિન્ટલ ડુંગળી ગોંડલ વેચવી છે આજે',         crop: 'Onion',  quantity: 20, location: 'Rajkot, Gujarat',    urgency: 'today' as const, lang: 'Rajkot · Onion'  },
  { text: 'Rajkot thi 20 quintal dungri Gondal APMC ma vechvi che aaj', crop: 'Onion',  quantity: 20, location: 'Rajkot, Gujarat',    urgency: 'today' as const, lang: 'Gujlish · Onion' },
  { text: 'नासिक से 35 क्विंटल प्याज आज बेचना है',                       crop: 'Onion',  quantity: 35, location: 'Nashik, Maharashtra', urgency: 'today' as const, lang: 'Nashik · Onion'  },
  { text: 'સુરત માર્કેટમાં 50 ક્વિન્ટલ ઘઉં કાલે વેચવા છે',              crop: 'Wheat',  quantity: 50, location: 'Surat, Gujarat',     urgency: 'soon'  as const, lang: 'Surat · Wheat'   },
  { text: 'Send 15 quintals of tomato to Ahmedabad tomorrow',             crop: 'Tomato', quantity: 15, location: 'Ahmedabad, Gujarat',  urgency: 'soon'  as const, lang: 'Ahmedabad · Tomato' },
]

/* ─── Design tokens (inline CSS vars used for easy tweaking) ─────────────── */
const TOKEN = {
  bg:        '#080f0a',
  surface:   '#0d1810',
  surfaceHi: '#111d14',
  border:    'rgba(255,255,255,0.06)',
  hairline:  'rgba(255,255,255,0.07)',
  emerald:   '#10b981',
  emeraldLo: '#34d399',
  muted:     'rgba(255,255,255,0.38)',
  text:      'rgba(255,255,255,0.92)',
  r28: '28px', r22: '22px', r16: '16px',
} as const

/* ─── Waveform bars (CSS animation, respects prefers-reduced-motion) ─────── */
const WAVE_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes vm-bar { 0%,100%{transform:scaleY(.18)} 50%{transform:scaleY(1)} }
}
.vm-bar { transform-origin: center; transform: scaleY(.18); }
@media (prefers-reduced-motion: no-preference) {
  .vm-bar { animation: vm-bar 1.2s ease-in-out infinite; }
}
`

const WAVEFORM_DELAYS = [0, 0.15, 0.3, 0.08, 0.45, 0.22, 0.6, 0.1, 0.37, 0.52, 0.18, 0.42]

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function VoiceAssistantModal({ isOpen, onClose, onApply }: VoiceAssistantModalProps) {
  const { language, t, tData } = useLocale()
  const initialLang   = language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
  const initialPreset = language === 'gu' ? 0 : language === 'hi' ? 2 : 4

  /* ── State (untouched) ─────────────────────────────────────────────────── */
  const [selectedLang,    setSelectedLang]    = useState<string>(initialLang)
  const [isRecording,     setIsRecording]     = useState(false)
  const [isProcessingSTT, setIsProcessingSTT] = useState(false)
  const [selectedPreset,  setSelectedPreset]  = useState<number | null>(initialPreset)
  const [transcribedText, setTranscribedText] = useState('')
  const [micError,        setMicError]        = useState<string | null>(null)
  const [sttProvider,     setSttProvider]     = useState<string>('Sarvam AI / Groq Whisper')
  const [audioVolume,     setAudioVolume]     = useState<number>(0)

  const [extractedData, setExtractedData] = useState<ParsedHarvest>({
    crop: 'Wheat', quantity: 20, location: 'Rajkot, Gujarat', urgency: 'today', confidence: 100,
  })

  /* ── Refs (untouched) ──────────────────────────────────────────────────── */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const audioContextRef  = useRef<AudioContext | null>(null)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const animFrameRef     = useRef<number | null>(null)
  const recognitionRef   = useRef<any>(null)

  /* ── Logic (untouched) ─────────────────────────────────────────────────── */
  function handleTextUpdate(text: string) {
    setTranscribedText(text)
    if (!text || !text.trim()) return
    const localParsed = parseHarvestDetails(text)
    setExtractedData(localParsed)
    try {
      fetch('/api/voice/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.success) {
            setExtractedData({ crop: data.crop, quantity: data.quantity, location: data.location, urgency: data.urgency, confidence: 98, targetMandi: data.targetMandi })
          }
        })
        .catch(() => {})
    } catch {}
  }

  useEffect(() => {
    if (!isOpen || isRecording || selectedPreset === null) return
    const phrase = samplePhrases[selectedPreset]
    setTranscribedText('')
    let current = '', idx = 0
    const interval = setInterval(() => {
      if (idx < phrase.text.length) { current += phrase.text.charAt(idx); setTranscribedText(current); idx++ }
      else { clearInterval(interval); handleTextUpdate(phrase.text) }
    }, 25)
    return () => clearInterval(interval)
  }, [isOpen, selectedPreset, isRecording])

  useEffect(() => { if (!isOpen) stopRecording() }, [isOpen])

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { try { mediaRecorderRef.current.stop() } catch {} }
    if (streamRef.current)       { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (recognitionRef.current)  { try { recognitionRef.current.stop() } catch {}; recognitionRef.current = null }
    if (audioContextRef.current) { try { audioContextRef.current.close() } catch {}; audioContextRef.current = null }
    if (animFrameRef.current)    { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    setIsRecording(false); setAudioVolume(0)
  }

  async function startRecording() {
    setMicError(null); setSelectedPreset(null); audioChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass(); audioContextRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser(); analyser.fftSize = 64; source.connect(analyser); analyserRef.current = analyser
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateMeter = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
          setAudioVolume(Math.min(100, Math.round((sum / dataArray.length / 128) * 100)))
          animFrameRef.current = requestAnimationFrame(updateMeter)
        }; updateMeter()
      } catch (e) { console.warn('AudioContext setup failed:', e) }
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined); mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 200) await processAudioWithProperSTT(blob)
      }
      recorder.start(250); setIsRecording(true)
      try {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SR) {
          const recognition = new SR(); recognition.lang = selectedLang; recognition.interimResults = true; recognition.continuous = true
          recognition.onresult = (event: any) => {
            let interim = '', finalStr = ''
            for (let i = event.resultIndex; i < event.results.length; ++i)
              event.results[i].isFinal ? (finalStr += event.results[i][0].transcript) : (interim += event.results[i][0].transcript)
            const liveText = (finalStr || interim || '').trim(); if (liveText) handleTextUpdate(liveText)
          }
          recognitionRef.current = recognition; recognition.start()
        }
      } catch (err) { console.warn('Web Speech API not available:', err) }
    } catch (err: any) {
      console.error('Microphone error:', err)
      setMicError(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone permission denied. Please allow microphone access in your browser.'
        : err.message || 'Could not access microphone.')
      setIsRecording(false)
    }
  }

  async function processAudioWithProperSTT(blob: Blob) {
    setIsProcessingSTT(true)
    try {
      const formData = new FormData(); formData.append('file', blob, 'user_voice.webm'); formData.append('language', selectedLang)
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        if (data && data.success && data.transcript) {
          setTranscribedText(data.transcript); setSttProvider(data.provider || 'Sarvam AI')
          setExtractedData({ crop: data.crop || extractedData.crop, quantity: data.quantity || extractedData.quantity, location: data.location || extractedData.location, urgency: data.urgency || extractedData.urgency, confidence: 99, targetMandi: data.targetMandi ?? extractedData.targetMandi })
        }
      }
    } catch (err) { console.warn('STT error:', err) }
    finally { setIsProcessingSTT(false) }
  }

  function toggleRecording() { isRecording ? stopRecording() : startRecording() }
  function handleLangSwitch(code: string) {
    setSelectedLang(code)
    if (isRecording) { stopRecording(); setTimeout(() => startRecording(), 200) }
  }

  if (!isOpen) return null

  function handleConfirm() { onApply(extractedData); onClose() }

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0]
  const urgencyLabel  = extractedData.urgency === 'today' ? t('voice.urgency_today') : extractedData.urgency === 'soon' ? t('voice.urgency_soon') : t('voice.urgency_week')

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Inject keyframes once */}
      <style dangerouslySetInnerHTML={{ __html: WAVE_CSS }} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div
          className="relative w-full flex flex-col"
          style={{
            maxWidth: 460,
            maxHeight: 'min(92dvh, 820px)',
            height: 'auto',
            background: TOKEN.bg,
            borderRadius: TOKEN.r28,
            border: `1px solid rgba(16,185,129,0.18)`,
            boxShadow: '0 32px 64px rgba(0,0,0,0.72), 0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',   /* keeps border-radius clip */
          }}
        >
          {/* Subtle top radial glow */}
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 320, height: 200, background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between shrink-0" style={{ padding: '18px 20px 16px' }}>
            <div className="flex items-center gap-3">
              {/* Mic icon container */}
              <div style={{
                width: 44, height: 44, borderRadius: TOKEN.r16, flexShrink: 0,
                background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)',
                border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.12)' : '0 0 0 0px transparent',
                transition: 'all 200ms ease',
              }}>
                {isRecording
                  ? <MicOff size={18} color="#f87171" />
                  : <Mic      size={18} color={TOKEN.emerald} />
                }
              </div>
              <div>
                {/* Status line */}
                <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isRecording ? '#f87171' : TOKEN.emerald,
                    boxShadow: isRecording ? '0 0 6px #f87171' : `0 0 6px ${TOKEN.emerald}`,
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}>
                    {isProcessingSTT ? 'Processing…' : isRecording ? 'Recording…' : 'Voice AI active'}
                  </span>
                </div>
                {/* Title */}
                <h2 style={{ fontSize: 20, fontWeight: 700, color: TOKEN.text, lineHeight: 1.2, fontFamily: '"Fraunces", serif', letterSpacing: '-0.02em' }}>
                  {t('voice.title')}
                </h2>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${TOKEN.border}`,
                color: TOKEN.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 200ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <X size={14} />
            </button>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────────── */}
          <div className="flex flex-col overflow-y-auto flex-1" style={{ gap: 10, padding: '0 16px 12px' }}>

            {/* Language segmented control */}
            <div style={{
              display: 'flex', background: TOKEN.surface, borderRadius: TOKEN.r16,
              padding: 4, border: `1px solid ${TOKEN.border}`, gap: 2,
            }}>
              {SUPPORTED_LANGUAGES.map(lang => {
                const active = selectedLang === lang.code
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLangSwitch(lang.code)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 12, cursor: 'pointer',
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      fontFamily: 'Inter, sans-serif',
                      color: active ? '#fff' : TOKEN.muted,
                      background: active ? TOKEN.emerald : 'transparent',
                      boxShadow: active ? `0 0 12px rgba(16,185,129,0.35)` : 'none',
                      border: 'none', transition: 'all 200ms ease',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {lang.label}
                  </button>
                )
              })}
            </div>

            {/* Speaking panel */}
            <div style={{
              background: TOKEN.surfaceHi, borderRadius: TOKEN.r22,
              border: `1px solid ${TOKEN.border}`,
              padding: '20px 20px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            }}>
              {/* Waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
                {WAVEFORM_DELAYS.map((delay, i) => {
                  const liveH = isRecording
                    ? Math.max(0.18, Math.min(1, 0.18 + (audioVolume / 100) * 0.82 * (0.5 + ((i * 7) % 5) * 0.1)))
                    : undefined
                  return (
                    <span
                      key={i}
                      className="vm-bar"
                      style={{
                        width: 3, borderRadius: 99, height: 28, display: 'block', flexShrink: 0,
                        background: isRecording ? '#f87171' : TOKEN.emerald,
                        opacity: isRecording ? 0.9 : 0.4,
                        animationDelay: `${delay}s`,
                        transform: liveH !== undefined ? `scaleY(${liveH})` : undefined,
                      }}
                    />
                  )
                })}
              </div>

              {/* Transcript */}
              <p style={{
                fontSize: 13, fontWeight: 500, fontStyle: 'italic',
                fontFamily: '"Fraunces", serif',
                color: TOKEN.text, textAlign: 'center', lineHeight: 1.5,
                minHeight: 36, display: 'flex', alignItems: 'center', padding: '0 8px',
              }}>
                &ldquo;{transcribedText || activeLangObj.hint}&rdquo;
              </p>

              {isProcessingSTT && (
                <div className="flex items-center gap-1.5" style={{ color: TOKEN.emeraldLo, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Verifying with Sarvam AI &amp; Groq…</span>
                </div>
              )}

              {micError && (
                <div className="flex items-center gap-1.5" style={{ color: '#f87171', fontSize: 11, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  <span>{micError}</span>
                </div>
              )}

              {/* Pill mic button */}
              <button
                type="button"
                onClick={toggleRecording}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '11px 20px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  border: 'none',
                  background: isRecording ? 'rgba(239,68,68,0.15)' : TOKEN.emerald,
                  color: isRecording ? '#f87171' : '#fff',
                  boxShadow: isRecording ? '0 0 0 2px rgba(239,68,68,0.3)' : `0 0 0 3px rgba(16,185,129,0.2), 0 4px 16px rgba(16,185,129,0.3)`,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => { if (!isRecording) e.currentTarget.style.boxShadow = `0 0 0 4px rgba(16,185,129,0.28), 0 6px 20px rgba(16,185,129,0.36)` }}
                onMouseLeave={e => { if (!isRecording) e.currentTarget.style.boxShadow = `0 0 0 3px rgba(16,185,129,0.2), 0 4px 16px rgba(16,185,129,0.3)` }}
              >
                {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                <span>{isRecording ? `Listening — tap to finish` : `Tap to speak in ${activeLangObj.label}`}</span>
              </button>
            </div>

            {/* Parameters — single card with 2×2 hairline grid */}
            <div style={{
              background: TOKEN.surfaceHi,
              borderRadius: TOKEN.r22,
              border: `1px solid ${TOKEN.border}`,
              overflow: 'clip',   /* clip (not hidden) — allows sticky/scroll children but still clips visually */
            }}>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${TOKEN.hairline}` }}>
                {/* Commodity */}
                <div style={{ padding: '14px 16px', borderRight: `1px solid ${TOKEN.hairline}` }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('voice.commodity')}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: TOKEN.emerald, fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
                    {tData('crop', extractedData.crop)}
                  </p>
                </div>
                {/* Volume */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('voice.volume')}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: TOKEN.text, fontFamily: '"Fraunces", serif', lineHeight: 1.2 }}>
                    {extractedData.quantity} {t('common.units.quintals')}
                  </p>
                </div>
              </div>
              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* Origin farm */}
                <div style={{ padding: '14px 16px', borderRight: `1px solid ${TOKEN.hairline}` }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('voice.origin_farm')}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: TOKEN.text, fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
                    {extractedData.location}
                  </p>
                </div>
                {/* Urgency */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('voice.urgency')}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TOKEN.emeraldLo, fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
                    {urgencyLabel}
                  </p>
                </div>
              </div>

              {/* Pinned destination (conditional) — full-width row below the 2x2 grid */}
              {extractedData.targetMandi && (
                <div style={{
                  borderTop: `1px solid rgba(16,185,129,0.2)`,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(16,185,129,0.07)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MapPin size={13} color={TOKEN.emerald} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: TOKEN.muted, fontFamily: 'Inter, sans-serif', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deliver to · Pinned</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TOKEN.emerald, fontFamily: 'Inter, sans-serif', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extractedData.targetMandi}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Example prompts — horizontal scroll row */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: TOKEN.muted, fontFamily: 'Inter, sans-serif' }}>
                  {t('voice.prompt_switcher_label')}
                </span>
                <span style={{ fontSize: 10, fontWeight: 500, color: TOKEN.emeraldLo, fontFamily: 'Inter, sans-serif', opacity: 0.7 }}>
                  Live synced
                </span>
              </div>
              <div
                style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
                className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {samplePhrases.map((phrase, i) => {
                  const active = selectedPreset === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { stopRecording(); setSelectedPreset(i) }}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      style={{
                        flexShrink: 0, whiteSpace: 'nowrap',
                        padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                        fontSize: 12, fontWeight: active ? 600 : 400,
                        fontFamily: 'Inter, sans-serif',
                        color: active ? TOKEN.emerald : TOKEN.muted,
                        background: active ? 'rgba(16,185,129,0.1)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(16,185,129,0.45)' : TOKEN.border}`,
                        transition: 'all 200ms ease',
                      }}
                    >
                      {phrase.lang}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* ── Sticky CTA ───────────────────────────────────────────────────── */}
          <div style={{ padding: '10px 16px 16px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleConfirm}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                width: '100%', padding: '14px 20px', borderRadius: TOKEN.r16,
                cursor: 'pointer', border: 'none',
                background: 'linear-gradient(180deg, #12c88a 0%, #0fa572 100%)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 24px rgba(16,185,129,0.38), 0 1px 0 rgba(255,255,255,0.12) inset',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.48), 0 1px 0 rgba(255,255,255,0.12) inset'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(16,185,129,0.38), 0 1px 0 rgba(255,255,255,0.12) inset'
              }}
            >
              <span>Apply to Sabha Workbench · {extractedData.quantity}q {tData('crop', extractedData.crop)}</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
