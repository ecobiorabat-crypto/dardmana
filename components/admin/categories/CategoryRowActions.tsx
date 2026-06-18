'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function CategoryRowActions({ id, isActive, nameFr }: { id: string; isActive: boolean; nameFr: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const deactivate = () => {
    if (!confirm(`Désactiver la catégorie « ${nameFr} » ?`)) return
    startTransition(async () => {
      await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'include' })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-3 text-xs">
      <Link href={`/admin/categories/${id}`} className="text-[var(--vert-fonce)] hover:underline">
        Éditer
      </Link>
      {isActive && (
        <button
          type="button"
          onClick={deactivate}
          disabled={pending}
          className="text-[var(--erreur)] hover:underline disabled:opacity-50"
        >
          Désactiver
        </button>
      )}
    </div>
  )
}

export default CategoryRowActions
