'use client'

import Link from 'next/link'
import { useLocale } from '@/components/locale-provider'
import { AlertCircle } from 'lucide-react'

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLocale()
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="flex flex-col items-center max-w-md">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertCircle className="size-10" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">
          {t('common.errors.server_error')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('common.errors.generic')}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <button className="button-primary" onClick={() => reset()}>
            {t('common.actions.retry')}
          </button>
          <Link href="/" className="button-secondary">
            {t('common.actions.back')}
          </Link>
        </div>
      </div>
    </main>
  )
}
