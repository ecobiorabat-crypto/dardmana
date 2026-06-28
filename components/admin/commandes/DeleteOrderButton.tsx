'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Bouton « Supprimer définitivement » avec modal de confirmation obligatoire.
 * - variant="icon"  : icône poubelle rouge (liste des commandes)
 * - variant="button": bouton plein (détail commande)
 * Appelle DELETE /api/admin/orders/[id] puis redirige (detail) ou rafraîchit (liste).
 */
export function DeleteOrderButton({
  orderId,
  orderNumber,
  variant = 'icon',
  redirectTo,
}: {
  orderId: string
  orderNumber: string
  variant?: 'icon' | 'button'
  redirectTo?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Suppression impossible')
      setOpen(false)
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
          aria-label={`Supprimer définitivement la commande ${orderNumber}`}
          title="Supprimer définitivement"
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--texte-doux)] transition-colors hover:bg-[var(--erreur)]/10 hover:text-[var(--erreur)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 bg-[var(--erreur)] px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Supprimer définitivement
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md border border-[var(--bordure)] bg-[var(--blanc)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-titre text-lg text-[var(--erreur)]">Suppression définitive</h3>
            <p className="mt-3 text-sm text-[var(--texte)]">
              Cette action est irréversible. La commande{' '}
              <strong>{orderNumber}</strong> sera supprimée définitivement. Confirmer ?
            </p>
            {error && <p className="mt-3 text-sm text-[var(--erreur)]">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="border border-[var(--bordure)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--texte)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="bg-[var(--erreur)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-white disabled:opacity-50"
              >
                {loading ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DeleteOrderButton
