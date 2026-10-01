'use client'

import Link from 'next/link'
import { useLocale } from '@/components/locale-provider'
import { Leaf } from 'lucide-react'

export default function NotFound() {
  const { t } = useLocale()
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="flex flex-col items-center max-w-md">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-secondary text-primary shadow-xs">
          <Leaf className="size-10" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">
          {t('common.errors.page_not_found')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('common.errors.generic')}
        </p>
        <Link href="/" className="button-primary mt-7 inline-flex">
          {t('common.actions.back')}
        </Link>
      </div>
    </main>
  )
}
