'use client'

import { Suspense } from 'react'
import { ResultPage } from '@/components/sabha-live'

function DemoResultContent() {
  return <ResultPage id="demo-20260929" />
}

export default function DemoResultPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <DemoResultContent />
    </Suspense>
  )
}
