'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, Sparkles, Play, Pause, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollVideoProps {
  onGetStarted?: () => void
  onSeeHowItWorks?: () => void
}

const STAGES = [
  {
    id: 1,
    tag: '01 / Farmgate Dilemma',
    railLabel: 'The Dilemma',
    titlePrefix: 'Where should I ',
    titleAccent: 'sell?',
    description:
      'Multiple APMC mandis within driving distance quote different prices each morning. But driving to the highest quote without factoring freight, gate queues, and dock deductions can wipe out an entire season’s profit.',
    chips: [
      { label: 'Dewas Mandi', style: 'bg-black/60 border-white/30 text-white' },
      { label: 'Indore Mandi', style: 'bg-black/60 border-white/30 text-white' },
      { label: 'Neemuch Mandi', style: 'bg-black/60 border-white/30 text-white' },
    ],
  },
  {
    id: 2,
    tag: '02 / The Cost Anatomy',
    railLabel: 'Hidden Costs',
    titlePrefix: 'Every mandi pays ',
    titleAccent: 'differently.',
    description:
      'A ₹80/quintal premium 150 km away is deceptive. Once you subtract round-trip diesel, overnight unloading delays, driver layover costs, and dock moisture cuts, that premium turns into a net loss.',
    chips: [
      { label: 'Distance diesel: up to ₹9,600', style: 'bg-red-950/80 border-red-400/60 text-red-200' },
      { label: 'Dock queues: 8 to 14 hrs', style: 'bg-amber-950/80 border-amber-400/60 text-amber-200' },
    ],
  },
  {
    id: 3,
    tag: '03 / Autonomous Reasoning',
    railLabel: 'Agent Consensus',
    titlePrefix: 'Let the ',
    titleAccent: 'agents decide.',
    description:
      'Six focused AI agents run inside your browser. They simulate the routes, compare gate queues, verify moisture deductions, and debate in plain view to protect your net take-home cash.',
    chips: [
      { label: 'Market', style: 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200' },
      { label: 'Weather', style: 'bg-sky-950/80 border-sky-400/50 text-sky-200' },
      { label: 'Logistics', style: 'bg-amber-950/80 border-amber-400/50 text-amber-200' },
      { label: 'Negotiator', style: 'bg-orange-950/80 border-orange-400/50 text-orange-200' },
      { label: 'Advisor', style: 'bg-teal-900/90 border-teal-300/70 text-white font-bold' },
    ],
  },
] as const

export function ScrollVideo({ onGetStarted, onSeeHowItWorks }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPausedByUser, setIsPausedByUser] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Auto-advance stage every 7 seconds if not paused
  useEffect(() => {
    if (isPausedByUser) return
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)))
    }, 7000)
    return () => clearInterval(interval)
  }, [isPausedByUser, activeStage])

  // Ensure video is playing continuously
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.play().catch(() => {
        // Autoplay policy fallback: muted is set so should normally succeed
      })
    }
  }, [])

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  function togglePlayPause() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
      setIsPausedByUser(false)
    } else {
      video.pause()
      setIsPlaying(false)
      setIsPausedByUser(true)
    }
  }

  return (
    <section
      id="scroll-video-hero"
      className="relative w-full min-h-[92vh] lg:min-h-screen bg-[#030d08] flex items-center justify-center overflow-hidden border-b border-white/10 select-none"
      aria-label="Mandi video introduction"
    >
      {/* ── Background Continuous Video Player ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/scroll-anim/poster.webp"
        onLoadedData={() => setVideoLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 brightness-[0.72] contrast-[1.08]"
      >
        <source src="/scroll-anim/farmer_weighing_soybeans.mp4" type="video/mp4" />
      </video>

      {/* ── Directional Vignette & Atmospheric Film Overlays ── */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-[#030d08] via-transparent to-[#030d08]/80" />
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(3,13,8,0.3)_0%,rgba(3,13,8,0.78)_100%)]" />

      {/* ── Video Playback Indicator / Controls in Top Right ── */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayPause}
          style={{ color: '#ffffff' }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-lg"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span style={{ color: '#ffffff' }}>Playing Live</span>
              <Pause className="size-3 text-white/80 ml-1" />
            </>
          ) : (
            <>
              <Play className="size-3 text-amber-400 fill-amber-400" />
              <span style={{ color: '#ffffff' }}>Paused</span>
            </>
          )}
        </button>
      </div>

      {/* ── 01 / 02 / 03 Interactive Stage Rail on the Right ── */}
      <aside className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-6 font-mono text-xs font-bold text-white/50">
        {STAGES.map((s) => {
          const isActive = activeStage === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveStage(s.id as 1 | 2 | 3)
                setIsPausedByUser(true)
              }}
              className={cn(
                'group flex items-center gap-3 text-left transition-all cursor-pointer p-1 rounded-md',
                isActive ? 'text-amber-400 scale-105 font-extrabold' : 'text-white/70 hover:text-white'
              )}
            >
              <span className={cn('text-sm font-bold font-mono', isActive ? 'text-amber-400' : 'text-white/60')}>
                0{s.id}
              </span>
              <div
                className={cn(
                  'h-[2px] rounded-full transition-all duration-300',
                  isActive ? 'w-12 bg-amber-400' : 'w-5 bg-white/30 group-hover:bg-white/60'
                )}
              />
              <span
                style={{ color: isActive ? '#fbbf24' : '#e2e8f0' }}
                className="font-sans text-xs font-semibold tracking-wide drop-shadow"
              >
                {s.railLabel}
              </span>
            </button>
          )
        })}
      </aside>

      {/* ── Dynamic Text Overlays for 3 Stages ── */}
      <div className="relative z-30 max-w-4xl w-full mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center justify-center">
        {STAGES.map((s) => {
          const isActive = activeStage === s.id
          return (
            <article
              key={s.id}
              className={cn(
                'transition-all duration-700 ease-out max-w-3xl flex flex-col items-center',
                isActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none absolute'
              )}
            >
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/35 mb-6 backdrop-blur-md shadow-lg">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>{s.tag}</span>
              </div>

              {/* Main Stage Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-white tracking-tight leading-[1.08] mb-5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                {s.titlePrefix}
                <span className="text-amber-400 italic font-serif underline decoration-amber-400/40 underline-offset-8">
                  {s.titleAccent}
                </span>
              </h1>

              {/* Stage Description */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-100 leading-relaxed max-w-2xl mx-auto mb-8 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] font-medium">
                {s.description}
              </p>

              {/* Contextual Chips with High Contrast & Rich Colors */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
                {s.chips.map((chip) => (
                  <span
                    key={chip.label}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-bold backdrop-blur-md border shadow-md transition-all',
                      chip.style
                    )}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* Action Buttons with High-Contrast Text & Luminous Aesthetics */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('landing-hero')}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-extrabold text-[#0e1711] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_28px_rgba(245,158,11,0.5)] hover:shadow-[0_0_38px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
                >
                  <span className="font-extrabold tracking-tight text-[#0e1711]">Enter Mandi Sabha</span>
                  <ArrowDown className="size-4 text-[#0e1711] animate-bounce" />
                </button>
                <a
                  href="/signup"
                  style={{ color: '#ffffff' }}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full font-bold text-white bg-emerald-600/30 hover:bg-emerald-600/45 border-2 border-emerald-400/70 hover:border-emerald-300 backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:shadow-[0_0_32px_rgba(16,185,129,0.5)]"
                >
                  <span style={{ color: '#ffffff' }} className="text-white font-bold tracking-wide">
                    Start Free Sabha
                  </span>
                  <ChevronRight className="size-4 text-emerald-300" />
                </a>
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Stage Quick Dots for Mobile / Bottom Navigation ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveStage(s.id as 1 | 2 | 3)
              setIsPausedByUser(true)
            }}
            className={cn(
              'transition-all cursor-pointer rounded-full',
              activeStage === s.id ? 'w-6 h-2 bg-amber-400' : 'w-2 h-2 bg-white/40 hover:bg-white/80'
            )}
            aria-label={`Go to stage ${s.id}`}
          />
        ))}
      </div>
    </section>
  )
}

export default ScrollVideo
