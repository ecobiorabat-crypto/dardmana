'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  message?: string
}

/**
 * Page d'erreur élégante réutilisable par les segments (error.tsx).
 * Journalise l'erreur et propose une action « Réessayer ».
 */
export default function RouteError({ error, reset, title, message }: RouteErrorProps) {
  const t = useTranslations()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="font-titre text-5xl text-[var(--vert-fonce)]">{t('Errors.oops')}</p>
      <h1 className="font-titre text-2xl text-[var(--texte)]">
        {title ?? t('Errors.generic')}
      </h1>
      <p className="max-w-md text-sm text-[var(--texte-doux)]">
        {message ?? t('Errors.routeErrorMessage')}
      </p>
      <Button variant="dark" size="md" onClick={reset}>
        {t('Errors.retry')}
      </Button>
    </div>
  )
}
