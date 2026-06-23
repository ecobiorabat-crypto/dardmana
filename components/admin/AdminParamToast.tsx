'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Affiche un toast de succès lorsqu'un paramètre de requête est présent
 * (ex. ?created=1), puis nettoie l'URL. Auto-disparition après 4 s.
 * Self-contained : ne dépend pas du store Toast global (absent côté admin).
 */
export function AdminParamToast({ param, message }: { param: string; message: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get(param) !== '1') return
    setVisible(true)
    router.replace(pathname)
    const timer = window.setTimeout(() => setVisible(false), 4000)
    return () => window.clearTimeout(timer)
  }, [searchParams, param, pathname, router])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-[var(--succes)]/40 bg-[var(--blanc)] px-4 py-3 text-sm text-[var(--succes)] shadow-[0_12px_30px_-12px_rgba(20,19,15,0.4)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  )
}

export default AdminParamToast
