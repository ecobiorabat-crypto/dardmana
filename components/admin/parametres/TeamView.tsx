'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, type AdminRole } from '@/lib/auth/permissions'
import { INVITABLE_ROLES, type InvitableRole } from '@/lib/validations/admin-team'
import { TeamRowActions } from '@/components/admin/parametres/TeamRowActions'

export interface TeamMemberRow {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const inputCls = 'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TeamView({ initial, currentEmail }: { initial: TeamMemberRow[]; currentEmail: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tempPasswordReveal, setTempPasswordReveal] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'MANAGER' as InvitableRole,
    onboarding: 'invite' as 'temp_password' | 'invite',
  })

  const invite = () => {
    setError(null)
    setSuccess(null)
    setTempPasswordReveal(null)

    startTransition(async () => {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as {
        error?: string
        tempPassword?: string
        emailSent?: boolean
      }

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création')
        return
      }

      setInviteOpen(false)
      setForm({ email: '', name: '', role: 'MANAGER', onboarding: 'invite' })

      if (data.tempPassword) {
        setTempPasswordReveal(data.tempPassword)
        setSuccess('Compte créé. Copiez le mot de passe temporaire ci-dessous (il ne sera plus affiché).')
      } else {
        setSuccess(
          data.emailSent
            ? 'Invitation envoyée par email.'
            : 'Compte créé, mais l\u2019email n\u2019a pas pu être envoyé (vérifiez RESEND_API_KEY).',
        )
      }

      router.refresh()
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-4 py-3 text-sm text-[var(--erreur)]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-[var(--vert-moyen)]/40 bg-[color-mix(in_srgb,var(--vert-moyen)_8%,transparent)] px-4 py-3 text-sm text-[var(--vert-fonce)]">
          {success}
          {tempPasswordReveal && (
            <p className="mt-2 font-mono text-base tracking-wider">{tempPasswordReveal}</p>
          )}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="bg-[var(--or-royal)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--noir)]"
        >
          + Inviter un admin
        </button>
      </div>

      <div className="overflow-x-auto border border-[var(--bordure)] bg-[var(--blanc)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
              <th className="px-5 py-3 font-medium">Nom</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Rôle</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium">Dernière connexion</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((admin) => (
              <tr
                key={admin.id}
                className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40"
              >
                <td className="px-5 py-3 font-medium text-[var(--texte)]">{admin.name}</td>
                <td className="px-5 py-3 text-[var(--texte-doux)]">{admin.email}</td>
                <td className="px-5 py-3">{ROLE_LABELS[admin.role] ?? admin.role}</td>
                <td className="px-5 py-3">
                  <span style={{ color: admin.isActive ? 'var(--vert-moyen)' : 'var(--texte-doux)' }}>
                    {admin.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[var(--texte-doux)]">{formatDate(admin.lastLoginAt)}</td>
                <td className="px-5 py-3">
                  <TeamRowActions
                    member={admin}
                    isSelf={admin.email.toLowerCase() === currentEmail.toLowerCase()}
                    onMessage={(msg, temp?) => {
                      setSuccess(msg)
                      setError(null)
                      setTempPasswordReveal(temp ?? null)
                    }}
                    onError={(msg) => {
                      setError(msg)
                      setSuccess(null)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !pending && setInviteOpen(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md border border-[var(--bordure)] bg-[var(--blanc)] p-6 shadow-xl">
            <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Inviter un administrateur</h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nom *</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Rôle *</label>
                <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as InvitableRole })}>
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mode d&apos;accès</label>
                <select
                  className={inputCls}
                  value={form.onboarding}
                  onChange={(e) => setForm({ ...form, onboarding: e.target.value as 'temp_password' | 'invite' })}
                >
                  <option value="invite">Lien d&apos;invitation par email (définir mot de passe)</option>
                  <option value="temp_password">Mot de passe temporaire par email</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={invite}
                disabled={pending || !form.email || !form.name}
                className="bg-[var(--vert-fonce)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--creme)] disabled:opacity-50"
              >
                {pending ? 'Envoi…' : 'Créer le compte'}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                disabled={pending}
                className="border border-[var(--bordure)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--texte)]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamView
