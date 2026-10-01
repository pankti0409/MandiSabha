'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react'

export default function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(1)
  const [totalFrames, setTotalFrames] = useState(240)
  const [useVideo, setUseVideo] = useState(false)
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([])
  const [isReady, setIsReady] = useState(false)

  // Preload frames for smooth frame-by-frame canvas animation
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const count = isMobile ? 120 : 240
    const prefix = isMobile ? '/scroll-anim/frames-mobile/f_' : '/scroll-anim/frames/f_'
    setTotalFrames(count)

    const imgs: HTMLImageElement[] = new Array(count)
    let loaded = 0

    for (let i = 1; i <= count; i++) {
      const img = new Image()
      const pad = String(i).padStart(4, '0')
      img.src = `${prefix}${pad}.webp`
      img.onload = () => {
        imgs[i - 1] = img
        loaded++
        if (loaded === 5) {
          setIsReady(true)
        }
      }
      img.onerror = () => {
        // Fallback to HTML5 video if frame fails
        setUseVideo(true)
      }
    }
    setLoadedImages(imgs)
  }, [])

  // Auto-playing frame by frame animation loop (at 24fps)
  useEffect(() => {
    if (useVideo) return

    let raf: number
    let lastTime = performance.now()
    const fpsInterval = 1000 / 24

    function tick(now: number) {
      if (!isPlaying) {
        raf = requestAnimationFrame(tick)
        return
      }

      const elapsed = now - lastTime
      if (elapsed > fpsInterval) {
        lastTime = now - (elapsed % fpsInterval)

        setCurrentFrame(prev => {
          const next = prev >= totalFrames ? 1 : prev + 1
          drawFrame(next)
          return next
        })
      }

      raf = requestAnimationFrame(tick)
    }

    function drawFrame(frameIdx: number) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = loadedImages[frameIdx - 1]
      if (img && img.complete && img.naturalWidth > 0) {
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

        const imgRatio = img.naturalWidth / img.naturalHeight
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

        ctx.drawImage(img, offsetX, offsetY, renderW, renderH)
        ctx.restore()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, loadedImages, totalFrames, useVideo])

  function handleSkip() {
    const el = document.getElementById('landing-content')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-[90vh] md:h-screen bg-[#09110D] overflow-hidden flex items-center justify-center border-b border-border/40">
      {/* Background radial atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(27,94,58,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Frame by Frame Canvas or Video Player */}
      {useVideo ? (
        <video
          ref={videoRef}
          src="/scroll-anim/farmer_weighing_soybeans.mp4"
          poster="/scroll-anim/poster.webp"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none"
        />
      )}

      {/* Dark editorial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(9,17,13,0.4) 0%, transparent 50%, rgba(9,17,13,0.85) 100%)',
        }}
      />

      {/* Top Header Tag */}
      <div className="absolute top-6 left-6 sm:left-10 z-20 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#E9D8A6]">
          <Sparkles className="size-3.5" /> Mandi Sabha · Harvest Journey Animation
        </span>
      </div>

      {/* Bottom Controls & Skip to Landing Page */}
      <div className="absolute bottom-8 inset-x-6 sm:inset-x-12 z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Play / Pause / Replay buttons */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl text-xs text-white">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 font-semibold hover:text-[#4FD18B] transition-colors"
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="text-white/30">|</span>
          <span className="font-mono text-white/80">
            Frame {currentFrame} / {totalFrames}
          </span>
        </div>

        {/* Skip to Landing Page Button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 bg-[#1B5E3A] hover:bg-[#144A2E] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl transition-all hover:scale-105"
        >
          <span>Enter Mandi Sabha</span>
          <ArrowDown className="size-4 animate-bounce" />
        </button>
      </div>
    </div>
  )
}
