'use client'
import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { SabhaLive } from '@/components/sabha-live'

function SabhaPageContent() {
  const { id } = useParams<{ id: string }>()
  return <SabhaLive id={id} />
}

export default function SabhaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <SabhaPageContent />
    </Suspense>
  )
}
