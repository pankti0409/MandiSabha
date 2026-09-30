'use client'
import { useParams } from 'next/navigation'
import { ResultPage } from '@/components/sabha-live'
export default function ResultRoute() { const { id } = useParams<{ id: string }>(); return <ResultPage id={id} /> }
