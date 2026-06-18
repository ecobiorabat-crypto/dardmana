'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { archiveProductAction } from '@/app/admin/(panel)/actions'

export function ProductRowActions({
  id,
  slug,
  archived,
  canUpdate = true,
  canDelete = true,
}: {
  id: string
  slug: string
  archived: boolean
  canUpdate?: boolean
  canDelete?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const archive = () => {
    if (!confirm('Archiver ce produit ?')) return
    startTransition(async () => {
      await archiveProductAction(id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-3 text-xs">
      {canUpdate && (
        <Link href={`/admin/produits/${id}`} className="text-[var(--vert-fonce)] hover:underline">Éditer</Link>
      )}
      <a href={`/fr/produit/${slug}`} target="_blank" rel="noreferrer" className="text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]">Voir</a>
      {canDelete && !archived && (
        <button type="button" onClick={archive} disabled={pending} className="text-[var(--erreur)] hover:underline disabled:opacity-50">
          Archiver
        </button>
      )}
    </div>
  )
}

export default ProductRowActions
