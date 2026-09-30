'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Check, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

export const SUBJECT_OPACITY = 1.0
export const BACKDROP_OPACITY = 0.9
export const BLEND_MODE_LIGHT = 'normal'
export const BLEND_MODE_DARK = 'screen'
export const EDGE_MASK = 'radial-gradient(ellipse 95% 85% at center, black 65%, transparent 100%)'

type FrameManifest = {
  desktop: { count: number; prefix: string; digits: number; extension: string }
  mobile: { count: number; prefix: string; digits: number; extension: string }
  poster: string
}

const MANIFEST: FrameManifest = {
  desktop: {
    count: 240,
    prefix: '/scroll-anim/frames/f_',
    digits: 4,
    extension: '.webp',
  },
  mobile: {
    count: 120,
    prefix: '/scroll-anim/frames-mobile/f_',
    digits: 4,
    extension: '.webp',
  },
  poster: '/scroll-anim/poster.webp',
}

export default function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { language } = useLocale()

  const [scrollProgress, setScrollProgress] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Language texts for the 3 stages
  const content = useMemo(() => {
    switch (language) {
      case 'hi':
        return {
          tag: 'स्मार्ट मंडी नेविगेशन',
          stage1: {
            num: '01',
            label: 'फसल का मोल',
            title: 'क्या स्थानीय व्यापारी सही दाम दे रहा है?',
            desc: 'खेत पर २० क्विंटल सोयाबीन। पास की मंडी ₹१,६२० दे रही है, पर सूरत में ₹२,१४० का भाव है।',
          },
          stage2: {
            num: '02',
            label: 'भाड़ा और जोखिम',
            title: 'दूरी, डीजल और मौसम का हिसाब',
            desc: '२३६ किमी का रास्ता, ₹६,२०० भाड़ा। ६ एआई एजेंट एक साथ हर पहलू की जांच करते हैं।',
          },
          stage3: {
            num: '03',
            label: 'सर्वश्रेष्ठ निर्णय',
            title: 'सूरत मंडी: +₹८,२०० ज्यादा मुनाफा',
            desc: 'पूरा भाड़ा काटकर भी आपकी जेब में बचते हैं हजारों रुपये अतिरिक्त।',
          },
        }
      case 'gu':
        return {
          tag: 'સ્માર્ટ મંડી નેવિગેશન',
          stage1: {
            num: '01',
            label: 'પાકનું મૂલ્ય',
            title: 'શું સ્થાનિક વેપારી સાચો ભાવ આપે છે?',
            desc: 'ખેતરમાં ૨૦ ક્વિન્ટલ ઉપજ. નજીકની મંડી ₹૧,૬૨૦ આપે છે, પરંતુ સુરતમાં ₹૨,૧૪૦ નો ભાવ છે.',
          },
          stage2: {
            num: '02',
            label: 'ભાડું અને જોખમ',
            title: 'અંતર, ડીઝલ અને હવામાનની ગણતરી',
            desc: '૨૩૬ કિમીનો રસ્તો, ₹૬,૨૦૦ ભાડું. ૬ AI એજન્ટો એક સાથે દરેક બાબત તપાસે છે.',
          },
          stage3: {
            num: '03',
            label: 'શ્રેષ્ઠ નિર્ણય',
            title: 'સુરત મંડી: +₹૮,૨૦૦ વધુ ચોખ્ખો નફો',
            desc: 'તમામ ભાડું બાદ કર્યા પછી પણ ખેડૂતને મળે છે સૌથી વધુ ફાયદો.',
          },
        }
      default:
        return {
          tag: 'Smart Mandi Route Intelligence',
          stage1: {
            num: '01',
            label: 'The Dilemma',
            title: 'Is your local broker offering fair value?',
            desc: '20 quintals weighed on the farm. Local APMC offers ₹1,620/q, but Surat bids ₹2,140/q.',
          },
          stage2: {
            num: '02',
            label: 'Hidden Costs',
            title: 'Accounting for diesel, tolls & weather',
            desc: '236 km transport distance. Six AI agents simultaneously verify route safety and freight math.',
          },
          stage3: {
            num: '03',
            label: 'Agent Consensus',
            title: 'Surat APMC: +₹8,200 extra take-home',
            desc: 'Full travel costs deducted. Lock in verified buyer commitments with zero guesswork.',
          },
        }
    }
  }, [language])

  useEffect(() => {
    const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mqlMotion.matches)
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mqlMotion.addEventListener('change', handleMotionChange)

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })

    return () => {
      mqlMotion.removeEventListener('change', handleMotionChange)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    if (isReducedMotion) return

    const config = isMobile ? MANIFEST.mobile : MANIFEST.desktop
    const totalFrames = config.count
    const images: HTMLImageElement[] = new Array(totalFrames)
    const loaded = new Set<number>()

    let isSubscribed = true
    let rafId: number
    let currentFrame = 1
    let targetFrame = 1

    function getFrameUrl(index: number) {
      const pad = String(index).padStart(config.digits, '0')
      return `${config.prefix}${pad}${config.extension}`
    }

    // Preload initial critical frames
    const initialBatch = Math.min(30, totalFrames)
    for (let i = 1; i <= initialBatch; i++) {
      const img = new Image()
      img.src = getFrameUrl(i)
      img.onload = () => {
        if (!isSubscribed) return
        images[i - 1] = img
        loaded.add(i)
        setLoadedCount(loaded.size)
        if (loaded.size >= 6) setIsReady(true)
      }
    }

    // Lazy background load remaining frames
    const bgTimer = setTimeout(() => {
      for (let i = initialBatch + 1; i <= totalFrames; i++) {
        const img = new Image()
        img.src = getFrameUrl(i)
        img.onload = () => {
          if (!isSubscribed) return
          images[i - 1] = img
          loaded.add(i)
          setLoadedCount(loaded.size)
        }
      }
    }, 300)

    // Render Canvas Loop
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })

    function render() {
      if (!ctx || !canvas) return

      // Smooth Lerp scrubbing
      currentFrame += (targetFrame - currentFrame) * 0.12
      const frameIdx = Math.max(1, Math.min(totalFrames, Math.round(currentFrame)))

      // Nearest loaded frame fallback
      let imgToDraw = images[frameIdx - 1]
      if (!imgToDraw || !imgToDraw.complete) {
        for (let offset = 1; offset < 25; offset++) {
          if (images[frameIdx - 1 - offset]?.complete) {
            imgToDraw = images[frameIdx - 1 - offset]
            break
          }
          if (images[frameIdx - 1 + offset]?.complete) {
            imgToDraw = images[frameIdx - 1 + offset]
            break
          }
        }
      }

      if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr
          canvas.height = height * dpr
        }

        ctx.save()
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, width, height)

        // Cover fit canvas
        const imgRatio = imgToDraw.naturalWidth / imgToDraw.naturalHeight
        const canvasRatio = width / height
        let renderW = width
        let renderH = height
        let offsetX = 0
        let offsetY = 0

        if (canvasRatio > imgRatio) {
          renderH = width / imgRatio
          offsetY = (height - renderH) / 2
        } else {
          renderW = height * imgRatio
          offsetX = (width - renderW) / 2
        }

        ctx.globalAlpha = SUBJECT_OPACITY
        ctx.drawImage(imgToDraw, offsetX, offsetY, renderW, renderH)
        ctx.restore()
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    function handleScroll() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalScrollable = rect.height - window.innerHeight
      if (totalScrollable <= 0) return

      const progress = Math.max(0, Math.min(1, -rect.top / totalScrollable))
      setScrollProgress(progress)
      targetFrame = 1 + progress * (totalFrames - 1)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      isSubscribed = false
      clearTimeout(bgTimer)
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isReducedMotion, isMobile])

  // Reduced motion static view
  if (isReducedMotion) {
    return (
      <section className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm text-center">
          <span className="section-kicker">{content.tag}</span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{content.stage3.title}</h2>
          <p className="mt-3 max-w-xl mx-auto text-muted-foreground">{content.stage3.desc}</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <img src={MANIFEST.poster} alt="Farmer weighing harvest" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>
    )
  }

  const activeStage = scrollProgress < 0.35 ? 1 : scrollProgress < 0.7 ? 2 : 3

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[300vh] bg-[#09110D] text-white overflow-visible"
      aria-label="Interactive farm to mandi transformation animation"
    >
      {/* Sticky Canvas Stage (h-dvh) */}
      <div className="sticky top-0 h-dvh w-full overflow-hidden flex items-center justify-center">
        {/* Deep Atmospheric Backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 40%, rgba(27,94,58,0.35) 0%, transparent 60%), radial-gradient(circle at 75% 65%, rgba(240,162,28,0.2) 0%, transparent 60%)',
          }}
        />

        {/* Canvas Display */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            WebkitMaskImage: EDGE_MASK,
            maskImage: EDGE_MASK,
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover select-none pointer-events-none"
            aria-hidden="true"
          />

          {/* Initial Loading Poster */}
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#09110D]/90 z-20">
              <div className="flex flex-col items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary font-bold text-lg animate-pulse">
                  🌾
                </span>
                <span className="text-xs font-mono text-white/70">
                  Preparing visual mandi journey… ({loadedCount})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Editorial Left-Aligned Directional Scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(9,17,13,0.92) 0%, rgba(9,17,13,0.7) 35%, rgba(9,17,13,0.1) 70%, transparent 100%)',
          }}
        />

        {/* ── Overlay Content ────────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-[1500px] mx-auto w-full z-10">
          {/* Top Tag & Progress */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-wheat shadow-sm">
              <Sparkles className="size-3.5" /> {content.tag}
            </span>

            {/* Scroll Hint */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md px-3.5 py-1 text-xs font-mono text-white/80">
              <span>Scroll down to explore</span>
              <ArrowDown className="size-3 text-wheat animate-bounce" />
            </div>
          </div>

          {/* Left Text Narrative (Stage 1 / 2 / 3) */}
          <div className="relative max-w-lg pb-12">
            {/* Stage 1: The Dilemma */}
            <div
              className={`transition-all duration-500 ${
                activeStage === 1
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none absolute inset-0'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-wheat block mb-1">
                {content.stage1.num} · {content.stage1.label}
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight text-white">
                {content.stage1.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                {content.stage1.desc}
              </p>
            </div>

            {/* Stage 2: Hidden Costs */}
            <div
              className={`transition-all duration-500 ${
                activeStage === 2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none absolute inset-0'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-wheat block mb-1">
                {content.stage2.num} · {content.stage2.label}
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight text-white">
                {content.stage2.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                {content.stage2.desc}
              </p>
            </div>

            {/* Stage 3: Consensus */}
            <div
              className={`transition-all duration-500 ${
                activeStage === 3
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none absolute inset-0'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                {content.stage3.num} · {content.stage3.label}
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight text-white">
                {content.stage3.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                {content.stage3.desc}
              </p>

              <div className="mt-5 pointer-events-auto flex items-center gap-3">
                <Link href="/signup" className="button-primary text-xs font-bold">
                  Start Your Sabha <ArrowRight className="size-3.5 ml-1" />
                </Link>
                <a href="#landing-start" className="button-secondary text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                  Continue Reading ↓
                </a>
              </div>
            </div>
          </div>

          {/* Right Floating Progress Rail (01 / 02 / 03) */}
          <aside className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6" aria-hidden="true">
            {[
              { num: '01', label: content.stage1.label, active: activeStage === 1 },
              { num: '02', label: content.stage2.label, active: activeStage === 2 },
              { num: '03', label: content.stage3.label, active: activeStage === 3 },
            ].map(r => (
              <div key={r.num} className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs font-bold transition-colors ${
                    r.active ? 'text-wheat' : 'text-white/40'
                  }`}
                >
                  {r.num}
                </span>
                <div
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    r.active ? 'w-10 bg-wheat' : 'w-4 bg-white/20'
                  }`}
                />
                <span
                  className={`text-xs font-semibold transition-colors ${
                    r.active ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {r.label}
                </span>
              </div>
            ))}
          </aside>

          {/* Bottom Rail */}
          <div className="w-full flex items-center justify-between text-xs text-white/60 border-t border-white/15 pt-3">
            <span>Scroll Scrubbing Experience</span>
            <span className="font-mono text-wheat font-bold">{Math.round(scrollProgress * 100)}%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
