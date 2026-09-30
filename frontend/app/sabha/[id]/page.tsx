'use client'
import { useParams } from 'next/navigation'
import { SabhaLive } from '@/components/sabha-live'
export default function SabhaPage() { const { id } = useParams<{ id: string }>(); return <SabhaLive id={id} /> }
