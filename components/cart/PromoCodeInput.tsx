'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { useHydrated } from '@/components/layout/hooks'
import { formatMad } from '@/lib/utils/price'

/**
 * Saisie de code promo (panier). Applique via POST /api/promo, stocke le résultat
 * dans le store cart (appliedPromo) pour transmission au checkout.
 *
 * Hydratation : le champ est TOUJOURS rendu (visible immédiatement, SSR + client),
 * donc l'onClick est rattaché dès l'hydratation. L'encart « appliqué » (vert) ne
 * s'affiche qu'après hydratation (`useHydrated`) car appliedPromo vient du store
 * persisté → évite tout mismatch SSR↔client (qui cassait l'hydratation et rendait
 * le bouton inopérant / le composant invisible).
 */
export function PromoCodeInput({ subtotal }: { subtotal: number }) {
  const t = useTranslations('Cart')
  const hydrated = useHydrated()
  const appliedPromo = useCartStore((s) => s.appliedPromo)
  const setPromo = useCartStore((s) => s.setPromo)
  const clearPromo = useCartStore((s) => s.clearPromo)

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const apply = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromo({
          code: trimmed.toUpperCase(),
          discount: data.discount ?? 0,
          type: data.type,
          message: data.message,
        })
        setCode('')
      } else {
        clearPromo()
        setError(data.message ?? t('promoInvalid'))
      }
    } catch {
      setError(t('promoInvalid'))
    } finally {
      setLoading(false)
    }
  }

  const remove = () => {
    clearPromo()
    setError(null)
    setCode('')
  }

  // Encart « appliqué » uniquement après hydratation (état persisté).
  if (hydrated && appliedPromo) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--vert-moyen)]/50 bg-[var(--vert-moyen)]/5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--vert-moyen)]">
            −{formatMad(appliedPromo.discount)} · {appliedPromo.code}
          </p>
          {appliedPromo.message && (
            <p className="truncate text-xs text-[var(--texte-doux)]">{appliedPromo.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={remove}
          className="shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-[var(--erreur)] hover:underline"
        >
          {t('removePromo')}
        </button>
      </div>
    )
  }

  // Champ de saisie — toujours rendu (SSR + client), donc visible et interactif.
  return (
    <div>
      <label htmlFor="promo-code" className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">
        {t('promoCode')}
      </label>
      <div className="flex gap-2">
        <input
          id="promo-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder={t('promoCode')}
          className="h-11 flex-1 rounded-md border border-[var(--bordure)] bg-[var(--blanc)] px-3 text-sm uppercase tracking-wide outline-none transition-colors focus:border-[var(--or-royal)]"
        />
        <button
          type="button"
          onClick={apply}
          disabled={loading || !code.trim()}
          className="h-11 shrink-0 whitespace-nowrap border border-[var(--vert-fonce)] px-4 text-xs font-medium uppercase tracking-[0.1em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)] disabled:opacity-50"
        >
          {loading ? '…' : t('apply')}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--erreur)]">{error}</p>}
    </div>
  )
}

export default PromoCodeInput
