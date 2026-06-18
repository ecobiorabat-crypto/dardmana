'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { INVITABLE_ROLES, type InvitableRole } from '@/lib/validations/admin-team'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import type { TeamMemberRow } from '@/components/admin/parametres/TeamView'

export function TeamRowActions({
  member,
  isSelf,
  onMessage,
  onError,
}: {
  member: TeamMemberRow
  isSelf: boolean
  onMessage: (msg: string, tempPassword?: string) => void
  onError: (msg: string) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isSuperAdmin = member.role === 'SUPER_ADMIN'

  const patch = (body: Record<string, unknown>) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string; tempPassword?: string; emailSent?: boolean }
      if (!res.ok) {
        onError(data.error ?? 'Erreur')
        return
      }
      if (data.tempPassword) {
        onMessage('Mot de passe réinitialisé. Copiez le mot de passe temporaire ci-dessous.', data.tempPassword)
      } else if (body.resetPassword) {
        onMessage(
          data.emailSent
            ? 'Email de réinitialisation envoyé.'
            : 'Mot de passe mis à jour, mais l\u2019email n\u2019a pas pu être envoyé.',
        )
      } else {
        onMessage('Administrateur mis à jour.')
      }
      router.refresh()
    })
  }

  const remove = () => {
    if (!confirm(`Supprimer définitivement « ${member.name} » ?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/team/${member.id}`, { method: 'DELETE', credentials: 'include' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        onError(data.error ?? 'Erreur')
        return
      }
      onMessage('Administrateur supprimé.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      {!isSuperAdmin && (
        <select
          value={member.role}
          disabled={pending}
          onChange={(e) => patch({ role: e.target.value as InvitableRole })}
          className="border border-[var(--bordure)] px-2 py-1 text-xs text-[var(--texte)]"
          aria-label={`Rôle de ${member.name}`}
        >
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      )}

      {!isSelf && (
        <button
          type="button"
          disabled={pending}
          onClick={() => patch({ isActive: !member.isActive })}
          className="text-[var(--vert-fonce)] hover:underline disabled:opacity-50"
        >
          {member.isActive ? 'Désactiver' : 'Réactiver'}
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const mode = confirm('Envoyer un lien d\u2019invitation ? (Annuler = mot de passe temporaire)')
            ? 'invite'
            : 'temp_password'
          patch({ resetPassword: mode })
        }}
        className="text-[var(--texte-doux)] hover:text-[var(--vert-fonce)] hover:underline disabled:opacity-50"
      >
        Réinit. MDP
      </button>

      {!isSelf && !isSuperAdmin && (
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="text-[var(--erreur)] hover:underline disabled:opacity-50"
        >
          Supprimer
        </button>
      )}
    </div>
  )
}

export default TeamRowActions
