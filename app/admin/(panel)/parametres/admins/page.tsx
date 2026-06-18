import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { TeamView, type TeamMemberRow } from '@/components/admin/parametres/TeamView'

export const dynamic = 'force-dynamic'

export default async function AdminsEquipePage() {
  const session = await requireSuperAdmin()

  const admins = await prisma.adminUser
    .findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    .catch(() => [])

  const rows: TeamMemberRow[] = admins.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <div>
      <PageHeader
        title="Équipe admin"
        subtitle={`${rows.length} compte${rows.length > 1 ? 's' : ''} · accès réservé Super Admin`}
        action={
          <Link
            href="/admin/parametres"
            className="border border-[var(--bordure)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--texte)]"
          >
            ← Paramètres
          </Link>
        }
      />
      <TeamView initial={rows} currentEmail={session.adminEmail} />
    </div>
  )
}
