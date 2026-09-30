'use client'

import { useState, useEffect } from 'react'
import { Mic, X, Sparkles, Check, Volume2, ArrowRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (data: { crop: string; quantity: number; location: string; urgency: 'today' | 'soon' | 'week' }) => void
}

const samplePhrases = [
  { text: 'Nashik se 20 quintal pyaaz Surat mandi bhejna hai aaj', crop: 'Onion', quantity: 20, location: 'Nashik, Maharashtra', urgency: 'today' as const, lang: 'हिन्दी' },
  { text: 'સુરત માર્કેટમાં 35 ક્વિન્ટલ ઘઉં વેચવા છે', crop: 'Wheat', quantity: 35, location: 'Navsari, Gujarat', urgency: 'soon' as const, lang: 'ગુજરાતી' },
  { text: 'Send 15 quintals of hybrid tomatoes to Ahmedabad tomorrow', crop: 'Tomato', quantity: 15, location: 'Pune, Maharashtra', urgency: 'soon' as const, lang: 'English' },
  { text: 'Indore mandi me 25 quintal Soybean ka bhav batao', crop: 'Soybean', quantity: 25, location: 'Ujjain, Madhya Pradesh', urgency: 'today' as const, lang: 'हिन्दी' },
]

export function VoiceAssistantModal({ isOpen, onClose, onApply }: VoiceAssistantModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [transcribedText, setTranscribedText] = useState('')
  const [analyzed, setAnalyzed] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsListening(true)
      setAnalyzed(false)
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
          setIsListening(false)
          setAnalyzed(true)
        }
      }, 40)

      return () => clearInterval(interval)
    }
  }, [isOpen, selectedPreset])

  if (!isOpen) return null

  const currentPreset = samplePhrases[selectedPreset]

  function handleConfirm() {
    onApply({
      crop: currentPreset.crop,
      quantity: currentPreset.quantity,
      location: currentPreset.location,
      urgency: currentPreset.urgency,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 grid size-9 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Mic className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="section-kicker">AI Voice Assistant</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                <Radio className="size-3" /> Voice AI Active
              </span>
            </div>
            <h3 className="font-display text-2xl font-extrabold text-foreground">
              Speak Your Harvest Details
            </h3>
          </div>
        </div>

        {/* Live Soundwave Audio Visualizer */}
        <div className="rounded-2xl border border-border bg-background/80 p-5 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 h-10 text-primary">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <span
                key={i}
                className="wave-bar !w-1 !bg-primary"
                style={{
                  animationDuration: `${0.8 + (i % 4) * 0.2}s`,
                  opacity: isListening ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Real-time Transcription Stream */}
          <div className="text-center min-h-[50px] flex items-center justify-center px-4">
            <p className="font-display text-base font-semibold text-foreground italic">
              &ldquo;{transcribedText || 'Listening for speech in Hindi, Gujarati or English…'}&rdquo;
            </p>
          </div>
        </div>

        {/* Extracted Parameters Card */}
        {analyzed && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-primary">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-accent" /> AI Understood Parameters:
              </span>
              <span className="font-mono">100% Match</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px]">Commodity</span>
                <strong className="font-bold text-foreground text-sm">{currentPreset.crop}</strong>
              </div>
              <div className="rounded-xl border border-border bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px]">Volume</span>
                <strong className="font-bold text-foreground text-sm font-mono">{currentPreset.quantity} Quintals</strong>
              </div>
              <div className="rounded-xl border border-border bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px]">Origin Farm</span>
                <strong className="font-bold text-foreground truncate block">{currentPreset.location}</strong>
              </div>
              <div className="rounded-xl border border-border bg-card p-2.5">
                <span className="text-muted-foreground block text-[10px]">Urgency</span>
                <strong className="font-bold text-primary capitalize">{currentPreset.urgency}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sample Voice Prompts Switcher */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground">Try a different spoken prompt:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePhrases.map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPreset(i)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                  selectedPreset === i
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{phrase.lang}</span>: {phrase.crop} ({phrase.quantity}q)
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="button-primary !min-h-[48px] flex-1 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02]"
          >
            <span>Apply to Sabha Workbench</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
