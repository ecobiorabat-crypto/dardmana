import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, StatCard, EmptyState } from '@/components/admin/ui'
import { BarChartCard, type BarDatum } from '@/components/admin/charts/BarChartCard'
import { PieChartCard, type PieDatum } from '@/components/admin/charts/PieChartCard'
import { formatMad } from '@/lib/utils/price'

export const dynamic = 'force-dynamic'

const SOURCE_LABELS: Record<string, string> = { SHOP: 'Boutique', WHATSAPP: 'WhatsApp', ADMIN: 'Admin' }
const COUNTRY_LABELS: Record<string, string> = { MA: 'Maroc', FR: 'France', BE: 'Belgique', ES: 'Espagne', US: 'États-Unis', CA: 'Canada', GB: 'Royaume-Uni', DE: 'Allemagne' }

function startOf(unit: 'day' | 'week' | 'month' | 'year'): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (unit === 'week') d.setDate(d.getDate() - d.getDay())
  if (unit === 'month') d.setDate(1)
  if (unit === 'year') { d.setMonth(0); d.setDate(1) }
  return d
}

interface Analytics {
  revDay: number; revWeek: number; revMonth: number; revYear: number
  topProducts: BarDatum[]
  countries: PieDatum[]
  payments: PieDatum[]
  sources: PieDatum[]
}

async function getAnalytics(): Promise<Analytics> {
  try {
    const paidWhere = { paymentStatus: 'PAID' as const }
    const [rD, rW, rM, rY, top, paidOrders, byPayment, bySource] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { ...paidWhere, createdAt: { gte: startOf('day') } } }),
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { ...paidWhere, createdAt: { gte: startOf('week') } } }),
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { ...paidWhere, createdAt: { gte: startOf('month') } } }),
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { ...paidWhere, createdAt: { gte: startOf('year') } } }),
      prisma.product.findMany({ where: { salesCount: { gt: 0 } }, orderBy: { salesCount: 'desc' }, take: 10, select: { nameFr: true, salesCount: true } }),
      prisma.order.findMany({ where: paidWhere, select: { shippingAddress: true } }),
      prisma.order.groupBy({ by: ['paymentMethod'], where: paidWhere, _count: true }),
      prisma.order.groupBy({ by: ['source'], _count: true }),
    ])

    const countryMap = new Map<string, number>()
    for (const o of paidOrders) {
      const addr = o.shippingAddress as { country?: string } | null
      const c = addr?.country || 'MA'
      countryMap.set(c, (countryMap.get(c) ?? 0) + 1)
    }

    return {
      revDay: Number(rD._sum.totalMad ?? 0),
      revWeek: Number(rW._sum.totalMad ?? 0),
      revMonth: Number(rM._sum.totalMad ?? 0),
      revYear: Number(rY._sum.totalMad ?? 0),
      topProducts: top.map((p) => ({ label: p.nameFr, value: p.salesCount })),
      countries: [...countryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ label: COUNTRY_LABELS[k] ?? k, value: v })),
      payments: byPayment.map((p) => ({ label: p.paymentMethod, value: p._count })),
      sources: bySource.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, value: s._count })),
    }
  } catch {
    return { revDay: 0, revWeek: 0, revMonth: 0, revYear: 0, topProducts: [], countries: [], payments: [], sources: [] }
  }
}

export default async function AnalyticsPage() {
  await requirePermission('analytics.view')
  const a = await getAnalytics()

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance commerciale" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CA aujourd'hui" value={formatMad(a.revDay)} accent="gold" />
        <StatCard label="CA cette semaine" value={formatMad(a.revWeek)} accent="green" />
        <StatCard label="CA ce mois" value={formatMad(a.revMonth)} accent="gold" />
        <StatCard label="CA cette année" value={formatMad(a.revYear)} accent="green" />
      </div>

      <AdminCard className="mt-8">
        <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Top 10 produits vendus</h2>
        {a.topProducts.length === 0 ? <EmptyState title="Pas encore de ventes" /> : <BarChartCard data={a.topProducts} unit=" ventes" />}
      </AdminCard>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard>
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Répartition par pays</h2>
          <PieChartCard data={a.countries} />
        </AdminCard>
        <AdminCard>
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Méthodes de paiement</h2>
          <PieChartCard data={a.payments} />
        </AdminCard>
        <AdminCard>
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Commandes par source</h2>
          <PieChartCard data={a.sources} />
        </AdminCard>
      </div>
    </div>
  )
}
