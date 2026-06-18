import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, EmptyState } from '@/components/admin/ui'
import { formatMad } from '@/lib/utils/price'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
type SP = Record<string, string | string[] | undefined>
function str(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePermission('customers.view')
  const sp = await searchParams
  const page = Math.max(1, Number(str(sp, 'page') ?? 1))
  const search = str(sp, 'search')

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  let customers: {
    id: string; name: string; email: string; country: string
    totalOrders: number; totalSpentMad: unknown; createdAt: Date
  }[] = []
  let total = 0
  try {
    ;[customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, name: true, email: true, country: true, totalOrders: true, totalSpentMad: true, createdAt: true },
      }),
      prisma.customer.count({ where }),
    ])
  } catch {
    customers = []; total = 0
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${total} client${total > 1 ? 's' : ''}`} />

      <form className="mb-6 flex max-w-md" action="/admin/clients" method="get">
        <input name="search" defaultValue={search ?? ''} placeholder="Rechercher par nom, email, téléphone…" className="w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]" />
        <button type="submit" className="ml-2 bg-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--creme)]">Rechercher</button>
      </form>

      <AdminCard className="!p-0">
        {customers.length === 0 ? (
          <EmptyState title="Aucun client" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Pays</th>
                  <th className="px-5 py-3 font-medium">Commandes</th>
                  <th className="px-5 py-3 font-medium">CA total</th>
                  <th className="px-5 py-3 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="group border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clients/${c.id}`} className="font-medium text-[var(--vert-fonce)] group-hover:underline">{c.name}</Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{c.email}</td>
                    <td className="px-5 py-3">{c.country}</td>
                    <td className="px-5 py-3">{c.totalOrders}</td>
                    <td className="px-5 py-3">{formatMad(Number(c.totalSpentMad))}</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-[var(--texte-doux)]">Page {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/clients?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page - 1) }).toString()}`} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">Précédent</Link>}
            {page < totalPages && <Link href={`/admin/clients?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page + 1) }).toString()}`} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">Suivant</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
