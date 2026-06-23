import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, StatusBadge, PaymentBadge, EmptyState } from '@/components/admin/ui'
import { OrdersFilters } from '@/components/admin/commandes/OrdersFilters'
import { formatMad } from '@/lib/utils/price'
import type { Prisma, OrderStatus, OrderSource, PaymentMethod } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const SOURCE_LABELS: Record<string, string> = { SHOP: 'Boutique', WHATSAPP: 'WhatsApp', ADMIN: 'Admin' }

type SP = Record<string, string | string[] | undefined>

function str(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function CommandesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePermission('orders.view')
  const sp = await searchParams

  const page = Math.max(1, Number(str(sp, 'page') ?? 1))
  const status = str(sp, 'status') as OrderStatus | undefined
  const source = str(sp, 'source') as OrderSource | undefined
  const payment = str(sp, 'payment') as PaymentMethod | undefined
  const search = str(sp, 'search')
  const dateFrom = str(sp, 'dateFrom')
  const dateTo = str(sp, 'dateTo')

  const where: Prisma.OrderWhereInput = {
    ...(status && { orderStatus: status }),
    ...(source && { source }),
    ...(payment && { paymentMethod: payment }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59`) }),
      },
    }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' as const } },
        { customerName: { contains: search, mode: 'insensitive' as const } },
        { customerEmail: { contains: search, mode: 'insensitive' as const } },
        { customerPhone: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  let orders: {
    id: string; orderNumber: string; customerName: string; totalMad: unknown
    paymentMethod: string; paymentStatus: string; orderStatus: string; source: string; createdAt: Date
  }[] = []
  let total = 0
  try {
    ;[orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, orderNumber: true, customerName: true, totalMad: true,
          paymentMethod: true, paymentStatus: true, orderStatus: true, source: true, createdAt: true,
        },
      }),
      prisma.order.count({ where }),
    ])
  } catch {
    orders = []
    total = 0
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const buildPageHref = (p: number) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === 'string' && k !== 'page') next.set(k, v)
    next.set('page', String(p))
    return `/admin/commandes?${next.toString()}`
  }

  return (
    <div>
      <PageHeader
        title="Commandes"
        subtitle={`${total} commande${total > 1 ? 's' : ''}`}
        action={
          <Link
            href="/admin/commandes/nouvelle"
            className="bg-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)]"
          >
            + Nouvelle commande
          </Link>
        }
      />
      <OrdersFilters />

      <AdminCard className="!p-0">
        {orders.length === 0 ? (
          <EmptyState title="Aucune commande" hint="Ajustez vos filtres ou attendez de nouvelles ventes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Numéro</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Montant</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="group border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/commandes/${o.id}`} className="font-medium text-[var(--vert-fonce)] group-hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--texte)]">{o.customerName}</td>
                    <td className="px-5 py-3">{formatMad(Number(o.totalMad))}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-[var(--texte-doux)]">{o.paymentMethod}</span>{' · '}
                      <PaymentBadge status={o.paymentStatus} />
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-5 py-3 text-xs text-[var(--texte-doux)]">{SOURCE_LABELS[o.source] ?? o.source}</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
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
            {page > 1 && (
              <Link href={buildPageHref(page - 1)} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">
                Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildPageHref(page + 1)} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">
                Suivant
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
