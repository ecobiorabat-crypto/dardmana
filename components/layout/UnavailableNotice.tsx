'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/ui'

/**
 * Affiche un message discret (toast) quand on arrive sur l'accueil après la
 * redirection d'une page désactivée (?unavailable=1), puis nettoie l'URL.
 */
export function UnavailableNotice() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const showToast = useUiStore((s) => s.showToast)
  const done = useRef(false)

  useEffect(() => {
    if (searchParams.get('unavailable') === '1' && !done.current) {
      done.current = true
      showToast(t('Common.pageUnavailable'), 'info')
      router.replace(pathname)
    }
  }, [searchParams, router, pathname, showToast, t])

  return null
}

export default UnavailableNotice
