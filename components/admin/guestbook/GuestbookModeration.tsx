'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export interface AdminGuestbookEntry {
  id: string
  customerName: string
  customerCity: string | null
  message: string
  rating: number | null
  mediaUrl: string | null
  mediaType: 'PHOTO' | 'VIDEO' | null
  productTag: string | null
  source: 'WEBSITE' | 'WHATSAPP' | 'TIKTOK' | 'INSTAGRAM'
  likesCount: number
  isVerifiedBuyer: boolean
  isApproved: boolean
  isFeatured: boolean
  createdAt: string
}

type TabId = 'pending' | 'approved' | 'featured' | 'all'

const TABS: { id: TabId; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Approuvés' },
  { id: 'featured', label: 'Mis en avant' },
  { id: 'all', label: 'Tous' },
]

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

export function GuestbookModeration({
  initialEntries,
  initialPending,
}: {
  initialEntries: AdminGuestbookEntry[]
  initialPending: number
}) {
  const [tab, setTab] = useState<TabId>('pending')
  const [entries, setEntries] = useState<AdminGuestbookEntry[]>(initialEntries)
  const [pending, setPending] = useState(initialPending)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchTab = useCallback(async (next: TabId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/guestbook?status=${next}`, { credentials: 'include' })
      const data = await res.json()
      setEntries(Array.isArray(data.entries) ? data.entries : [])
      if (typeof data.pendingCount === 'number') setPending(data.pendingCount)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  function switchTab(next: TabId) {
    if (next === tab) return
    setTab(next)
    void fetchTab(next)
  }

  async function patch(id: string, body: Record<string, boolean>) {
    setBusyId(id)
    try {
      await fetch(`/api/admin/guestbook/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      await fetchTab(tab)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer définitivement ce témoignage ?')) return
    setBusyId(id)
    try {
      await fetch(`/api/admin/guestbook/${id}`, { method: 'DELETE', credentials: 'include' })
      await fetchTab(tab)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => switchTab(tabItem.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
              tab === tabItem.id
                ? 'border-[var(--vert-fonce)] bg-[var(--vert-fonce)] text-[var(--creme)]'
                : 'border-[var(--bordure)] text-[var(--texte)] hover:border-[var(--or-royal)]',
            )}
          >
            {tabItem.label}
            {tabItem.id === 'pending' && pending > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--erreur)] px-1.5 text-[0.65rem] font-semibold text-white">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-[var(--texte-doux)]">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="border border-dashed border-[var(--bordure)] py-16 text-center text-sm text-[var(--texte-doux)]">
          Aucun témoignage dans cette catégorie.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-4 border border-[var(--bordure)] bg-[var(--blanc)] p-4 sm:flex-row sm:items-start"
            >
              {/* Média miniature */}
              {entry.mediaUrl && (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-[var(--gris-perle)]">
                  {isVideoUrl(entry.mediaUrl) ? (
                    <video src={entry.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.mediaUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )}

              {/* Contenu */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--texte)]">{entry.customerName}</span>
                  {entry.customerCity && (
                    <span className="text-xs text-[var(--texte-doux)]">· {entry.customerCity}</span>
                  )}
                  <span className="rounded-full bg-[var(--gris-perle)] px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-[var(--texte-doux)]">
                    {entry.source}
                  </span>
                  {entry.rating && (
                    <span className="text-xs text-[var(--or-royal)]">{'★'.repeat(entry.rating)}</span>
                  )}
                  {entry.isApproved && (
                    <span className="rounded-full bg-[var(--vert-moyen)]/15 px-2 py-0.5 text-[0.6rem] uppercase text-[var(--vert-moyen)]">
                      Approuvé
                    </span>
                  )}
                  {entry.isFeatured && (
                    <span className="rounded-full bg-[var(--or-royal)]/20 px-2 py-0.5 text-[0.6rem] uppercase text-[var(--or-royal)]">
                      ⭐ Vedette
                    </span>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-[var(--texte-doux)]">{entry.message}</p>
                <p className="mt-1 text-[0.7rem] text-[var(--texte-doux)]">
                  {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {entry.productTag ? ` · ${entry.productTag}` : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                {!entry.isApproved ? (
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => patch(entry.id, { isApproved: true })}
                    className="rounded border border-[var(--vert-moyen)] px-3 py-1.5 text-xs text-[var(--vert-moyen)] transition-colors hover:bg-[var(--vert-moyen)] hover:text-white disabled:opacity-50"
                  >
                    ✓ Approuver
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => patch(entry.id, { isApproved: false, isFeatured: false })}
                    className="rounded border border-[var(--bordure)] px-3 py-1.5 text-xs text-[var(--texte-doux)] transition-colors hover:border-[var(--alerte)] hover:text-[var(--alerte)] disabled:opacity-50"
                  >
                    ✗ Retirer
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === entry.id}
                  onClick={() => patch(entry.id, { isFeatured: !entry.isFeatured, isApproved: true })}
                  className={cn(
                    'rounded border px-3 py-1.5 text-xs transition-colors disabled:opacity-50',
                    entry.isFeatured
                      ? 'border-[var(--or-royal)] bg-[var(--or-royal)]/15 text-[var(--or-royal)]'
                      : 'border-[var(--bordure)] text-[var(--texte-doux)] hover:border-[var(--or-royal)] hover:text-[var(--or-royal)]',
                  )}
                >
                  ⭐ {entry.isFeatured ? 'En avant' : 'Mettre en avant'}
                </button>
                <button
                  type="button"
                  disabled={busyId === entry.id}
                  onClick={() => remove(entry.id)}
                  className="rounded border border-[var(--bordure)] px-3 py-1.5 text-xs text-[var(--texte-doux)] transition-colors hover:border-[var(--erreur)] hover:text-[var(--erreur)] disabled:opacity-50"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GuestbookModeration
