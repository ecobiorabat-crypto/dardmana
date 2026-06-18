import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { OperationsView, type OpsOrder, type OpsError, type OpsStats } from '@/components/admin/operations/OperationsView'

export const dynamic = 'force-dynamic'

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  totalMad: true,
  paymentMethod: true,
  orderStatus: true,
  shippingAddress: true,
  orderItems: { select: { productName: true, quantity: true } },
} as const

async function getData(): Promise<{ toShip: OpsOrder[]; errors: OpsError[]; stats: OpsStats; todayOrders: OpsOrder[] }> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  try {
    const [toShip, errors, byStatus, todayOrders] = await Promise.all([
      prisma.order.findMany({
        where: { orderStatus: { in: ['CONFIRMED', 'PROCESSING'] } },
        orderBy: { createdAt: 'asc' },
        select: ORDER_SELECT,
      }),
      prisma.order.findMany({
        where: { deliveryError: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, orderNumber: true, customerName: true, deliveryError: true, orderStatus: true },
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        where: { createdAt: { gte: todayStart } },
        _count: true,
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart } },
        orderBy: { createdAt: 'desc' },
        select: ORDER_SELECT,
      }),
    ])

    const count = (s: string) => byStatus.find((b) => b.orderStatus === s)?._count ?? 0
    const stats: OpsStats = {
      shipped: count('SHIPPED'),
      pending: count('NEW') + count('CONFIRMED') + count('PROCESSING'),
      delivered: count('DELIVERED'),
      cancelled: count('CANCELLED'),
    }

    return {
      toShip: JSON.parse(JSON.stringify(toShip)) as OpsOrder[],
      errors: JSON.parse(JSON.stringify(errors)) as OpsError[],
      stats,
      todayOrders: JSON.parse(JSON.stringify(todayOrders)) as OpsOrder[],
    }
  } catch {
    return { toShip: [], errors: [], stats: { shipped: 0, pending: 0, delivered: 0, cancelled: 0 }, todayOrders: [] }
  }
}

export default async function OperationsPage() {
  await requirePermission('operations.view')
  const data = await getData()

  return (
    <div>
      <PageHeader title="Opérations" subtitle="Gestion des expéditions du jour en temps réel" />
      <OperationsView {...data} />
    </div>
  )
}
