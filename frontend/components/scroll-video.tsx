'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DESKTOP_FRAMES = 240
const MOBILE_FRAMES  = 120
const SCROLL_HEIGHT  = '600vh'
const LERP           = 0.10

const CHAPTERS = [
  {
    id: 1,
    start: 0,
    end: 0.32,
    eyebrow: 'Your crop',
    headline: 'Deserves the best mandi.',
  },
  {
    id: 2,
    start: 0.32,
    end: 0.64,
    eyebrow: 'Hidden costs kill profits',
    headline: 'Know your real net price.',
  },
  {
    id: 3,
    start: 0.64,
    end: 1,
    eyebrow: 'AI-powered intelligence',
    headline: 'Six agents. One answer.',
  },
] as const

type ChapterId = 1 | 2 | 3

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)) }

function drawCover(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !img.complete || img.naturalWidth === 0) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width  = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const ir = img.naturalWidth / img.naturalHeight
  const cr = w / h
  let rw = w, rh = h, ox = 0, oy = 0
  if (cr > ir) { rh = w / ir; oy = (h - rh) / 2 }
  else         { rw = h * ir; ox = (w - rw) / 2 }

  ctx.drawImage(img, ox, oy, rw, rh)
  ctx.restore()
}

export function ScrollVideo() {
  const stickyRef    = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const animRef      = useRef<number | null>(null)
  const imagesRef    = useRef<HTMLImageElement[]>([])
  const lastPct      = useRef(-1)
  const lastFrame    = useRef(-1)
  const lerpFrameRef = useRef(0)

  const [activeChapter, setActiveChapter] = useState<ChapterId>(1)
  const [scrollPct,     setScrollPct]     = useState(0)
  const [loadedCount,   setLoadedCount]   = useState(0)
  const [totalFrames,   setTotalFrames]   = useState(DESKTOP_FRAMES)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const count    = isMobile ? MOBILE_FRAMES : DESKTOP_FRAMES
    const prefix   = isMobile ? '/scroll-anim/frames-mobile/f_' : '/scroll-anim/frames/f_'
    setTotalFrames(count)

    const imgs: HTMLImageElement[] = new Array(count)
    imagesRef.current = imgs
    let loaded = 0

    for (let i = 1; i <= count; i++) {
      const img = new Image()
      img.src      = `${prefix}${String(i).padStart(4, '0')}.webp`
      img.decoding = 'async'
      const idx    = i - 1
      img.onload   = () => {
        imgs[idx] = img
        loaded++
        setLoadedCount(loaded)
        if (idx === 0 && canvasRef.current) drawCover(canvasRef.current, img)
      }
      imgs[idx] = img
    }
  }, [])

  const onFrame = useCallback(() => {
    const el = stickyRef.current
    if (!el) { animRef.current = requestAnimationFrame(onFrame); return }

    const rect        = el.getBoundingClientRect()
    const totalScroll = el.offsetHeight - window.innerHeight
    const pct         = clamp(-rect.top / Math.max(totalScroll, 1))

    const targetFrame = clamp(pct * (totalFrames - 1), 0, totalFrames - 1)
    lerpFrameRef.current += (targetFrame - lerpFrameRef.current) * LERP
    const displayFrame = Math.round(lerpFrameRef.current)

    if (Math.abs(pct - lastPct.current) > 0.0003) {
      lastPct.current = pct
      setScrollPct(pct)
      const ch = CHAPTERS.find(c => pct >= c.start && pct < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
      setActiveChapter(ch.id as ChapterId)
    }

    if (displayFrame !== lastFrame.current) {
      lastFrame.current = displayFrame
      const img    = imagesRef.current[displayFrame]
      const canvas = canvasRef.current
      if (canvas && img && img.complete && img.naturalWidth > 0) drawCover(canvas, img)
    }

    animRef.current = requestAnimationFrame(onFrame)
  }, [totalFrames])

  useEffect(() => {
    animRef.current = requestAnimationFrame(onFrame)
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current) }
  }, [onFrame])

  useEffect(() => {
    function onResize() {
      const img = imagesRef.current[Math.max(lastFrame.current, 0)]
      if (canvasRef.current && img) drawCover(canvasRef.current, img)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function scrollToContent() {
    document.getElementById('landing-hero')?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadPct = Math.round((loadedCount / totalFrames) * 100)
  const isReady = loadedCount >= 1

  return (
    <div ref={stickyRef} style={{ height: SCROLL_HEIGHT }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#020b04]">

        {/* ── Canvas: full-screen, bright ─────────────────────────────────── */}
        <canvas
          ref={canvasRef}
          className={cn(
            'absolute inset-0 w-full h-full z-10 select-none transition-opacity duration-500',
            isReady ? 'opacity-100' : 'opacity-0'
          )}
          style={{ filter: 'brightness(1.15) contrast(1.05) saturate(1.1)' }}
        />

        {/* Loading state */}
        {!isReady && (
          <div className="absolute inset-0 z-10 bg-[#020b04] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: 'url(/scroll-anim/poster.webp)' }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-36 h-0.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                  style={{ width: `${loadPct}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/30 tracking-[0.2em]">
                {loadPct}%
              </p>
            </div>
          </div>
        )}

        {/* ── Bottom scrim — darkens lower third so text is legible ─ */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(2,11,4,0.88) 0%, rgba(2,11,4,0.65) 35%, rgba(2,11,4,0.25) 60%, transparent 80%)',
          }}
        />

        {/* ── Scroll progress bar ─────────────────────────────────────────── */}
        <div className="absolute top-0 inset-x-0 h-[2px] z-50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-[width] duration-75"
            style={{ width: `${scrollPct * 100}%` }}
          />
        </div>

        {/* ── Text: centered, lower-third, cinematic card ─────────────────── */}
        {/* Positioned at 68% from top = sits in the lower third of the frame
            but still comfortably readable. No overlay blocking the top 2/3. */}
        <div className="absolute inset-x-0 z-30" style={{ top: '62%' }}>
          <div className="flex flex-col items-center text-center px-6">

            {/* Frosted pill: backdrop behind text ONLY, not the whole screen */}
            <div className="rounded-2xl px-8 py-6 backdrop-blur-md
              bg-black/60 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">

              {/* Chapter text stack */}
              <div className="relative" style={{ minHeight: '4rem' }}>
                {CHAPTERS.map(s => {
                  const isActive = activeChapter === s.id
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        'transition-all duration-500 ease-out',
                        isActive
                          ? 'opacity-100 translate-y-0 relative'
                          : 'opacity-0 translate-y-2 absolute inset-0 pointer-events-none'
                      )}
                    >
                      <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-emerald-400 mb-2">
                        {s.eyebrow}
                      </p>
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-white leading-snug">
                        {s.headline}
                      </h1>
                    </div>
                  )
                })}
              </div>

              {/* CTA row — always visible, changes on last chapter */}
              <div className="mt-5 flex items-center justify-center gap-3">
                {activeChapter < 3 ? (
                  // Scroll hint for ch 1 & 2
                  <div className="flex items-center gap-2 text-white/40 text-xs font-semibold tracking-widest uppercase">
                    <ArrowDown className="size-3.5 animate-bounce text-emerald-400" />
                    <span>Keep scrolling</span>
                  </div>
                ) : (
                  // Final CTA
                  <>
                    <button
                      type="button"
                      onClick={scrollToContent}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold
                        bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.5)]
                        hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Enter Mandi Sabha
                      <ArrowDown className="size-3.5 animate-bounce" />
                    </button>
                    <a
                      href="/signup"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold
                        border border-white/25 bg-white/10 text-white hover:bg-white/20
                        hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Start free
                      <ChevronRight className="size-3.5" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Chapter dots — below the pill */}
            <div className="flex items-center gap-2 mt-4">
              {CHAPTERS.map(s => (
                <div
                  key={s.id}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    activeChapter === s.id
                      ? 'w-5 h-1.5 bg-emerald-400'
                      : 'w-1.5 h-1.5 bg-white/30'
                  )}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default ScrollVideo
