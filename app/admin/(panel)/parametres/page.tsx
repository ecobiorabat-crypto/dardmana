import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { SettingsView, type ShippingRow, type AdminRow } from '@/components/admin/parametres/SettingsView'

export const dynamic = 'force-dynamic'

type SP = Record<string, string | string[] | undefined>
function str(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function ParametresPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireAdmin()
  const sp = await searchParams
  const accessDenied = str(sp, 'error') === 'access_denied'
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  const shipping = await prisma.shippingMethod
    .findMany({ orderBy: { sortOrder: 'asc' } })
    .catch(() => [])

  const adminUsers = await prisma.adminUser
    .findMany({
      where: { isActive: true },
      select: { email: true, name: true, role: true },
      orderBy: { createdAt: 'asc' },
    })
    .catch(() => [])

  const admins: AdminRow[] = adminUsers.map((u) => ({ email: u.email, name: u.name, role: u.role }))

  const general = {
    shopName: 'Dar Dmana',
    shopEmail: 'contact@dardmana.ma',
    currency: 'MAD',
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration de la boutique"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/parametres/general"
              className="border border-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
            >
              Identité &amp; logo
            </Link>
            <Link
              href="/admin/parametres/stats-marque"
              className="border border-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
            >
              Stats de marque
            </Link>
            <Link
              href="/admin/parametres/livraison"
              className="border border-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
            >
              Livraison
            </Link>
          </div>
        }
      />
      <SettingsView
        shipping={JSON.parse(JSON.stringify(shipping)) as ShippingRow[]}
        admins={admins}
        general={general}
        isSuperAdmin={isSuperAdmin}
        accessDenied={accessDenied}
      />
    </div>
  )
}
