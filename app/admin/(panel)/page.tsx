import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader, StatCard, AdminCard, StatusBadge, EmptyState } from '@/components/admin/ui'
import { RevenueChart, type RevenuePoint } from '@/components/admin/charts/RevenueChart'
import { formatMad } from '@/lib/utils/price'

export const dynamic = 'force-dynamic'

interface DashboardData {
  revToday: number
  revYesterday: number
  ordersToday: number
  pendingAction: number
  criticalCount: number
  lowStock: { id: string; slug: string; nameFr: string; stock: number; lowStockThreshold: number; images: string[] }[]
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    totalMad: number | string
    orderStatus: string
    createdAt: string
  }[]
  series: RevenuePoint[]
}

async function getDashboard(): Promise<DashboardData> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const monthAgo = new Date(todayStart)
  monthAgo.setDate(monthAgo.getDate() - 29)

  try {
    const [revToday, revYesterday, ordersToday, pendingAction, activeProducts, recentOrders, paidOrders] =
      await Promise.all([
        prisma.order.aggregate({ _sum: { totalMad: true }, where: { createdAt: { gte: todayStart }, paymentStatus: 'PAID' } }),
        prisma.order.aggregate({
          _sum: { totalMad: true },
          where: { createdAt: { gte: yesterdayStart, lt: todayStart }, paymentStatus: 'PAID' },
        }),
        prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.order.count({ where: { orderStatus: { in: ['NEW', 'CONFIRMED'] } } }),
        prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, slug: true, nameFr: true, stock: true, lowStockThreshold: true, images: true },
          orderBy: { stock: 'asc' },
        }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, customerName: true, totalMad: true, orderStatus: true, createdAt: true },
        }),
        prisma.order.findMany({
          where: { createdAt: { gte: monthAgo }, paymentStatus: 'PAID' },
          select: { createdAt: true, totalMad: true },
        }),
      ])

    const lowStock = activeProducts.filter((p) => p.stock <= p.lowStockThreshold)

    // Série 30 jours zéro-remplie
    const byDay = new Map<string, number>()
    for (const o of paidOrders) {
      const key = o.createdAt.toISOString().split('T')[0]
      byDay.set(key, (byDay.get(key) ?? 0) + Number(o.totalMad))
    }
    const series: RevenuePoint[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(monthAgo)
      d.setDate(monthAgo.getDate() + i)
      const key = d.toISOString().split('T')[0]
      series.push({
        date: key,
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        revenue: Math.round(byDay.get(key) ?? 0),
        orders: 0,
      })
    }

    return {
      revToday: Number(revToday._sum.totalMad ?? 0),
      revYesterday: Number(revYesterday._sum.totalMad ?? 0),
      ordersToday,
      pendingAction,
      criticalCount: lowStock.length,
      lowStock: JSON.parse(JSON.stringify(lowStock)),
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      series,
    }
  } catch {
    return {
      revToday: 0, revYesterday: 0, ordersToday: 0, pendingAction: 0, criticalCount: 0,
      lowStock: [], recentOrders: [], series: [],
    }
  }
}

export default async function AdminDashboardPage() {
  const d = await getDashboard()

  const variation =
    d.revYesterday > 0
      ? Math.round(((d.revToday - d.revYesterday) / d.revYesterday) * 100)
      : null

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="CA aujourd'hui"
          value={formatMad(d.revToday)}
          accent="gold"
          trend={variation !== null ? { value: `${Math.abs(variation)}% vs hier`, positive: variation >= 0 } : undefined}
          hint={variation === null ? 'vs hier' : undefined}
        />
        <StatCard label="Commandes aujourd'hui" value={String(d.ordersToday)} accent="green" />
        <StatCard label="En attente d'action" value={String(d.pendingAction)} accent="gold" hint="à confirmer/préparer" />
        <StatCard label="Stock critique" value={String(d.criticalCount)} accent="red" hint="produits sous le seuil" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Revenus — 30 derniers jours</h2>
          {d.series.some((s) => s.revenue > 0) ? (
            <RevenueChart data={d.series} />
          ) : (
            <EmptyState title="Pas encore de revenus" hint="Les ventes payées apparaîtront ici." />
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Alertes stock</h2>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-[var(--texte-doux)]">Aucune alerte stock. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {d.lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="h-10 w-9 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--texte)]">{p.nameFr}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      color: p.stock === 0 ? 'var(--erreur)' : 'var(--alerte)',
                      background: p.stock === 0 ? 'color-mix(in srgb, var(--erreur) 12%, transparent)' : 'color-mix(in srgb, var(--alerte) 14%, transparent)',
                    }}
                  >
                    {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/stock" className="mt-4 inline-block text-xs text-[var(--vert-fonce)] underline-offset-2 hover:underline">
            Gérer le stock →
          </Link>
        </AdminCard>
      </div>

      <AdminCard className="mt-6">
        <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">10 dernières commandes</h2>
        {d.recentOrders.length === 0 ? (
          <EmptyState title="Aucune commande" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="py-2.5 pr-4 font-medium">Numéro</th>
                  <th className="py-2.5 pr-4 font-medium">Client</th>
                  <th className="py-2.5 pr-4 font-medium">Montant</th>
                  <th className="py-2.5 pr-4 font-medium">Statut</th>
                  <th className="py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/commandes/${o.id}`} className="font-medium text-[var(--vert-fonce)] hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-[var(--texte)]">{o.customerName}</td>
                    <td className="py-3 pr-4">{formatMad(Number(o.totalMad))}</td>
                    <td className="py-3 pr-4"><StatusBadge status={o.orderStatus} /></td>
                    <td className="py-3 text-[var(--texte-doux)]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
